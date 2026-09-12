"""
Single entry point for pending sample creation and collection attempt numbering.

recollectionAttempt scale (matches UI 1..MAX_RECOLLECTION_ATTEMPTS):
  1 = initial collection tube
  2 = first recollection tube, etc.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models import Order, OrderTest, Sample, Test
from app.schemas.enums import PriorityLevel, SampleStatus, SampleType, TestStatus
from app.data.lab_constants import MAX_RECOLLECTION_ATTEMPTS
from app.utils.exceptions import LabOperationError


class SampleCollectionService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def next_collection_attempt(after_sample: Sample | None) -> int:
        if after_sample is None:
            return 1
        return (after_sample.recollectionAttempt or 1) + 1

    @staticmethod
    def attempts_used(sample: Sample) -> int:
        """Collection slots consumed on the 1..MAX scale (0 before first tube)."""
        return max(0, (sample.recollectionAttempt or 1) - 1)

    @staticmethod
    def attempts_remaining_after(sample: Sample) -> int:
        """How many more collection tubes may still be created after this sample."""
        return max(0, MAX_RECOLLECTION_ATTEMPTS - (sample.recollectionAttempt or 1))

    def can_request_recollection(self, source_sample: Sample) -> bool:
        return self.next_collection_attempt(source_sample) <= MAX_RECOLLECTION_ATTEMPTS

    def assert_can_request_recollection(self, source_sample: Sample) -> None:
        if not self.can_request_recollection(source_sample):
            raise LabOperationError(
                f"Maximum collection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached.",
                status_code=400,
            )

    def create_initial_pending_sample(
        self,
        *,
        order_id: int,
        sample_type: SampleType,
        test_codes: list[str],
        required_volume: float,
        priority: PriorityLevel,
        required_container_types: list[Any],
        required_container_colors: list[Any],
        created_by: int,
    ) -> Sample:
        """Create the first pending tube for a sample type (attempt 1)."""
        sample = Sample(
            orderId=order_id,
            sampleType=sample_type,
            status=SampleStatus.PENDING,
            testCodes=list(test_codes),
            requiredVolume=required_volume,
            priority=priority,
            requiredContainerTypes=list(required_container_types),
            requiredContainerColors=list(required_container_colors),
            isRecollection=False,
            recollectionAttempt=1,
            createdBy=str(created_by),
            updatedBy=str(created_by),
        )
        self.db.add(sample)
        self.db.flush()
        return sample

    def request_recollection(
        self,
        source_sample: Sample,
        user_id: int,
        reason: str,
        *,
        test_codes: Optional[list[str]] = None,
        priority: Optional[PriorityLevel] = None,
        supervisor_authorized: bool = False,
    ) -> Sample:
        """
        Create a pending recollection tube after rejection or supervisor authorization.
        Idempotent when a pending recollection already exists for the source sample.

        Automatic quality-issue flows enforce MAX_RECOLLECTION_ATTEMPTS. Supervisor escalation
        resolution (authorize_recollect) may pass supervisor_authorized=True to allow one more tube.
        """
        if source_sample.recollectionSampleId:
            existing = self.db.query(Sample).filter(
                Sample.sampleId == source_sample.recollectionSampleId
            ).first()
            if existing and existing.status == SampleStatus.PENDING and existing.collectedAt is None:
                return existing
            if existing:
                raise LabOperationError(
                    f"Recollection sample {existing.sampleId} is not pending",
                    status_code=400,
                )

        if not supervisor_authorized:
            self.assert_can_request_recollection(source_sample)
        next_attempt = self.next_collection_attempt(source_sample)

        new_sample = Sample(
            orderId=source_sample.orderId,
            sampleType=source_sample.sampleType,
            status=SampleStatus.PENDING,
            testCodes=list(test_codes or source_sample.testCodes or []),
            requiredVolume=source_sample.requiredVolume,
            priority=priority or PriorityLevel.URGENT,
            requiredContainerTypes=source_sample.requiredContainerTypes,
            requiredContainerColors=source_sample.requiredContainerColors,
            isRecollection=True,
            originalSampleId=source_sample.sampleId,
            recollectionReason=reason,
            recollectionAttempt=next_attempt,
            createdAt=datetime.now(timezone.utc),
            createdBy=str(user_id),
            updatedBy=str(user_id),
        )
        self.db.add(new_sample)
        self.db.flush()

        source_sample.recollectionSampleId = new_sample.sampleId
        source_sample.updatedBy = str(user_id)
        return new_sample


def _normalize_sample_type(sample_type: str | SampleType) -> SampleType:
    """Normalize Test.sampleType (string) to SampleType enum for comparison and assignment."""
    if isinstance(sample_type, SampleType):
        return sample_type
    # Catalog may store lowercase e.g. "blood"
    try:
        return SampleType(sample_type)
    except ValueError:
        return SampleType(sample_type.upper() if sample_type.isupper() else sample_type.lower())


def _sample_type_matches(sample: Sample, sample_type_key: str | SampleType) -> bool:
    """True if sample's type matches the key (string or enum)."""
    st = _normalize_sample_type(sample_type_key)
    return sample.sampleType == st


def generate_samples_for_order(orderId: int, db: Session, createdBy: int) -> List[Sample]:
    """
    Sync samples for an order: one active pending sample per sample type.
    Groups active tests by sample type; updates the pending/recollection sample or creates one.
    Rejected tubes are never reused for new or pending tests.
    """
    order = db.query(Order).filter(Order.orderId == orderId).first()
    if not order:
        raise ValueError(f"Order {orderId} not found")

    order_tests = (
        db.query(OrderTest)
        .filter(
            OrderTest.orderId == orderId,
            OrderTest.status.notin_([TestStatus.SUPERSEDED, TestStatus.REMOVED]),
        )
        .all()
    )
    if not order_tests:
        # No active tests: remove all PENDING samples for this order (obsolete)
        _delete_pending_samples_for_order(orderId, db, set())
        return []

    # Group active tests by sample type (key: string from Test.sampleType for consistency)
    sample_groups: Dict[str, List[Tuple[OrderTest, Test]]] = {}
    for order_test in order_tests:
        test = db.query(Test).filter(Test.code == order_test.testCode).first()
        if not test:
            continue
        sample_type_key = test.sampleType
        if sample_type_key not in sample_groups:
            sample_groups[sample_type_key] = []
        sample_groups[sample_type_key].append((order_test, test))

    existing_samples = db.query(Sample).filter(Sample.orderId == orderId).all()
    collection = SampleCollectionService(db)
    samples: List[Sample] = []
    for sample_type_key, test_list in sample_groups.items():
        total_volume = 0.0
        test_codes: List[str] = []
        container_types_set: set = set()
        container_colors_set: set = set()
        for _order_test, test in test_list:
            test_codes.append(test.code)
            if test.minimumVolume:
                total_volume += test.minimumVolume
            if test.containerTypes:
                container_types_set.update(test.containerTypes)
            if test.containerTopColors:
                container_colors_set.update(test.containerTopColors)

        sample_type_enum = _normalize_sample_type(sample_type_key)
        existing = [s for s in existing_samples if _sample_type_matches(s, sample_type_key)]
        active = _choose_active_sample(existing)

        if active:
            _update_sample(
                active,
                test_codes=test_codes,
                required_volume=total_volume,
                container_types=list(container_types_set),
                container_colors=list(container_colors_set),
                priority=order.priority,
                updated_by=createdBy,
            )
            _dedupe_pending_samples(db, orderId, active, existing)
            samples.append(active)
        else:
            latest_rejected = _latest_rejected_sample(existing)
            pending_recollection = _pending_recollection_sample(existing, latest_rejected)
            if pending_recollection:
                _update_sample(
                    pending_recollection,
                    test_codes=test_codes,
                    required_volume=total_volume,
                    container_types=list(container_types_set),
                    container_colors=list(container_colors_set),
                    priority=order.priority,
                    updated_by=createdBy,
                )
                _dedupe_pending_samples(db, orderId, pending_recollection, existing)
                samples.append(pending_recollection)
            elif not latest_rejected:
                sample = collection.create_initial_pending_sample(
                    order_id=orderId,
                    sample_type=sample_type_enum,
                    test_codes=test_codes,
                    required_volume=total_volume,
                    priority=order.priority,
                    required_container_types=list(container_types_set),
                    required_container_colors=list(container_colors_set),
                    created_by=createdBy,
                )
                samples.append(sample)

    # Delete obsolete: samples for this order whose type is not in sample_groups
    desired_types = {_normalize_sample_type(k) for k in sample_groups}
    _delete_pending_samples_for_order(orderId, db, desired_types)

    # Link order tests to the single sample for their type
    _link_order_tests_to_samples(db, orderId, samples)

    return samples


def _update_sample(
    sample: Sample,
    *,
    test_codes: List[str],
    required_volume: float,
    container_types: List[Any],
    container_colors: List[Any],
    priority: PriorityLevel,
    updated_by: int,
) -> None:
    sample.testCodes = test_codes
    sample.requiredVolume = required_volume
    sample.requiredContainerTypes = container_types
    sample.requiredContainerColors = container_colors
    sample.priority = priority
    sample.updatedBy = str(updated_by)
    sample.updatedAt = datetime.now(timezone.utc)


def _choose_active_sample(existing: List[Sample]) -> Sample | None:
    """
    Return the pending, uncollected sample that should receive active tests.

    Rejected/collected tubes are historical — never reuse them when syncing tests.
    """
    pending = [
        s for s in existing
        if s.status == SampleStatus.PENDING and s.collectedAt is None
    ]
    if not pending:
        return None
    recollection = [s for s in pending if s.isRecollection]
    pool = recollection if recollection else pending
    return max(pool, key=lambda s: s.sampleId)


def _dedupe_pending_samples(
    db: Session,
    order_id: int,
    keep: Sample,
    existing: List[Sample],
) -> None:
    """Remove duplicate pending samples for the same type, reassigning tests to keep."""
    for s in existing:
        if (
            s.sampleId != keep.sampleId
            and s.status == SampleStatus.PENDING
            and s.collectedAt is None
            and _sample_type_matches(s, keep.sampleType)
        ):
            _reassign_order_tests_to_sample(
                db, order_id, from_sample_id=s.sampleId, to_sample_id=keep.sampleId
            )
            db.delete(s)


def _latest_rejected_sample(existing: List[Sample]) -> Sample | None:
    rejected = [s for s in existing if s.status == SampleStatus.REJECTED]
    if not rejected:
        return None
    return max(rejected, key=lambda s: s.sampleId)


def _pending_recollection_sample(
    existing: List[Sample],
    latest_rejected: Sample | None,
) -> Sample | None:
    """Return the pending recollection tube created by the quality workflow, if any."""
    if not latest_rejected or not latest_rejected.recollectionSampleId:
        return None
    recollection = next(
        (s for s in existing if s.sampleId == latest_rejected.recollectionSampleId),
        None,
    )
    if (
        recollection
        and recollection.status == SampleStatus.PENDING
        and recollection.collectedAt is None
    ):
        return recollection
    return None


def _reassign_order_tests_to_sample(
    db: Session, order_id: int, from_sample_id: int, to_sample_id: int
) -> None:
    db.query(OrderTest).filter(
        OrderTest.orderId == order_id,
        OrderTest.sampleId == from_sample_id,
    ).update({OrderTest.sampleId: to_sample_id}, synchronize_session="fetch")


def _delete_pending_samples_for_order(
    order_id: int, db: Session, keep_sample_types: set
) -> None:
    """Delete samples for this order that are PENDING, not collected, and not in keep_sample_types."""
    to_delete = (
        db.query(Sample)
        .filter(
            Sample.orderId == order_id,
            Sample.status == SampleStatus.PENDING,
            Sample.collectedAt.is_(None),
        )
        .all()
    )
    for s in to_delete:
        if s.sampleType not in keep_sample_types:
            db.delete(s)


def _link_order_tests_to_samples(db: Session, order_id: int, samples: List[Sample]) -> None:
    """Link collectable order tests to the active pending sample for their type."""
    linkable_statuses = [
        TestStatus.PENDING,
        TestStatus.SAMPLE_COLLECTED,
    ]
    for sample in samples:
        if not sample.testCodes:
            continue
        db.query(OrderTest).filter(
            OrderTest.orderId == order_id,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.status.in_(linkable_statuses),
        ).update({OrderTest.sampleId: sample.sampleId}, synchronize_session="fetch")


class SampleService:
    """Read/query operations for samples."""

    def __init__(self, db: Session):
        self.db = db

    def list_samples(
        self,
        skip: int,
        limit: int,
        order_id: Optional[int] = None,
        sample_status: Optional[SampleStatus] = None,
        paginated: bool = False,
    ):
        from fastapi import HTTPException, status as http_status
        from app.schemas.sample import SampleResponse
        from app.schemas.pagination import create_paginated_response, skip_to_page

        query = self.db.query(Sample)
        if order_id:
            query = query.filter(Sample.orderId == order_id)
        if sample_status:
            query = query.filter(Sample.status == sample_status)
        query = query.order_by(Sample.updatedAt.desc())
        total = query.count() if paginated else 0
        samples = query.offset(skip).limit(limit).all()
        try:
            serialized = [SampleResponse.model_validate(s).model_dump(mode="json") for s in samples]
        except Exception:
            import logging
            logging.getLogger(__name__).exception("Error serializing samples")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error processing sample data",
            )
        if paginated:
            return create_paginated_response(serialized, total, skip_to_page(skip, limit), limit)
        return serialized

    def list_pending(self) -> list:
        return (
            self.db.query(Sample)
            .filter(Sample.status == SampleStatus.PENDING)
            .order_by(Sample.updatedAt.desc())
            .all()
        )

    def get_by_id(self, sample_id: int) -> Sample:
        from fastapi import HTTPException, status as http_status

        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Sample {sample_id} not found",
            )
        return sample

from __future__ import annotations

# --- from specimen/accession.py ---

"""Yearly sequential accession numbers (YY-NNNNN) assigned as the sample row id."""
from app.domains.lab.specimen.models import Sample
from app.shared.identifiers import allocate_accession_number, format_aliquot_accession
from sqlalchemy.orm import Session


def assign_accession_number(db: Session, sample: Sample, parent: Sample | None = None) -> str:
    """
    Allocate the next yearly accession and store it as ``sample.sampleId``.

    Aliquots inherit ``{parentAccession}.{aliquotIndex}`` so the parent barcode
    remains the lineage key. Recollections and original tubes get a new yearly
    number. Idempotent when ``sampleId`` is already set.
    """
    if sample.sampleId:
        return sample.sampleId

    if sample.isAliquot:
        if parent is None or not parent.sampleId:
            raise ValueError("Aliquot requires a parent sample with an accession number")
        index = int(sample.aliquotIndex or 1)
        sample.sampleId = format_aliquot_accession(parent.sampleId, index)
        return sample.sampleId

    sample.sampleId = allocate_accession_number(db)
    return sample.sampleId


# --- from specimen/lookup.py ---

"""Shared specimen and linked test queries."""


from collections.abc import Iterable

from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import OrderTest
from app.shared.exceptions import LabOperationError
from app.shared.enums import TestStatus
from sqlalchemy.orm import Session


def get_sample_or_error(
    db: Session,
    sample_id: str,
    *,
    for_update: bool = False,
) -> Sample:
    query = db.query(Sample).filter(Sample.sampleId == sample_id)
    if for_update:
        query = query.with_for_update()
    sample = query.first()
    if not sample:
        raise LabOperationError(f"Sample {sample_id} not found", status_code=404)
    return sample


def linked_order_tests_for_sample(
    db: Session,
    sample: Sample,
    *,
    exclude_statuses: Iterable[TestStatus] | None = None,
) -> list[OrderTest]:
    query = db.query(OrderTest).filter(
        OrderTest.orderId == sample.orderId,
        OrderTest.testCode.in_(sample.testCodes),
        OrderTest.sampleId == sample.sampleId,
    )
    if exclude_statuses:
        query = query.filter(OrderTest.status.notin_(tuple(exclude_statuses)))
    return query.all()


def linked_order_tests_by_sample_ids(
    db: Session,
    sample_ids: Iterable[str],
    *,
    exclude_statuses: Iterable[TestStatus] | None = None,
) -> dict[str, list[OrderTest]]:
    ids = list(sample_ids)
    grouped: dict[str, list[OrderTest]] = {sid: [] for sid in ids}
    if not ids:
        return grouped
    query = db.query(OrderTest).filter(OrderTest.sampleId.in_(ids))
    if exclude_statuses:
        query = query.filter(OrderTest.status.notin_(tuple(exclude_statuses)))
    for order_test in query.all():
        if order_test.sampleId is not None:
            grouped.setdefault(order_test.sampleId, []).append(order_test)
    return grouped


# --- from specimen/aliquots.py ---

"""Create child aliquot tubes from a collected parent sample."""

from datetime import UTC, datetime

from app.domains.audit.service import AuditEmitter
from app.domains.lab.specimen.models import Sample
from app.shared.exceptions import LabOperationError
from app.shared.enums import SampleStatus
from sqlalchemy.orm import Session


def create_aliquots(
    db: Session,
    *,
    parent_id: int,
    count: int,
    aliquot_volume: float,
    test_codes: list[str] | None,
    user_id: str,
    emitter: AuditEmitter | None = None,
) -> list[Sample]:
    """
    Split remaining parent volume into ``count`` child tubes.

    Children inherit container/priority and a subset of parent test codes.
    Parent remaining volume is decremented; children are COLLECTED copies when
    the parent is already collected.
    """
    parent = db.query(Sample).filter(Sample.sampleId == parent_id).first()
    if not parent:
        raise LabOperationError("Sample not found", status_code=404)
    if parent.status != SampleStatus.COLLECTED:
        raise LabOperationError(
            "Aliquots can only be created from a collected sample", status_code=400
        )
    remaining = float(parent.remainingVolume or 0)
    total_volume = count * aliquot_volume
    if total_volume - remaining > 1e-9:
        raise LabOperationError(
            f"Aliquot volume {total_volume} exceeds remaining volume {remaining}",
            status_code=400,
        )
    parent_codes = list(parent.testCodes or [])
    child_codes = list(test_codes) if test_codes else parent_codes
    unknown = [code for code in child_codes if code not in parent_codes]
    if unknown:
        raise LabOperationError(
            f"Aliquot test codes must be a subset of the parent: {', '.join(unknown)}",
            status_code=400,
        )
    if not child_codes:
        raise LabOperationError("Aliquot must include at least one test code", status_code=400)

    existing_indexes = [
        row.aliquotIndex or 0
        for row in db.query(Sample)
        .filter(Sample.parentSampleId == parent.sampleId, Sample.isAliquot.is_(True))
        .all()
    ]
    next_index = (max(existing_indexes) if existing_indexes else 0) + 1
    now = datetime.now(UTC)
    children: list[Sample] = []
    for offset in range(count):
        child = Sample(
            orderId=parent.orderId,
            sampleType=parent.sampleType,
            status=SampleStatus.COLLECTED,
            testCodes=list(child_codes),
            requiredVolume=aliquot_volume,
            priority=parent.priority,
            requiredContainerTypes=list(parent.requiredContainerTypes or []),
            requiredContainerColors=list(parent.requiredContainerColors or []),
            collectedAt=parent.collectedAt or now,
            collectedBy=str(user_id),
            collectedVolume=aliquot_volume,
            actualContainerType=parent.actualContainerType,
            actualContainerColor=parent.actualContainerColor,
            remainingVolume=aliquot_volume,
            isAliquot=True,
            parentSampleId=parent.sampleId,
            aliquotIndex=next_index + offset,
            aliquotVolume=aliquot_volume,
            isRecollection=False,
            recollectionAttempt=parent.recollectionAttempt or 1,
            createdBy=str(user_id),
            updatedBy=str(user_id),
        )
        assign_accession_number(db, child, parent=parent)
        db.add(child)
        db.flush()
        if emitter is not None:
            emitter.sample_aliquot_created(
                child.sampleId,
                parent.sampleId,
                parent.orderId,
                user_id,
                aliquot_index=child.aliquotIndex or 0,
            )
        children.append(child)

    parent.remainingVolume = remaining - total_volume
    parent.updatedBy = str(user_id)
    parent.updatedAt = now
    return children


# --- from specimen/collection_service.py ---

"""
Single entry point for pending sample creation and collection attempt numbering.

recollectionAttempt scale (matches UI 1..MAX_RECOLLECTION_ATTEMPTS):
  1 = initial collection tube
  2 = first recollection tube, etc.
"""

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from app.domains.lab.specimen.models import Sample
from app.shared.exceptions import LabOperationError
from app.shared.enums import PriorityLevel, SampleStatus, SampleType
from app.shared.lab_contract import MAX_RECOLLECTION_ATTEMPTS
from sqlalchemy.orm import Session

if TYPE_CHECKING:
    pass


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
        order_id: str,
        sample_type: SampleType,
        test_codes: list[str],
        required_volume: float,
        priority: PriorityLevel,
        required_container_types: list[Any],
        required_container_colors: list[Any],
        created_by: str,
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
            createdBy=created_by,
            updatedBy=created_by,
        )
        assign_accession_number(self.db, sample)
        self.db.add(sample)
        self.db.flush()
        return sample

    def request_recollection(
        self,
        source_sample: Sample,
        user_id: str,
        reason: str,
        *,
        test_codes: list[str] | None = None,
        priority: PriorityLevel | None = None,
        supervisor_authorized: bool = False,
    ) -> Sample:
        """
        Create a pending recollection tube after rejection or supervisor authorization.
        Idempotent when a pending recollection already exists for the source sample.

        Automatic quality-issue flows enforce MAX_RECOLLECTION_ATTEMPTS. Supervisor escalation
        resolution (authorize_recollect) passes supervisor_authorized=True to bypass the cap.
        """
        if source_sample.recollectionSampleId:
            existing = (
                self.db.query(Sample)
                .filter(Sample.sampleId == source_sample.recollectionSampleId)
                .first()
            )
            if (
                existing
                and existing.status == SampleStatus.PENDING
                and existing.collectedAt is None
            ):
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
            createdAt=datetime.now(UTC),
            createdBy=str(user_id),
            updatedBy=str(user_id),
        )
        assign_accession_number(self.db, new_sample)
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


# --- from specimen/generation.py ---

"""Pending sample creation and order/sync helpers."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from app.domains.catalog.models import OrderableTest
from app.domains.lab.specimen.models import Sample
from app.domains.lab.rules.service import INACTIVE_LINEAGE_STATUSES
from app.domains.orders.models import Order, OrderTest
from app.shared.enums import PriorityLevel, SampleStatus, TestStatus
from sqlalchemy.orm import Session

if TYPE_CHECKING:
    from app.domains.audit.service import AuditEmitter


def generate_samples_for_order(
    orderId: str,
    db: Session,
    createdBy: str,
    emitter: AuditEmitter | None = None,
) -> list[Sample]:
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
            OrderTest.status.notin_(INACTIVE_LINEAGE_STATUSES),
        )
        .all()
    )
    if not order_tests:
        # No active tests: remove all PENDING samples for this order (obsolete)
        _delete_pending_samples_for_order(orderId, db, set())
        return []

    test_codes = list({order_test.testCode for order_test in order_tests})
    tests_by_code = {
        test.code: test
        for test in db.query(OrderableTest).filter(OrderableTest.code.in_(test_codes)).all()
    }

    # Group active tests by sample type (key: string from OrderableTest.sampleType for consistency)
    sample_groups: dict[str, list[tuple[OrderTest, OrderableTest]]] = {}
    for order_test in order_tests:
        test = tests_by_code.get(order_test.testCode)
        if not test:
            continue
        sample_type_key = test.sampleType
        if sample_type_key not in sample_groups:
            sample_groups[sample_type_key] = []
        sample_groups[sample_type_key].append((order_test, test))

    existing_samples = db.query(Sample).filter(Sample.orderId == orderId).all()
    collection = SampleCollectionService(db)
    samples: list[Sample] = []
    for sample_type_key, test_list in sample_groups.items():
        total_volume = 0.0
        test_codes: list[str] = []
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
                if emitter is not None:
                    # Pending sample labels are generated by the system, not the ordering user.
                    emitter.sample_created(
                        sample.sampleId,
                        orderId,
                        None,
                        test_codes=list(sample.testCodes or test_codes),
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
    test_codes: list[str],
    required_volume: float,
    container_types: list[Any],
    container_colors: list[Any],
    priority: PriorityLevel,
    updated_by: str,
) -> None:
    sample.testCodes = test_codes
    sample.requiredVolume = required_volume
    sample.requiredContainerTypes = container_types
    sample.requiredContainerColors = container_colors
    sample.priority = priority
    sample.updatedBy = updated_by
    sample.updatedAt = datetime.now(UTC)


def _choose_active_sample(existing: list[Sample]) -> Sample | None:
    """
    Return the pending, uncollected sample that should receive active tests.

    Rejected/collected tubes are historical — never reuse them when syncing tests.
    """
    pending = [
        s
        for s in existing
        if s.status == SampleStatus.PENDING and s.collectedAt is None and not s.isAliquot
    ]
    if not pending:
        return None
    recollection = [s for s in pending if s.isRecollection]
    pool = recollection if recollection else pending
    return max(pool, key=lambda s: s.sampleId)


def _dedupe_pending_samples(
    db: Session,
    order_id: str,
    keep: Sample,
    existing: list[Sample],
) -> None:
    """Remove duplicate pending samples for the same type, reassigning tests to keep."""
    for s in existing:
        if (
            s.sampleId != keep.sampleId
            and s.status == SampleStatus.PENDING
            and s.collectedAt is None
            and not s.isAliquot
            and _sample_type_matches(s, keep.sampleType)
        ):
            _reassign_order_tests_to_sample(
                db, order_id, from_sample_id=s.sampleId, to_sample_id=keep.sampleId
            )
            db.delete(s)


def _latest_rejected_sample(existing: list[Sample]) -> Sample | None:
    rejected = [s for s in existing if s.status == SampleStatus.REJECTED]
    if not rejected:
        return None
    return max(rejected, key=lambda s: s.sampleId)


def _pending_recollection_sample(
    existing: list[Sample],
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
    db: Session, order_id: str, from_sample_id: str, to_sample_id: str
) -> None:
    db.query(OrderTest).filter(
        OrderTest.orderId == order_id,
        OrderTest.sampleId == from_sample_id,
    ).update({OrderTest.sampleId: to_sample_id}, synchronize_session="fetch")


def _delete_pending_samples_for_order(order_id: str, db: Session, keep_sample_types: set) -> None:
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
        if s.isAliquot:
            continue
        if s.sampleType not in keep_sample_types:
            db.delete(s)


def _link_order_tests_to_samples(db: Session, order_id: str, samples: list[Sample]) -> None:
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


# --- from specimen/query_service.py ---

"""Read/query operations for specimens."""
from app.domains.lab.specimen.models import Sample
from app.shared.enums import SampleStatus
from sqlalchemy.orm import Session


class SpecimenQueryService:
    """Read/query operations for samples."""

    def __init__(self, db: Session):
        self.db = db

    def list_samples(
        self,
        skip: int,
        limit: int,
        order_id: str | None = None,
        sample_status: SampleStatus | None = None,
        paginated: bool = False,
    ):
        from app.domains.lab.specimen.schemas import SampleResponse
        from app.shared.http import create_paginated_response, skip_to_page
        from fastapi import HTTPException
        from fastapi import status as http_status

        query = self.db.query(Sample)
        if order_id:
            query = query.filter(Sample.orderId == order_id)
        if sample_status:
            query = query.filter(Sample.status == sample_status)
        query = query.order_by(Sample.updatedAt.desc())
        total = query.count() if paginated else 0
        samples = query.offset(skip).limit(limit).all()
        try:
            parent_ids = {s.originalSampleId for s in samples if s.originalSampleId}
            recoll_ids = {s.recollectionSampleId for s in samples if s.recollectionSampleId}
            related_ids = parent_ids | recoll_ids
            related = (
                {
                    row.sampleId: row
                    for row in self.db.query(Sample)
                    .filter(Sample.sampleId.in_(related_ids))
                    .all()
                }
                if related_ids
                else {}
            )
            serialized = []
            for sample in samples:
                data = SampleResponse.model_validate(sample).model_dump(mode="json")
                parent = related.get(sample.originalSampleId) if sample.originalSampleId else None
                if parent:
                    parent_data = SampleResponse.model_validate(parent).model_dump(mode="json")
                    data["originalSampleCollectedAt"] = parent_data["collectedAt"]
                serialized.append(data)
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

    def get_by_id(self, sample_id: str) -> Sample:
        from fastapi import HTTPException
        from fastapi import status as http_status

        sample = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        if not sample:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Sample {sample_id} not found",
            )
        return sample

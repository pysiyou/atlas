"""
Sample Generator Service
Analyzes order tests and syncs one active pending sample per sample type.
Rejected/collected tubes are kept as history; new tests attach to pending recollection samples.
"""
from typing import List, Dict, Tuple, Any
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Order, OrderTest, Test, Sample
from app.services.sample_collection import SampleCollectionService
from app.schemas.enums import SampleStatus, PriorityLevel, SampleType, TestStatus


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

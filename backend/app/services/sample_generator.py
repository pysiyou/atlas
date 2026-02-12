"""
Sample Generator Service
Analyzes order tests and generates required samples.
Syncs to one sample per (order_id, sample_type): updates existing or creates new; removes duplicates and obsolete.
"""
from typing import List, Dict, Tuple, Any
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Order, OrderTest, Test, Sample
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
    Sync samples for an order to desired state: one sample per sample type.
    Groups active tests by sample type; updates existing samples or creates new; removes duplicates and obsolete.
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

        if len(existing) == 1:
            sample = existing[0]
            _update_sample(
                sample,
                test_codes=test_codes,
                required_volume=total_volume,
                container_types=list(container_types_set),
                container_colors=list(container_colors_set),
                priority=order.priority,
                updated_by=createdBy,
            )
            samples.append(sample)
        elif len(existing) > 1:
            keep = _choose_sample_to_keep(existing)
            to_remove = [s for s in existing if s.sampleId != keep.sampleId]
            _update_sample(
                keep,
                test_codes=test_codes,
                required_volume=total_volume,
                container_types=list(container_types_set),
                container_colors=list(container_colors_set),
                priority=order.priority,
                updated_by=createdBy,
            )
            samples.append(keep)
            for s in to_remove:
                if s.status == SampleStatus.PENDING and s.collectedAt is None:
                    _reassign_order_tests_to_sample(db, orderId, from_sample_id=s.sampleId, to_sample_id=keep.sampleId)
                    db.delete(s)
        else:
            sample = Sample(
                orderId=orderId,
                sampleType=sample_type_enum,
                status=SampleStatus.PENDING,
                testCodes=test_codes,
                requiredVolume=total_volume,
                priority=order.priority,
                requiredContainerTypes=list(container_types_set),
                requiredContainerColors=list(container_colors_set),
                isRecollection=False,
                recollectionAttempt=1,
                rejectionHistory=[],
                createdBy=str(createdBy),
                updatedBy=str(createdBy),
            )
            db.add(sample)
            db.flush()
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


def _choose_sample_to_keep(existing: List[Sample]) -> Sample:
    """Prefer collected sample; else first by sampleId."""
    collected = [s for s in existing if s.collectedAt is not None]
    if collected:
        return collected[0]
    return min(existing, key=lambda s: s.sampleId)


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
    """Set OrderTest.sampleId to the sample that contains that test code for this order."""
    for sample in samples:
        if not sample.testCodes:
            continue
        db.query(OrderTest).filter(
            OrderTest.orderId == order_id,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.status.notin_([TestStatus.SUPERSEDED, TestStatus.REMOVED]),
        ).update({OrderTest.sampleId: sample.sampleId}, synchronize_session="fetch")

"""Pending sample creation and order/sync helpers."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.lab.models.sample import Sample
from app.domains.lab.specimen.collection_service import (
    SampleCollectionService,
    _normalize_sample_type,
    _sample_type_matches,
)
from app.domains.orders.models import Order, OrderTest
from app.shared.contracts.enums import PriorityLevel, SampleStatus, TestStatus
from sqlalchemy.orm import Session

if TYPE_CHECKING:
    from app.domains.audit.service import AuditEmitter


def generate_samples_for_order(
    orderId: int,
    db: Session,
    createdBy: int,
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
            OrderTest.status.notin_([TestStatus.SUPERSEDED, TestStatus.REMOVED]),
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
        for test in db.query(CatalogTest).filter(CatalogTest.code.in_(test_codes)).all()
    }

    # Group active tests by sample type (key: string from CatalogTest.sampleType for consistency)
    sample_groups: dict[str, list[tuple[OrderTest, CatalogTest]]] = {}
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
    updated_by: int,
) -> None:
    sample.testCodes = test_codes
    sample.requiredVolume = required_volume
    sample.requiredContainerTypes = container_types
    sample.requiredContainerColors = container_colors
    sample.priority = priority
    sample.updatedBy = str(updated_by)
    sample.updatedAt = datetime.now(UTC)


def _choose_active_sample(existing: list[Sample]) -> Sample | None:
    """
    Return the pending, uncollected sample that should receive active tests.

    Rejected/collected tubes are historical — never reuse them when syncing tests.
    """
    pending = [s for s in existing if s.status == SampleStatus.PENDING and s.collectedAt is None]
    if not pending:
        return None
    recollection = [s for s in pending if s.isRecollection]
    pool = recollection if recollection else pending
    return max(pool, key=lambda s: s.sampleId)


def _dedupe_pending_samples(
    db: Session,
    order_id: int,
    keep: Sample,
    existing: list[Sample],
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
    db: Session, order_id: int, from_sample_id: int, to_sample_id: int
) -> None:
    db.query(OrderTest).filter(
        OrderTest.orderId == order_id,
        OrderTest.sampleId == from_sample_id,
    ).update({OrderTest.sampleId: to_sample_id}, synchronize_session="fetch")


def _delete_pending_samples_for_order(order_id: int, db: Session, keep_sample_types: set) -> None:
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


def _link_order_tests_to_samples(db: Session, order_id: int, samples: list[Sample]) -> None:
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

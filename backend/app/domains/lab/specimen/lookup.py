"""Shared specimen and linked test queries."""

from __future__ import annotations

from collections.abc import Iterable

from app.domains.lab.models.sample import Sample
from app.domains.orders.models import OrderTest
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import TestStatus
from sqlalchemy.orm import Session


def get_sample_or_error(
    db: Session,
    sample_id: int,
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
    sample_ids: Iterable[int],
    *,
    exclude_statuses: Iterable[TestStatus] | None = None,
) -> dict[int, list[OrderTest]]:
    ids = list(sample_ids)
    grouped: dict[int, list[OrderTest]] = {sid: [] for sid in ids}
    if not ids:
        return grouped
    query = db.query(OrderTest).filter(OrderTest.sampleId.in_(ids))
    if exclude_statuses:
        query = query.filter(OrderTest.status.notin_(tuple(exclude_statuses)))
    for order_test in query.all():
        if order_test.sampleId is not None:
            grouped.setdefault(order_test.sampleId, []).append(order_test)
    return grouped

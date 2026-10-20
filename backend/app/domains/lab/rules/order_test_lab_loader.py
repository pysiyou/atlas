"""Batch-load lab work-item projections for order tests."""

from __future__ import annotations

from collections import defaultdict

from app.domains.lab.models.escalation import EscalationTicket
from app.domains.lab.models.sample import Sample
from app.domains.lab.quality.recollection_snapshot import recollection_blocked_order_test_ids
from app.domains.lab.rules.work_item_projection import (
    LabWorkItemContext,
    LabWorkItemProjection,
    project_order_test_pipeline,
)
from app.domains.orders.models import Order, OrderTest
from app.shared.contracts.enums import EscalationTicketStatus, TestStatus
from sqlalchemy.orm import Session


def lab_projections_for_orders(
    db: Session,
    orders: list[Order],
    blocked: set[int] | None = None,
) -> dict[int, dict[int, LabWorkItemProjection]]:
    """
    Project every test on a page of orders in one sample/escalation/blocked pass.

    Returns ``{orderId: {orderTestId: projection}}``. Pass ``blocked`` when the
    caller already loaded pending recollection ids so the snapshot is not re-scanned.
    """
    result: dict[int, dict[int, LabWorkItemProjection]] = {
        order.orderId: {} for order in orders
    }
    all_tests: list[tuple[Order, OrderTest]] = []
    for order in orders:
        for order_test in list(order.tests or []):
            all_tests.append((order, order_test))
    if not all_tests:
        return result

    sample_ids = {order_test.sampleId for _, order_test in all_tests if order_test.sampleId}
    samples_by_id: dict[int, Sample] = {}
    if sample_ids:
        for sample in db.query(Sample).filter(Sample.sampleId.in_(sample_ids)).all():
            samples_by_id[sample.sampleId] = sample

    linked_by_sample: dict[int, list[OrderTest]] = defaultdict(list)
    for _, order_test in all_tests:
        if order_test.sampleId is not None:
            linked_by_sample[order_test.sampleId].append(order_test)

    escalated_ids = [
        order_test.id for _, order_test in all_tests if order_test.status == TestStatus.ESCALATED
    ]
    escalation_code_by_test: dict[int, str | None] = {}
    if escalated_ids:
        for ticket in (
            db.query(EscalationTicket)
            .filter(
                EscalationTicket.orderTestId.in_(escalated_ids),
                EscalationTicket.status == EscalationTicketStatus.OPEN,
            )
            .all()
        ):
            code = ticket.reasonCode
            escalation_code_by_test[ticket.orderTestId] = (
                code.value if code is not None and hasattr(code, "value") else None
            )

    recollection_blocked = (
        blocked if blocked is not None else recollection_blocked_order_test_ids(db)
    )

    for order, order_test in all_tests:
        sample = samples_by_id.get(order_test.sampleId) if order_test.sampleId else None
        ctx = LabWorkItemContext(
            order=order,
            order_test=order_test,
            sample=sample,
            linked_order_tests=list(linked_by_sample.get(order_test.sampleId or -1, [])),
            escalation_reason_code=escalation_code_by_test.get(order_test.id),
            recollection_approval_pending=order_test.id in recollection_blocked,
        )
        result[order.orderId][order_test.id] = project_order_test_pipeline(ctx)

    return result


def lab_projections_for_order(
    db: Session,
    order: Order,
    blocked: set[int] | None = None,
) -> dict[int, LabWorkItemProjection]:
    """Project one order's tests; optional ``blocked`` avoids a second recollection scan."""
    return lab_projections_for_orders(db, [order], blocked=blocked).get(order.orderId, {})

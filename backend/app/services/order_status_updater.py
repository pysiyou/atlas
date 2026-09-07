"""
Order status update service.
Calculates and updates order status based on test and sample statuses.
"""
import logging
from datetime import datetime, timezone
from typing import Dict

from sqlalchemy.orm import Session
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.schemas.enums import OrderStatus, TestStatus, SampleStatus, LabOperationType
from app.models.lab_audit import LabOperationLog

logger = logging.getLogger(__name__)

# CANCELLED is the only truly terminal state (set manually, not calculated)
# COMPLETED can regress to IN_PROGRESS when retests/escalations are created
TERMINAL_STATUSES = {OrderStatus.CANCELLED}

_STARTED_STATUSES = {
    TestStatus.SAMPLE_COLLECTED,
    TestStatus.RESULTED,
    TestStatus.VALIDATED,
    TestStatus.ESCALATED,
    TestStatus.CANCELLED,
}


def _pending_test_has_started(test: OrderTest, samples_by_id: Dict[int, Sample]) -> bool:
    """
    Pending tests on rejected tubes or recollection tubes count as in-progress work.
    """
    if not test.sampleId:
        return False
    sample = samples_by_id.get(test.sampleId)
    if not sample:
        return False
    if sample.status == SampleStatus.REJECTED:
        return True
    if sample.isRecollection:
        return True
    return False


def _test_has_started(test: OrderTest, samples_by_id: Dict[int, Sample]) -> bool:
    if test.status in _STARTED_STATUSES:
        return True
    if test.status == TestStatus.PENDING:
        return _pending_test_has_started(test, samples_by_id)
    return False


def _calculate_order_status(order: Order, samples: list[Sample]) -> OrderStatus:
    """
    Calculate the appropriate order status based on tests.

    Logic:
    1. If all tests VALIDATED -> COMPLETED
    2. If any test started (including pending on rejected/recollection tubes) -> IN_PROGRESS
    3. Default -> ORDERED

    Note: CANCELLED status is set manually, not calculated.
    """
    tests = order.tests
    if not tests:
        return order.overallStatus

    active_tests = [t for t in tests if t.status not in {TestStatus.SUPERSEDED, TestStatus.REMOVED}]
    if not active_tests:
        return order.overallStatus

    samples_by_id = {s.sampleId: s for s in samples}

    if all(t.status == TestStatus.VALIDATED for t in active_tests):
        return OrderStatus.COMPLETED

    if any(_test_has_started(t, samples_by_id) for t in active_tests):
        return OrderStatus.IN_PROGRESS

    return OrderStatus.ORDERED


def update_order_status(db: Session, order_id: int) -> None:
    """
    Update order status based on the status of its samples and tests.

    Allows transitions from COMPLETED back to IN_PROGRESS when retests/escalations are created.
    CANCELLED is the only truly terminal state (set manually).
    """
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order:
        return

    current_status = order.overallStatus

    if current_status == OrderStatus.CANCELLED:
        logger.debug(f"Order {order_id} is cancelled, skipping status update")
        return

    samples = db.query(Sample).filter(Sample.orderId == order_id).all()
    new_status = _calculate_order_status(order, samples)

    if order.overallStatus != new_status:
        old_status = order.overallStatus
        order.overallStatus = new_status
        order.updatedAt = datetime.now(timezone.utc)

        log_entry = LabOperationLog(
            operationType=LabOperationType.ORDER_STATUS_CHANGE,
            entityType="order",
            entityId=order_id,
            performedBy="system",
            performedAt=datetime.now(timezone.utc),
            beforeState={"status": old_status.value if old_status else None},
            afterState={"status": new_status.value},
            operationData={"trigger": "automatic"}
        )
        db.add(log_entry)

        db.add(order)
        db.commit()
        logger.info(f"Order {order_id} status changed from {old_status} to {new_status}")

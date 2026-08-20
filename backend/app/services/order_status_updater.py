"""
Order status update service.
Calculates and updates order status based on test and sample statuses.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.schemas.enums import OrderStatus, TestStatus, SampleStatus, LabOperationType
from app.models.lab_audit import LabOperationLog

logger = logging.getLogger(__name__)

# CANCELLED is the only truly terminal state (set manually, not calculated)
# COMPLETED can regress to IN_PROGRESS when retests/escalations are created
TERMINAL_STATUSES = {OrderStatus.CANCELLED}


def _calculate_order_status(order: Order, samples: list[Sample]) -> OrderStatus:
    """
    Calculate the appropriate order status based on tests.

    Logic:
    1. If all tests VALIDATED -> COMPLETED
    2. If any test started (not pending) -> IN_PROGRESS
    3. Default -> ORDERED

    Note: CANCELLED status is set manually, not calculated.
    Rejected tests are considered "in progress" since work continues (retest/recollection).

    Args:
        order: The order to calculate status for
        samples: List of samples associated with the order (unused but kept for API compatibility)

    Returns:
        The calculated OrderStatus
    """
    tests = order.tests
    if not tests:
        return order.overallStatus

    # Filter out superseded and removed tests - only count active tests
    active_tests = [t for t in tests if t.status not in {TestStatus.SUPERSEDED, TestStatus.REMOVED}]
    if not active_tests:
        return order.overallStatus

    # Check if all active tests are validated -> COMPLETED
    all_validated = all(t.status == TestStatus.VALIDATED for t in active_tests)
    if all_validated:
        return OrderStatus.COMPLETED

    # Check if any test has started (not pending) -> IN_PROGRESS
    # This includes rejected tests since work continues (retest/recollection)
    started_statuses = {
        TestStatus.SAMPLE_COLLECTED,
        TestStatus.IN_PROGRESS,
        TestStatus.RESULTED,
        TestStatus.VALIDATED,
        TestStatus.REJECTED,
        TestStatus.ESCALATED,
    }
    any_started = any(t.status in started_statuses for t in active_tests)
    if any_started:
        return OrderStatus.IN_PROGRESS

    # All tests are pending -> ORDERED
    return OrderStatus.ORDERED


def update_order_status(db: Session, order_id: int) -> None:
    """
    Update order status based on the status of its samples and tests.

    Allows transitions from COMPLETED back to IN_PROGRESS when retests/escalations are created.
    CANCELLED is the only truly terminal state (set manually).
    
    Args:
        db: Database session
        order_id: The order ID to update
    """
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order:
        return

    current_status = order.overallStatus
    
    # Only CANCELLED is truly terminal - it's set manually and should not be auto-changed
    if current_status == OrderStatus.CANCELLED:
        logger.debug(f"Order {order_id} is cancelled, skipping status update")
        return

    samples = db.query(Sample).filter(Sample.orderId == order_id).all()
    new_status = _calculate_order_status(order, samples)
    
    if order.overallStatus != new_status:
        old_status = order.overallStatus
        order.overallStatus = new_status
        order.updatedAt = datetime.now(timezone.utc)

        # Log the status change for audit trail
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

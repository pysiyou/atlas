"""
Order status update service.
Calculates and updates order status based on test and sample statuses.
"""
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.schemas.enums import OrderStatus, TestStatus, SampleStatus

logger = logging.getLogger(__name__)

# Terminal states that should not regress
TERMINAL_STATUSES = {OrderStatus.VALIDATED, OrderStatus.REPORTED}


def _calculate_order_status(order: Order, samples: list[Sample]) -> OrderStatus:
    """
    Calculate the appropriate order status based on tests and samples.
    
    Logic:
    1. If all tests VALIDATED -> VALIDATED
    2. If all tests COMPLETED (or VALIDATED) -> COMPLETED
    3. If all samples COLLECTED (or received/accessioned) -> IN_PROGRESS
    4. If any sample COLLECTED -> SAMPLE_COLLECTION
    5. Default -> PENDING
    
    Args:
        order: The order to calculate status for
        samples: List of samples associated with the order
        
    Returns:
        The calculated OrderStatus
    """
    tests = order.tests
    if not tests:
        return order.overallStatus

    # Check Test Statuses
    all_validated = all(t.status == TestStatus.VALIDATED for t in tests)
    if all_validated:
        return OrderStatus.VALIDATED

    all_completed = all(t.status in [TestStatus.COMPLETED, TestStatus.VALIDATED] for t in tests)
    if all_completed:
        return OrderStatus.COMPLETED

    # Check Sample Statuses
    if not samples:
        return order.overallStatus

    non_rejected_samples = [s for s in samples if s.status != SampleStatus.REJECTED]

    if not non_rejected_samples:
        # All samples rejected - set order back to pending for recollection
        return OrderStatus.PENDING

    # Check if all non-rejected samples are collected
    collected_statuses = {
        SampleStatus.COLLECTED,
        SampleStatus.RECEIVED,
        SampleStatus.ACCESSIONED,
        SampleStatus.IN_PROGRESS,
        SampleStatus.COMPLETED,
        SampleStatus.STORED
    }
    
    all_collected = all(s.status in collected_statuses for s in non_rejected_samples)
    if all_collected:
        return OrderStatus.IN_PROGRESS

    partial_collected_statuses = {
        SampleStatus.COLLECTED,
        SampleStatus.RECEIVED,
        SampleStatus.ACCESSIONED
    }
    
    any_collected = any(s.status in partial_collected_statuses for s in non_rejected_samples)
    if any_collected:
        return OrderStatus.SAMPLE_COLLECTION

    return OrderStatus.PENDING


def update_order_status(db: Session, order_id: str) -> None:
    """
    Update order status based on the status of its samples and tests.
    
    Prevents backward transitions from terminal states (VALIDATED, REPORTED).
    
    Args:
        db: Database session
        order_id: The order ID to update
    """
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order:
        return

    current_status = order.overallStatus
    
    # Prevent regression from terminal states
    if current_status in TERMINAL_STATUSES:
        logger.debug(f"Order {order_id} is in terminal state {current_status}, skipping status update")
        return

    samples = db.query(Sample).filter(Sample.orderId == order_id).all()
    new_status = _calculate_order_status(order, samples)
    
    # Handle regression from COMPLETED to earlier states
    # This can legitimately happen when a test is rejected and a retest is created
    if current_status == OrderStatus.COMPLETED and new_status in {
        OrderStatus.PENDING, 
        OrderStatus.SAMPLE_COLLECTION
    }:
        # Check if there are active tests that need work (not VALIDATED or SUPERSEDED)
        active_tests = [t for t in order.tests if t.status not in {
            TestStatus.VALIDATED, 
            TestStatus.SUPERSEDED
        }]
        has_pending_work = any(
            t.status in {
                TestStatus.PENDING, 
                TestStatus.SAMPLE_COLLECTED, 
                TestStatus.IN_PROGRESS,
                TestStatus.COMPLETED  # Needs validation
            }
            for t in active_tests
        )
        
        if has_pending_work:
            # Allow regression to IN_PROGRESS - there's legitimate work to do (e.g., retest)
            new_status = OrderStatus.IN_PROGRESS
            logger.info(
                f"Order {order_id} regressing from {current_status} to {new_status} due to pending work"
            )
        else:
            # No pending work, block the regression
            logger.warning(
                f"Prevented regression of order {order_id} from {current_status} to {new_status}"
            )
            return
    
    if order.overallStatus != new_status:
        order.overallStatus = new_status
        order.updatedAt = datetime.now(timezone.utc)
        db.add(order)
        db.commit()

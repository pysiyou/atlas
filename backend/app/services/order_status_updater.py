"""
Order status update service.
Calculates and updates order status based on test and sample statuses.
"""
from sqlalchemy.orm import Session
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.schemas.enums import OrderStatus, TestStatus, SampleStatus


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
    
    Args:
        db: Database session
        order_id: The order ID to update
    """
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order:
        return

    samples = db.query(Sample).filter(Sample.orderId == order_id).all()
    
    new_status = _calculate_order_status(order, samples)
    
    if order.overallStatus != new_status:
        order.overallStatus = new_status
        db.add(order)
        db.commit()

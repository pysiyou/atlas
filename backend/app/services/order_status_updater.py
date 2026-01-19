from sqlalchemy.orm import Session
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.schemas.enums import OrderStatus, TestStatus, SampleStatus

def update_order_status(db: Session, order_id: str) -> None:
    """
    Update order status based on the status of its samples and tests.
    
    Logic:
    1. If all tests VALIDATED -> VALIDATED
    2. If all tests COMPLETED (or VALIDATED) -> COMPLETED
    3. If all samples COLLECTED (or received/accessioned) -> IN_PROGRESS
    4. If any sample COLLECTED -> SAMPLE_COLLECTION
    5. Default -> PENDING
    """
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order:
        return

    tests = order.tests
    if not tests:
        return

    # Check Test Statuses
    all_validated = all(t.status == TestStatus.VALIDATED for t in tests)
    if all_validated:
        order.overallStatus = OrderStatus.VALIDATED
        db.add(order)
        db.commit()
        return

    all_completed = all(t.status in [TestStatus.COMPLETED, TestStatus.VALIDATED] for t in tests)
    if all_completed:
        order.overallStatus = OrderStatus.COMPLETED
        db.add(order)
        db.commit()
        return

    # Check Sample Statuses
    samples = db.query(Sample).filter(Sample.orderId == order_id).all()
    if not samples:
        # If no samples (e.g. order just created but samples not gen yet?), remain pending
        return

    # active_samples excludes cancelled/rejected ones unless they are the only ones?
    # Actually, we should check if all required samples are collected.
    # Simplified: check if all non-rejected samples are collected+
    
    non_rejected_samples = [s for s in samples if s.status != SampleStatus.REJECTED]

    if not non_rejected_samples:
        # All samples rejected - set order back to pending for recollection
        order.overallStatus = OrderStatus.PENDING
        db.add(order)
        db.commit()
        return

    # Check if all non-rejected samples are collected
    all_collected = all(
        s.status in [
            SampleStatus.COLLECTED,
            SampleStatus.RECEIVED,
            SampleStatus.ACCESSIONED,
            SampleStatus.IN_PROGRESS,
            SampleStatus.COMPLETED,
            SampleStatus.STORED
        ]
        for s in non_rejected_samples
    )

    if all_collected:
        order.overallStatus = OrderStatus.IN_PROGRESS
        db.add(order)
        db.commit()
        return

    any_collected = any(
        s.status in [
            SampleStatus.COLLECTED,
            SampleStatus.RECEIVED,
            SampleStatus.ACCESSIONED
        ]
        for s in non_rejected_samples
    )

    if any_collected:
        order.overallStatus = OrderStatus.SAMPLE_COLLECTION
        db.add(order)
        db.commit()
        return

    # Default: ensure pending status if no other condition matched
    if order.overallStatus != OrderStatus.PENDING:
        order.overallStatus = OrderStatus.PENDING
        db.add(order)
        db.commit()

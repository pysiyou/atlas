"""
Cancel remedy - handles test/sample cancellation.
"""
from datetime import datetime, timezone
from typing import List, Optional, Set

from sqlalchemy.orm import Session

from app.models.order import OrderTest
from app.models.sample import Sample
from app.schemas.enums import QualityDomain, QualityStage, SampleStatus, TestStatus
from app.services.audit_service import AuditService
from app.services.state_machine import SampleStateMachine, TestStateMachine
from app.utils.exceptions import LabOperationError


_SAMPLE_RESET_STATUSES = {
    TestStatus.PENDING,
    TestStatus.SAMPLE_COLLECTED,
}


class CancelRemedy:
    """Handles cancel remedy - cancels tests or linked tests on sample rejection."""
    
    def __init__(self, db: Session, audit: AuditService):
        self.db = db
        self.audit = audit
    
    def cancel_test(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: Optional[str],
    ) -> None:
        """Cancel a single test."""
        TestStateMachine.validate_transition(order_test.status, TestStatus.CANCELLED)
        order_test.status = TestStatus.CANCELLED
        order_test.validationNotes = notes or f"Cancelled at validation: {reason}"
    
    def cancel_unfinished_on_sample(
        self,
        linked_tests: List[OrderTest],
        user_id: int,
        reason: str,
        notes: Optional[str],
    ) -> List[int]:
        """Cancel unfinished tests when rejecting a sample."""
        cancelled_ids: List[int] = []
        
        for order_test in linked_tests:
            if order_test.status not in _SAMPLE_RESET_STATUSES:
                continue
            
            TestStateMachine.validate_transition(order_test.status, TestStatus.CANCELLED)
            order_test.status = TestStatus.CANCELLED
            order_test.validationNotes = notes or f"Cancelled on specimen rejection: {reason}"
            cancelled_ids.append(order_test.id)
        
        return cancelled_ids

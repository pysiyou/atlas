"""
Retry remedy - handles re-testing on the same sample.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.order import OrderTest
from app.models.quality_issue import QualityIssue
from app.schemas.enums import QualityDomain, QualityStage, RemedyType, TestStatus
from app.services.audit_service import AuditService
from app.services.lab_constants import MAX_RETEST_ATTEMPTS
from app.services.order_status_updater import update_order_status
from app.services.state_machine import TestStateMachine
from app.utils.exceptions import LabOperationError


class RetryRemedy:
    """Handles retry_same_sample remedy - creates a retest on the same tube."""
    
    def __init__(self, db: Session, audit: AuditService):
        self.db = db
        self.audit = audit
    
    def can_retry(self, order_test: OrderTest, retest_count: int) -> tuple[bool, Optional[str]]:
        """Check if test can be retried without supervisor escalation."""
        retest_remaining = max(0, MAX_RETEST_ATTEMPTS - retest_count - 1)
        if retest_remaining <= 0:
            return False, f"Maximum retest limit ({MAX_RETEST_ATTEMPTS}) reached. Escalation required."
        return True, None
    
    def execute(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: Optional[str],
        retest_count: int,
        quality_issue_id: int,
    ) -> OrderTest:
        """Create a retest and supersede the original."""
        # Enforce limit
        can_retry, error_msg = self.can_retry(order_test, retest_count)
        if not can_retry:
            raise LabOperationError(error_msg, status_code=400)
        
        # Create retest
        current_retest = order_test.retestNumber or 0
        next_retest = current_retest + 1
        
        new_test = OrderTest(
            orderId=order_test.orderId,
            testCode=order_test.testCode,
            status=TestStatus.SAMPLE_COLLECTED,
            priceAtOrder=order_test.priceAtOrder,
            sampleId=order_test.sampleId,
            isRetest=True,
            retestOfTestId=order_test.id,
            retestNumber=next_retest,
            technicianNotes=f"Re-test #{next_retest}: {reason}" + (f" — {notes}" if notes else ""),
            flags=order_test.flags,
            isReflexTest=order_test.isReflexTest,
            triggeredBy=order_test.triggeredBy,
            reflexRule=order_test.reflexRule,
        )
        self.db.add(new_test)
        self.db.flush()
        
        # Supersede original
        order_test.retestOrderTestId = new_test.id
        TestStateMachine.validate_transition(order_test.status, TestStatus.SUPERSEDED)
        order_test.status = TestStatus.SUPERSEDED
        
        return new_test

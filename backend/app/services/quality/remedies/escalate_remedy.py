"""
Escalate remedy - escalates tests to supervisor queue.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.order import OrderTest
from app.schemas.enums import EscalationReasonCode, QualityDomain, TestStatus
from app.services.audit_service import AuditService
from app.services.escalation_engine import EscalationEngine
from app.services.state_machine import TestStateMachine


class EscalateRemedy:
    """Handles escalate remedy - sends test to supervisor queue."""
    
    def __init__(self, db: Session, audit: AuditService, escalation: EscalationEngine):
        self.db = db
        self.audit = audit
        self.escalation = escalation
    
    def execute(
        self,
        order_test: OrderTest,
        user_id: int,
        reason: str,
        notes: Optional[str],
        from_status: TestStatus = TestStatus.RESULTED,
    ) -> None:
        """Escalate test to supervisor."""
        TestStateMachine.validate_transition(order_test.status, TestStatus.ESCALATED)
        self.escalation.escalate_test(
            order_test,
            EscalationReasonCode.LIMIT_HIT,
            user_id,
            metadata={"rejectionReason": reason, "rejectionNotes": notes},
            from_status=from_status,
        )

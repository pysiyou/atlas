"""
Escalation Engine - Creates and resolves EscalationTicket records for LIS exceptions.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.models.order import OrderTest
from app.models.escalation import EscalationTicket
from app.schemas.enums import (
    TestStatus,
    EscalationReasonCode,
    EscalationTicketStatus,
    EscalationSeverity,
    EscalationResolutionAction,
    LabOperationType,
)
from app.services.state_machine import TestStateMachine, StateTransitionError
from app.services.audit_service import AuditService
from app.utils.exceptions import LabOperationError

REASON_TO_TRIGGER_OP = {
    EscalationReasonCode.CRIT_VAL: LabOperationType.ESCALATION_TRIGGER_CRIT_VAL,
    EscalationReasonCode.REJ_SAMP: LabOperationType.ESCALATION_TRIGGER_REJ_SAMP,
    EscalationReasonCode.LIMIT_HIT: LabOperationType.ESCALATION_TRIGGER_LIMIT_HIT,
    EscalationReasonCode.AMEND_RES: LabOperationType.ESCALATION_TRIGGER_AMEND_RES,
}


class EscalationEngine:
    """Coordinates escalation tickets with OrderTest status transitions."""

    def __init__(self, db: Session, audit: AuditService):
        self.db = db
        self.audit = audit

    def get_open_ticket(self, order_test_id: int) -> Optional[EscalationTicket]:
        return (
            self.db.query(EscalationTicket)
            .filter(
                EscalationTicket.orderTestId == order_test_id,
                EscalationTicket.status == EscalationTicketStatus.OPEN,
            )
            .order_by(EscalationTicket.id.desc())
            .first()
        )

    def escalate_test(
        self,
        order_test: OrderTest,
        reason_code: EscalationReasonCode,
        user_id: int,
        metadata: Optional[Dict[str, Any]] = None,
        sample_id: Optional[int] = None,
        from_status: Optional[TestStatus] = None,
    ) -> EscalationTicket:
        prior_status = from_status or order_test.status
        if prior_status != TestStatus.ESCALATED:
            try:
                TestStateMachine.validate_transition(prior_status, TestStatus.ESCALATED)
            except StateTransitionError as exc:
                raise LabOperationError(exc.message, status_code=400) from exc
            order_test.status = TestStatus.ESCALATED

        severity = (
            EscalationSeverity.CRITICAL
            if reason_code == EscalationReasonCode.CRIT_VAL
            else EscalationSeverity.STANDARD
        )

        existing = self.get_open_ticket(order_test.id)
        if existing:
            if metadata:
                merged = {**(existing.ticketMetadata or {}), **metadata}
                existing.ticketMetadata = merged
                flag_modified(existing, "ticketMetadata")
            return existing

        ticket = EscalationTicket(
            orderTestId=order_test.id,
            sampleId=sample_id or order_test.sampleId,
            reasonCode=reason_code,
            status=EscalationTicketStatus.OPEN,
            severity=severity,
            ticketMetadata=metadata or {},
            createdByUserId=str(user_id),
        )
        self.db.add(ticket)
        self.db.flush()

        self.audit.log_escalation_trigger(
            operation_type=REASON_TO_TRIGGER_OP[reason_code],
            order_id=order_test.orderId,
            test_code=order_test.testCode,
            test_id=order_test.id,
            ticket_id=ticket.id,
            user_id=user_id,
            reason_code=reason_code.value,
            before_status=prior_status.value,
            metadata=metadata,
        )
        return ticket

    def resolve_ticket(
        self,
        order_test_id: int,
        action: EscalationResolutionAction,
        user_id: int,
        notes: Optional[str] = None,
        read_back_payload: Optional[Dict[str, Any]] = None,
    ) -> EscalationTicket:
        ticket = self.get_open_ticket(order_test_id)
        if not ticket:
            raise LabOperationError(
                "No open escalation ticket found for this test",
                status_code=404,
            )

        if (
            ticket.reasonCode == EscalationReasonCode.CRIT_VAL
            and action == EscalationResolutionAction.FORCE_VALIDATE
        ):
            if not read_back_payload or not read_back_payload.get("readBackConfirmed"):
                raise LabOperationError(
                    "Critical value force-validate requires provider read-back confirmation",
                    status_code=422,
                )

        meta = dict(ticket.ticketMetadata or {})
        if read_back_payload:
            meta["resolutionReadBack"] = read_back_payload
        ticket.ticketMetadata = meta
        flag_modified(ticket, "ticketMetadata")

        ticket.status = EscalationTicketStatus.RESOLVED
        ticket.resolutionAction = action
        ticket.resolutionNotes = notes
        ticket.resolvedByUserId = str(user_id)
        ticket.resolvedAt = datetime.now(timezone.utc)
        return ticket

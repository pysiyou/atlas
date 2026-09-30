"""Read models for result entry and escalation queues."""
from sqlalchemy.orm import Session


class ResultQueryService:
    """Read/query operations for result entry and escalation views."""

    def __init__(self, db: Session):
        self.db = db

    def get_pending_escalation(self) -> list:
        from app.domains.lab.models.escalation import EscalationTicket
        from app.domains.lab.models.sample import Sample
        from app.domains.orders.models import Order, OrderTest
        from app.shared.contracts.enums import EscalationTicketStatus, TestStatus
        from sqlalchemy.orm import joinedload

        tests = (
            self.db.query(OrderTest)
            .filter(OrderTest.status == TestStatus.ESCALATED)
            .options(
                joinedload(OrderTest.order).joinedload(Order.patient),
                joinedload(OrderTest.test),
            )
            .all()
        )
        sample_ids = [t.sampleId for t in tests if t.sampleId]
        samples_by_id = {}
        if sample_ids:
            for s in self.db.query(Sample).filter(Sample.sampleId.in_(sample_ids)).all():
                samples_by_id[s.sampleId] = s

        test_ids = [t.id for t in tests]
        tickets_by_test: dict[int, EscalationTicket] = {}
        if test_ids:
            for ticket in (
                self.db.query(EscalationTicket)
                .filter(
                    EscalationTicket.orderTestId.in_(test_ids),
                    EscalationTicket.status == EscalationTicketStatus.OPEN,
                )
                .all()
            ):
                tickets_by_test[ticket.orderTestId] = ticket

        return [self._enrich_order_test(t, samples_by_id, tickets_by_test) for t in tests]

    def get_order_test_context(self, order_test_id: int):
        from app.domains.lab.models.escalation import EscalationTicket
        from app.domains.lab.models.sample import Sample
        from app.domains.orders.models import Order, OrderTest
        from app.shared.contracts.enums import EscalationTicketStatus
        from fastapi import HTTPException
        from fastapi import status as http_status
        from sqlalchemy.orm import joinedload

        order_test = (
            self.db.query(OrderTest)
            .filter(OrderTest.id == order_test_id)
            .options(
                joinedload(OrderTest.order).joinedload(Order.patient),
                joinedload(OrderTest.test),
            )
            .first()
        )
        if not order_test:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Order test {order_test_id} not found",
            )

        samples_by_id: dict[int, Sample] = {}
        if order_test.sampleId:
            sample = self.db.query(Sample).filter(Sample.sampleId == order_test.sampleId).first()
            if sample:
                samples_by_id[sample.sampleId] = sample

        tickets_by_test: dict[int, EscalationTicket] = {}
        open_ticket = (
            self.db.query(EscalationTicket)
            .filter(
                EscalationTicket.orderTestId == order_test_id,
                EscalationTicket.status == EscalationTicketStatus.OPEN,
            )
            .first()
        )
        if open_ticket:
            tickets_by_test[order_test_id] = open_ticket

        return self._enrich_order_test(order_test, samples_by_id, tickets_by_test)

    @staticmethod
    def _enrich_order_test(t, samples_by_id, tickets_by_test=None):
        from app.domains.lab.schemas.lab import PendingEscalationItemResponse

        order = t.order
        patient = order.patient if order else None
        sample = samples_by_id.get(t.sampleId) if t.sampleId else None
        test_def = t.test
        ticket = tickets_by_test.get(t.id) if tickets_by_test else None
        reason_code = ticket.reasonCode.value if ticket and ticket.reasonCode else None
        from app.domains.lab.rules.eligibility import escalation_action_flags

        flags = escalation_action_flags(t, reason_code=reason_code)
        return PendingEscalationItemResponse(
            id=t.id,
            orderId=t.orderId,
            orderDate=order.orderDate,
            patientId=order.patientId,
            patientName=patient.fullName if patient else "Unknown",
            patientDob=patient.dateOfBirth if patient else None,
            testCode=t.testCode,
            testName=test_def.displayName if test_def else t.testCode,
            sampleType=test_def.sampleType if test_def else "Unknown",
            status=t.status.value,
            sampleId=t.sampleId,
            results=t.results,
            resultEnteredAt=t.resultEnteredAt,
            enteredBy=t.enteredBy,
            resultValidatedAt=t.resultValidatedAt,
            validatedBy=t.validatedBy,
            validationNotes=t.validationNotes,
            flags=t.flags,
            technicianNotes=t.technicianNotes,
            hasCriticalValues=t.hasCriticalValues or False,
            isRetest=t.isRetest or False,
            retestOfTestId=t.retestOfTestId,
            retestNumber=t.retestNumber or 0,
            priority=order.priority.value if order and order.priority else "low",
            referringPhysician=order.referringPhysician if order else None,
            collectedAt=sample.collectedAt if sample else None,
            collectedBy=sample.collectedBy if sample else None,
            sampleIsRecollection=sample.isRecollection if sample else False,
            sampleOriginalSampleId=sample.originalSampleId if sample else None,
            sampleRecollectionReason=sample.recollectionReason if sample else None,
            sampleRecollectionAttempt=sample.recollectionAttempt if sample else None,
            ticketId=ticket.id if ticket else None,
            reasonCode=ticket.reasonCode.value if ticket and ticket.reasonCode else None,
            severity=ticket.severity.value if ticket and ticket.severity else None,
            ticketMetadata=ticket.ticketMetadata if ticket else None,
            criticalNotificationSent=flags["criticalNotificationSent"],
            allowForceValidate=flags["allowForceValidate"],
        )

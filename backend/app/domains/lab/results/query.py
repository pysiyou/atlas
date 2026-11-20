"""Read models for result entry and order-test context."""
from sqlalchemy.orm import Session, joinedload


class ResultQueryService:
    """Read/query operations for result entry and order-test context."""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _with_lab_projection(item, projection):
        """Attach canonical lab eligibility fields onto an order-test DTO."""
        if projection is None:
            return item
        return item.model_copy(
            update={
                "lab": projection,
                "allowedActions": projection.allowedActions,
                "denyReason": projection.denyReason,
                "denyMessage": projection.denyMessage,
            }
        )

    def get_order_test_context(
        self, order_test_id: int, *, viewer_validator_id: str | None = None
    ):
        from app.domains.lab.quality.models import EscalationTicket
        from app.domains.lab.specimen.models import Sample
        from app.domains.orders.models import Order, OrderTest
        from app.shared.generated.enums import EscalationTicketStatus
        from fastapi import HTTPException
        from fastapi import status as http_status

        order_test = (
            self.db.query(OrderTest)
            .filter(OrderTest.id == order_test_id)
            .options(
                joinedload(OrderTest.order).joinedload(Order.patient),
                joinedload(OrderTest.order).joinedload(Order.referentDoctor),
                joinedload(OrderTest.order).selectinload(Order.tests),
                joinedload(OrderTest.test),
            )
            .first()
        )
        if not order_test:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Order test {order_test_id} not found",
            )

        samples_by_id: dict[str, Sample] = {}
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

        item = self._enrich_order_test(order_test, samples_by_id, tickets_by_test)
        projection = None
        if order_test.order is not None:
            from app.domains.lab.rules.projection import (
                LabWorkItemContext,
                project_order_test_pipeline,
            )

            sample = samples_by_id.get(order_test.sampleId) if order_test.sampleId else None
            ctx = LabWorkItemContext(
                order=order_test.order,
                order_test=order_test,
                sample=sample,
                viewer_validator_id=viewer_validator_id,
                escalation_reason_code=(
                    open_ticket.reasonCode.value
                    if open_ticket and open_ticket.reasonCode
                    else None
                ),
            )
            projection = project_order_test_pipeline(ctx)
        return self._with_lab_projection(item, projection)

    def _prior_test_display(self, order_test, samples_by_id) -> str | None:
        """Accession/mnemonic of the superseded test, when this row is a retest."""
        from app.domains.lab.results.display import format_order_test_display
        from app.domains.lab.specimen.models import Sample
        from app.domains.orders.models import OrderTest

        if not order_test.retestOfTestId:
            return None
        prior = (
            self.db.query(OrderTest).filter(OrderTest.id == order_test.retestOfTestId).first()
        )
        if not prior:
            return None
        prior_sample = samples_by_id.get(prior.sampleId) if prior.sampleId else None
        if prior.sampleId and prior_sample is None:
            prior_sample = self.db.query(Sample).filter(Sample.sampleId == prior.sampleId).first()
        display = format_order_test_display(
            prior_sample.sampleId if prior_sample else None,
            prior.testCode,
        )
        return display if display and display != "-" else None

    def _enrich_order_test(self, t, samples_by_id, tickets_by_test=None):
        """Build the order-test DTO with stored clinical identifiers, never integer PKs for display."""
        from app.domains.lab.results.schemas import PendingEscalationItemResponse

        order = t.order
        patient = order.patient if order else None
        sample = samples_by_id.get(t.sampleId) if t.sampleId else None
        test_def = t.test
        ticket = tickets_by_test.get(t.id) if tickets_by_test else None
        reason_code = ticket.reasonCode.value if ticket and ticket.reasonCode else None
        from app.domains.lab.rules.eligibility import escalation_action_flags

        flags = escalation_action_flags(t, reason_code=reason_code)
        if order is None or not order.orderId:
            from fastapi import HTTPException
            from fastapi import status as http_status

            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Order test {t.id} is missing an order id",
            )
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
            priorTestDisplay=self._prior_test_display(t, samples_by_id),
            priority=order.priority.value if order and order.priority else "low",
            referentDoctorId=order.referentDoctorId if order else None,
            referentDoctorName=order.referentDoctorName if order else None,
            referentDoctorEmail=order.referentDoctorEmail if order else None,
            referentDoctorPhone=order.referentDoctorPhone if order else None,
            referentDoctorHospital=order.referentDoctorHospital if order else None,
            referentDoctorUsername=order.referentDoctorUsername if order else None,
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

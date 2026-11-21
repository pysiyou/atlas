"""Read models for result entry and order-test context."""
from datetime import date

from app.shared.generated.enums import PriorityLevel
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

    def _project_enriched(
        self, order_test, samples_by_id, tickets_by_test, *, viewer_validator_id: str | None
    ):
        """Enrich an order-test row and attach lab pipeline eligibility."""
        item = self._enrich_order_test(order_test, samples_by_id, tickets_by_test)
        projection = None
        if order_test.order is not None:
            from app.domains.lab.rules.projection import (
                LabWorkItemContext,
                project_order_test_pipeline,
            )

            sample = samples_by_id.get(order_test.sampleId) if order_test.sampleId else None
            ticket = tickets_by_test.get(order_test.id) if tickets_by_test else None
            ctx = LabWorkItemContext(
                order=order_test.order,
                order_test=order_test,
                sample=sample,
                viewer_validator_id=viewer_validator_id,
                escalation_reason_code=(
                    ticket.reasonCode.value if ticket and ticket.reasonCode else None
                ),
            )
            projection = project_order_test_pipeline(ctx)
        return self._with_lab_projection(item, projection)

    def list_pending_escalation(
        self,
        *,
        viewer_validator_id: str | None = None,
        search: str | None = None,
        priorities: list[PriorityLevel] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sample_types: list[str] | None = None,
    ):
        """Open supervisor queue: order tests in ESCALATED status, with worklist filters."""
        from app.domains.lab.monitor.queries import order_test_stage_query
        from app.domains.lab.monitor.worklists import apply_order_test_worklist_filters
        from app.domains.lab.quality.escalation import load_open_tickets_by_order_test_id
        from app.domains.lab.specimen.models import Sample
        from app.domains.orders.models import Order, OrderTest
        from app.shared.generated.enums import TestStatus

        filtered, _search_term = apply_order_test_worklist_filters(
            order_test_stage_query(self.db).filter(OrderTest.status == TestStatus.ESCALATED),
            priorities=priorities,
            date_from=date_from,
            date_to=date_to,
            sample_types=sample_types,
            search=search,
        )
        test_ids = [order_test.id for order_test, *_rest in filtered.all()]
        if not test_ids:
            return []
        tests = (
            self.db.query(OrderTest)
            .filter(OrderTest.id.in_(test_ids))
            .options(
                joinedload(OrderTest.order).joinedload(Order.patient),
                joinedload(OrderTest.order).joinedload(Order.referentDoctor),
                joinedload(OrderTest.order).selectinload(Order.tests),
                joinedload(OrderTest.test),
            )
            .order_by(OrderTest.updatedAt.desc())
            .all()
        )
        sample_ids = {t.sampleId for t in tests if t.sampleId}
        prior_ids = [t.retestOfTestId for t in tests if t.retestOfTestId]
        if prior_ids:
            for prior in self.db.query(OrderTest).filter(OrderTest.id.in_(prior_ids)).all():
                if prior.sampleId:
                    sample_ids.add(prior.sampleId)
        samples_by_id: dict[str, Sample] = {}
        if sample_ids:
            for sample in self.db.query(Sample).filter(Sample.sampleId.in_(sample_ids)).all():
                samples_by_id[sample.sampleId] = sample
        tickets_by_test = load_open_tickets_by_order_test_id(self.db, [t.id for t in tests])
        return [
            self._project_enriched(
                t, samples_by_id, tickets_by_test, viewer_validator_id=viewer_validator_id
            )
            for t in tests
        ]

    def get_order_test_context(
        self, order_test_id: int, *, viewer_validator_id: str | None = None
    ):
        from app.domains.lab.quality.escalation import load_open_tickets_by_order_test_id
        from app.domains.lab.specimen.models import Sample
        from app.domains.orders.models import Order, OrderTest
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

        tickets_by_test = load_open_tickets_by_order_test_id(self.db, [order_test_id])
        return self._project_enriched(
            order_test,
            samples_by_id,
            tickets_by_test,
            viewer_validator_id=viewer_validator_id,
        )

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

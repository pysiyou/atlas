"""Lab workflow escalationoperations operations."""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm.attributes import flag_modified

from app.models.order import Order, OrderTest
from app.models.test import Test
from app.schemas.enums import (
    EscalationReasonCode,
    EscalationResolutionAction,
    QualityDomain,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.services.lab.state import TestStateMachine
from app.services.lab.types import EscalationResolveResult
from app.services.orders.order import build_order_completion_metadata, update_order_status
from app.utils.exceptions import LabOperationError

class EscalationOperations:
    def __init__(self, svc):
        self._svc = svc

    def resolve_escalation(
        self,
        order_test_id: int,
        user_id: int,
        action: EscalationResolutionAction,
        validation_notes: Optional[str] = None,
        rejection_reason: Optional[str] = None,
        read_back_payload: Optional[Dict[str, Any]] = None,
    ) -> EscalationResolveResult:
        order_test = self._svc._get_order_test(order_test_id, status=TestStatus.ESCALATED)
        if action == EscalationResolutionAction.FORCE_VALIDATE:
            return self._resolve_force_validate(order_test, user_id, validation_notes, read_back_payload)
        if action == EscalationResolutionAction.AUTHORIZE_RETEST:
            return self._resolve_authorize_retest(order_test, user_id, rejection_reason or "Authorized re-test")
        if action == EscalationResolutionAction.AUTHORIZE_RECOLLECT:
            return self._resolve_authorize_recollect(order_test, user_id, rejection_reason or "Authorized re-collect")
        if action == EscalationResolutionAction.APPLY_AMENDMENT:
            return self._resolve_apply_amendment(order_test, user_id, validation_notes)
        if action == EscalationResolutionAction.CANCEL_TEST:
            return self._resolve_cancel_test(order_test, user_id, rejection_reason or "Test cancelled")
        raise LabOperationError(f"Unknown escalation action: {action}", status_code=400)

    def _resolve_force_validate(
        self,
        order_test: OrderTest,
        user_id: int,
        validation_notes: Optional[str],
        read_back_payload: Optional[Dict[str, Any]],
    ) -> EscalationResolveResult:
        order_id = order_test.orderId
        test_code = order_test.testCode
        ticket = self._svc.escalation.resolve_ticket(
            order_test.id,
            EscalationResolutionAction.FORCE_VALIDATE,
            user_id,
            notes=validation_notes,
            read_back_payload=read_back_payload,
        )

        order_test.resultValidatedAt = datetime.now(timezone.utc)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        completion_meta = build_order_completion_metadata(order) if order else {}

        self._svc.audit.log_escalation_resolution_force_validate(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            ticket_id=ticket.id,
            user_id=user_id,
            validation_notes=validation_notes,
            metadata={**(ticket.ticketMetadata or {}), **completion_meta},
        )

        self._svc.db.commit()
        self._svc.db.refresh(order_test)
        update_order_status(self._svc.db, order_id)
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.FORCE_VALIDATE,
            message="Test force-validated.",
            escalatedTestId=order_test.id,
        )

    def _resolve_authorize_retest(
        self,
        original_test: OrderTest,
        user_id: int,
        reason: str,
    ) -> EscalationResolveResult:
        order_id = original_test.orderId
        test_code = original_test.testCode
        TestStateMachine.validate_transition(TestStatus.ESCALATED, TestStatus.SUPERSEDED)

        new_test = self._svc.quality._create_retest(
            original_test,
            user_id,
            reason,
            None,
            retest_number=0,
            technician_note_prefix="Authorized re-test (escalation)",
        )

        self._svc.escalation.resolve_ticket(
            original_test.id,
            EscalationResolutionAction.AUTHORIZE_RETEST,
            user_id,
            notes=reason,
        )

        self._svc.quality._record_issue(
            order_id=order_id,
            stage=QualityStage.VALIDATION,
            domain=QualityDomain.ANALYTICAL,
            reason=reason,
            notes=None,
            remedy=RemedyType.RETRY_SAME_SAMPLE,
            user_id=user_id,
            order_test_id=original_test.id,
            sample_id=original_test.sampleId,
            test_code=test_code,
            created_test_id=new_test.id,
        )

        self._svc.audit.log_escalation_resolution_authorize_retest(
            order_id=order_id,
            test_code=test_code,
            original_test_id=original_test.id,
            new_test_id=new_test.id,
            user_id=user_id,
            reason=reason,
        )

        self._svc.db.commit()
        self._svc.db.refresh(new_test)
        update_order_status(self._svc.db, order_id)
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.AUTHORIZE_RETEST,
            message="Authorized re-test created.",
            escalatedTestId=original_test.id,
            newTestId=new_test.id,
        )

    def _resolve_authorize_recollect(
        self,
        original_test: OrderTest,
        user_id: int,
        reason: str,
    ) -> EscalationResolveResult:
        order_id = original_test.orderId
        test_code = original_test.testCode
        if not original_test.sampleId:
            raise LabOperationError("Cannot authorize re-collect — no sample linked", status_code=400)

        sample = self._svc._get_sample(original_test.sampleId)
        TestStateMachine.validate_transition(TestStatus.ESCALATED, TestStatus.SUPERSEDED)
        original_test.status = TestStatus.SUPERSEDED

        if sample.status == SampleStatus.COLLECTED:
            self._svc.quality._reject_sample_record(sample, user_id, reason, None)

        new_sample = self._svc.quality._create_recollection_sample(
            sample, user_id, reason, supervisor_authorized=True
        )
        self._svc.quality._reattach_tests_to_recollection(sample, new_sample)

        codes = list(new_sample.testCodes or [])
        if test_code not in codes:
            codes.append(test_code)
            new_sample.testCodes = codes
            flag_modified(new_sample, "testCodes")

        new_test = OrderTest(
            orderId=order_id,
            testCode=test_code,
            status=TestStatus.PENDING,
            priceAtOrder=original_test.priceAtOrder,
            sampleId=new_sample.sampleId,
            isRetest=True,
            retestOfTestId=original_test.id,
            retestNumber=0,
            technicianNotes=f"Authorized re-collect: {reason}",
            flags=original_test.flags,
            isReflexTest=original_test.isReflexTest,
            triggeredBy=original_test.triggeredBy,
            reflexRule=original_test.reflexRule,
        )
        self._svc.db.add(new_test)
        self._svc.db.flush()
        original_test.retestOrderTestId = new_test.id

        ticket = self._svc.escalation.resolve_ticket(
            original_test.id,
            EscalationResolutionAction.AUTHORIZE_RECOLLECT,
            user_id,
            notes=reason,
        )

        self._svc.quality._record_issue(
            order_id=order_id,
            stage=QualityStage.VALIDATION,
            domain=QualityDomain.SPECIMEN,
            reason=reason,
            notes=None,
            remedy=RemedyType.REQUEST_RECOLLECTION,  # Supervisor-authorized recollection
            user_id=user_id,
            order_test_id=original_test.id,
            sample_id=sample.sampleId,
            test_code=test_code,
            created_test_id=new_test.id,
            created_sample_id=new_sample.sampleId,
        )

        self._svc.audit.log_escalation_resolution_authorize_recollect(
            order_id=order_id,
            test_code=test_code,
            original_test_id=original_test.id,
            new_test_id=new_test.id,
            new_sample_id=new_sample.sampleId,
            ticket_id=ticket.id,
            user_id=user_id,
            reason=reason,
        )

        self._svc.audit.log_recollection_request(
            original_sample_id=sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            recollection_reason=reason,
            recollection_attempt=new_sample.recollectionAttempt,
            comment=reason,
        )

        self._svc.db.commit()
        self._svc.db.refresh(new_test)
        update_order_status(self._svc.db, order_id)
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.AUTHORIZE_RECOLLECT,
            message=f"Re-collect authorized. New sample ID: {new_sample.sampleId}",
            escalatedTestId=original_test.id,
            newTestId=new_test.id,
            newSampleId=new_sample.sampleId,
        )

    def _resolve_apply_amendment(
        self,
        order_test: OrderTest,
        user_id: int,
        validation_notes: Optional[str],
    ) -> EscalationResolveResult:
        order_id = order_test.orderId
        test_code = order_test.testCode
        ticket = self._svc.escalation.get_open_ticket(order_test.id)
        if not ticket or ticket.reasonCode != EscalationReasonCode.AMEND_RES:
            raise LabOperationError("No amendment escalation ticket found", status_code=404)

        proposed = (ticket.ticketMetadata or {}).get("proposedResults")
        if not proposed:
            raise LabOperationError("Amendment ticket has no proposed results", status_code=400)

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        test_def = self._svc.db.query(Test).filter(Test.code == test_code).first()
        result_items = test_def.resultItems if test_def else []

        if result_items:
            validation_errors = self._svc.result_validator.validate_results(proposed, result_items)
            if self._svc.result_validator.has_blocking_errors(validation_errors):
                error_msg = self._svc.result_validator.format_error_message(validation_errors)
                raise LabOperationError(error_msg, status_code=400, error_code="VALIDATION_ERROR")

        patient = order.patient if order else None
        patient_gender = patient.gender.value if patient and patient.gender else None
        patient_dob = patient.dateOfBirth if patient else None

        flags = []
        if result_items:
            flags = self._svc.flag_calculator.calculate_flags(
                results=proposed,
                result_items=result_items,
                patient_gender=patient_gender,
                patient_dob=patient_dob,
            )

        order_test.results = self._svc._results_to_json_serializable(proposed)
        if flags:
            order_test.flags = self._svc.flag_calculator.flags_to_string_list(flags)
            flag_modified(order_test, "flags")
        order_test.hasCriticalValues = self._svc.flag_calculator.has_critical_values(flags)
        
        order_test.resultValidatedAt = datetime.now(timezone.utc)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED

        self._svc.escalation.resolve_ticket(
            order_test.id,
            EscalationResolutionAction.APPLY_AMENDMENT,
            user_id,
            notes=validation_notes,
        )

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        completion_meta = build_order_completion_metadata(order) if order else {}

        self._svc.audit.log_escalation_resolution_apply_amendment(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            ticket_id=ticket.id,
            user_id=user_id,
            validation_notes=validation_notes,
            metadata=completion_meta,
        )

        self._svc.db.commit()
        self._svc.db.refresh(order_test)
        update_order_status(self._svc.db, order_id)
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.APPLY_AMENDMENT,
            message="Amendment applied and test validated.",
            escalatedTestId=order_test.id,
        )

    def _resolve_cancel_test(
        self,
        original_test: OrderTest,
        user_id: int,
        reason: str,
    ) -> EscalationResolveResult:
        order_id = original_test.orderId
        test_code = original_test.testCode
        TestStateMachine.validate_transition(TestStatus.ESCALATED, TestStatus.CANCELLED)
        original_test.status = TestStatus.CANCELLED
        original_test.validationNotes = reason

        ticket = self._svc.escalation.resolve_ticket(
            original_test.id,
            EscalationResolutionAction.CANCEL_TEST,
            user_id,
            notes=reason,
        )

        self._svc.quality._record_issue(
            order_id=order_id,
            stage=QualityStage.VALIDATION,
            domain=QualityDomain.CLINICAL,
            reason=reason,
            notes=None,
            remedy=RemedyType.CANCEL,
            user_id=user_id,
            order_test_id=original_test.id,
            sample_id=original_test.sampleId,
            test_code=test_code,
        )

        self._svc.audit.log_escalation_resolution_cancel_test(
            order_id=order_id,
            test_code=test_code,
            test_id=original_test.id,
            sample_id=original_test.sampleId or 0,
            user_id=user_id,
            reason=reason,
            metadata={"ticketId": ticket.id},
        )

        self._svc.db.commit()
        self._svc.db.refresh(original_test)
        update_order_status(self._svc.db, order_id)
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.CANCEL_TEST,
            message="Test cancelled.",
            escalatedTestId=original_test.id,
        )


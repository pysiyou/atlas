"""
Unified Lab Operations Service

Coordinates state machine validation, audit logging, and non-quality-issue operations.
Quality issues are handled by QualityIssueService.
"""
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.models.sample import Sample
from app.models.order import Order, OrderTest
from app.models.test import Test
from app.schemas.enums import (
    PaymentStatus,
    SampleStatus,
    TestStatus,
    RemedyType,
    EscalationReasonCode,
    EscalationResolutionAction,
    QualityStage,
    QualityDomain,
    LabOperationType,
)
from app.services.state_machine import SampleStateMachine, TestStateMachine, StateTransitionError
from app.services.audit_service import AuditService
from app.services.order_status_updater import update_order_status
from app.services.result_validator import ResultValidatorService
from app.services.flag_calculator import FlagCalculatorService
from app.services.escalation_engine import EscalationEngine
from app.services.escalation_resolver_service import EscalationResolverService
from app.services.sample_collection import SampleCollectionService
from app.services.quality import QualityIssueService
from app.services.recollection_request_service import RecollectionRequestService
from app.utils.exceptions import LabOperationError
from app.services.flag_calculator import FlagCalculatorService
from app.services.escalation_engine import EscalationEngine
from app.services.quality import QualityIssueService
from app.services.recollection_request_service import RecollectionRequestService
from app.utils.exceptions import LabOperationError


class EscalationResolveResult(BaseModel):
    success: bool
    action: EscalationResolutionAction
    message: str
    escalatedTestId: int
    newTestId: Optional[int] = None
    newSampleId: Optional[int] = None


class LabOperationsService:
    def __init__(self, db: Session):
        self.db = db
        self.audit = AuditService(db)
        self.escalation = EscalationEngine(db, self.audit)
        self.quality = QualityIssueService(db, self.audit, self.escalation)
        self.recollection = RecollectionRequestService(db, self.audit, self.quality)
        self.quality.recollection_requests = self.recollection
        self.result_validator = ResultValidatorService()
        self.flag_calculator = FlagCalculatorService()

    def _get_sample(self, sample_id: int, for_update: bool = False) -> Sample:
        query = self.db.query(Sample).filter(Sample.sampleId == sample_id)
        if for_update:
            query = query.with_for_update()
        sample = query.first()
        if not sample:
            raise LabOperationError(f"Sample {sample_id} not found", status_code=404)
        return sample

    def _get_order_test(
        self,
        order_test_id: int,
        status: Optional[TestStatus] = None,
        for_update: bool = False,
    ) -> OrderTest:
        query = self.db.query(OrderTest).filter(OrderTest.id == order_test_id)
        if status:
            query = query.filter(OrderTest.status == status)
        if for_update:
            query = query.with_for_update()
        order_test = query.first()
        if not order_test:
            status_msg = f" with status '{status.value}'" if status else ""
            raise LabOperationError(
                f"Order test {order_test_id} not found{status_msg}",
                status_code=404,
            )
        return order_test

    def _assert_order_paid_for_collection(self, order_id: int) -> None:
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        if not order:
            raise LabOperationError(f"Order {order_id} not found", status_code=404)
        if order.paymentStatus != PaymentStatus.PAID:
            raise LabOperationError(
                "Sample collection requires payment. Mark the order as paid before collecting.",
                status_code=402,
            )

    def _serialize_sample_state(self, sample: Sample) -> Dict[str, Any]:
        return {
            "sampleId": sample.sampleId,
            "status": sample.status.value if sample.status else None,
            "collectedAt": sample.collectedAt.isoformat() if sample.collectedAt else None,
            "rejectedAt": sample.rejectedAt.isoformat() if sample.rejectedAt else None,
            "recollectionAttempt": sample.recollectionAttempt,
        }

    @staticmethod
    def _results_to_json_serializable(results: Dict[str, Any]) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        for k, v in results.items():
            if v is None or isinstance(v, (str, int, float, bool)):
                out[k] = v
            elif isinstance(v, BaseModel):
                out[k] = v.model_dump()
            elif isinstance(v, dict):
                out[k] = LabOperationsService._results_to_json_serializable(v)
            elif isinstance(v, list):
                out[k] = [
                    item.model_dump() if isinstance(item, BaseModel) else item
                    for item in v
                ]
            else:
                out[k] = v
        return out

    def _linked_order_tests(
        self,
        sample: Sample,
        *,
        exclude_statuses: Optional[list[TestStatus]] = None,
    ) -> list[OrderTest]:
        query = self.db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode.in_(sample.testCodes),
            OrderTest.sampleId == sample.sampleId,
        )
        if exclude_statuses:
            query = query.filter(OrderTest.status.notin_(exclude_statuses))
        return query.all()

    # ── Sample operations ────────────────────────────────────────────────

    def collect_sample(
        self,
        sample_id: int,
        user_id: int,
        collected_volume: float,
        container_type: str,
        container_color: str,
        collection_notes: Optional[str] = None,
    ) -> Sample:
        sample = self._get_sample(sample_id, for_update=True)  # Add row lock
        self._assert_order_paid_for_collection(sample.orderId)
        before_state = self._serialize_sample_state(sample)

        try:
            SampleStateMachine.validate_transition(sample.status, SampleStatus.COLLECTED)
        except StateTransitionError as e:
            raise LabOperationError(e.message, status_code=400)

        sample.status = SampleStatus.COLLECTED
        sample.collectedAt = datetime.now(timezone.utc)
        sample.collectedBy = str(user_id)
        sample.collectedVolume = collected_volume
        sample.actualContainerType = container_type
        sample.actualContainerColor = container_color
        sample.collectionNotes = collection_notes
        sample.remainingVolume = collected_volume
        sample.updatedBy = str(user_id)

        order_tests = self._linked_order_tests(
            sample,
            exclude_statuses=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.VALIDATED, TestStatus.CANCELLED],
        )
        for order_test in order_tests:
            # Validate state machine transition before forcing status change
            if TestStateMachine.can_transition(order_test.status, TestStatus.SAMPLE_COLLECTED):
                order_test.status = TestStatus.SAMPLE_COLLECTED
                order_test.sampleId = sample_id
            # else: Skip invalid transitions (log warning if needed in production)

        after_state = self._serialize_sample_state(sample)
        self.audit.log_sample_collection(
            sample_id=sample_id,
            user_id=user_id,
            before_state=before_state,
            after_state=after_state,
            metadata={"testCodes": sample.testCodes},
            comment=collection_notes,
        )

        self.db.commit()
        self.recollection.mark_fulfilled_when_sample_collected(sample_id)
        self.db.commit()
        self.db.refresh(sample)
        update_order_status(self.db, sample.orderId)
        return sample

    # ── Result operations ────────────────────────────────────────────────

    def enter_results(
        self,
        order_test_id: int,
        user_id: int,
        results: Dict[str, Any],
        technician_notes: Optional[str] = None,
        skip_validation: bool = False,
    ) -> OrderTest:
        order_test = self._get_order_test(order_test_id, for_update=True)  # Add row lock
        order_id = order_test.orderId
        test_code = order_test.testCode

        can_enter, reason = TestStateMachine.can_enter_results(order_test.status)
        if not can_enter:
            raise LabOperationError(reason, status_code=400)

        test_def = self.db.query(Test).filter(Test.code == test_code).first()
        result_items = test_def.resultItems if test_def else []

        if not skip_validation and result_items:
            validation_errors = self.result_validator.validate_results(results, result_items)
            if self.result_validator.has_blocking_errors(validation_errors):
                error_msg = self.result_validator.format_error_message(validation_errors)
                raise LabOperationError(error_msg, status_code=400, error_code="VALIDATION_ERROR")

        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        patient = order.patient if order else None
        patient_gender = patient.gender.value if patient and patient.gender else None
        patient_dob = patient.dateOfBirth if patient else None

        flags = []
        if result_items:
            flags = self.flag_calculator.calculate_flags(
                results=results,
                result_items=result_items,
                patient_gender=patient_gender,
                patient_dob=patient_dob,
            )

        results_serializable = self._results_to_json_serializable(results)
        order_test.results = results_serializable
        order_test.resultEnteredAt = datetime.now(timezone.utc)
        order_test.enteredBy = str(user_id)
        order_test.technicianNotes = technician_notes
        if flags:
            order_test.flags = self.flag_calculator.flags_to_string_list(flags)
            flag_modified(order_test, "flags")

        has_critical = self.flag_calculator.has_critical_values(flags)
        order_test.hasCriticalValues = has_critical

        if has_critical:
            critical_flags = self.flag_calculator.get_critical_flags(flags)
            self.audit.log_critical_value_detected(
                order_id=order_id,
                test_id=order_test.id,
                test_code=test_code,
                user_id=user_id,
                critical_values=self.flag_calculator.flags_to_json(critical_flags),
            )
            self.escalation.escalate_test(
                order_test,
                EscalationReasonCode.CRIT_VAL,
                user_id,
                metadata={
                    "criticalValues": self.flag_calculator.flags_to_json(critical_flags),
                    "results": results_serializable,
                },
                from_status=TestStatus.SAMPLE_COLLECTED,
            )
        else:
            order_test.status = TestStatus.RESULTED

        self.audit.log_result_entry(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            results=results_serializable,
            comment=technician_notes,
        )

        self.db.commit()
        self.db.refresh(order_test)
        update_order_status(self.db, order_id)
        return order_test

    def validate_results(
        self,
        order_test_id: int,
        user_id: int,
        validation_notes: Optional[str] = None,
    ) -> OrderTest:
        order_test = self._get_order_test(order_test_id, status=TestStatus.RESULTED, for_update=True)  # Add row lock
        order_id = order_test.orderId
        test_code = order_test.testCode

        # Note: The status filter above ensures order_test.status == RESULTED,
        # so no need for additional escalation check here.

        can_validate, reason = TestStateMachine.can_validate(order_test.status)
        if not can_validate:
            raise LabOperationError(reason)

        # Allow approve even when linked specimen is rejected — validator owns the decision.
        # Record that context in validation notes for audit when applicable.
        if order_test.sampleId:
            sample = self._get_sample(order_test.sampleId)
            if sample.status == SampleStatus.REJECTED:
                reject_note = (
                    f"[Approved with rejected specimen {sample.sampleId}"
                    f"{f': {sample.rejectionReason}' if sample.rejectionReason else ''}]"
                )
                validation_notes = (
                    f"{validation_notes.strip()} {reject_note}".strip()
                    if validation_notes and validation_notes.strip()
                    else reject_note
                )

        order_test.resultValidatedAt = datetime.now(timezone.utc)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED

        self.audit.log_result_validation_approve(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            validation_notes=validation_notes,
        )

        self.db.commit()
        self.db.refresh(order_test)
        update_order_status(self.db, order_id)
        return order_test

    # ── Amendment workflow ────────────────────────────────────────────

    def request_amendment(
        self,
        order_test_id: int,
        user_id: int,
        amendment_reason: str,
        proposed_results: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
    ) -> OrderTest:
        """
        Request amendment for a validated test result.
        Creates AMEND-RES escalation for supervisor review.
        """
        order_test = self._get_order_test(order_test_id, status=TestStatus.VALIDATED)
        order_id = order_test.orderId
        test_code = order_test.testCode

        # Validate transition from VALIDATED to ESCALATED
        can_escalate, reason = TestStateMachine.can_transition(
            TestStatus.VALIDATED, TestStatus.ESCALATED
        )
        if not can_escalate:
            raise LabOperationError(reason, status_code=400)

        # Prepare metadata with amendment details
        metadata = {
            "amendmentReason": amendment_reason,
            "originalResults": order_test.results,
            "originalValidatedAt": order_test.resultValidatedAt.isoformat() if order_test.resultValidatedAt else None,
            "originalValidatedBy": order_test.validatedBy,
            "requestNotes": notes,
        }
        if proposed_results:
            metadata["proposedResults"] = proposed_results

        # Create escalation ticket
        ticket = self.escalation.escalate_test(
            order_test,
            EscalationReasonCode.AMEND_RES,
            user_id,
            metadata=metadata,
            from_status=TestStatus.VALIDATED,
        )

        self.audit.log_operation(
            operation_type=LabOperationType.QUALITY_ISSUE_REPORTED,
            entity_type="order_test",
            entity_id=order_test.id,
            user_id=user_id,
            metadata={
                "stage": "amendment",
                "reason": amendment_reason,
                "ticketId": ticket.id,
            },
        )

        self.db.commit()
        self.db.refresh(order_test)
        update_order_status(self.db, order_id)
        return order_test

    # ── Escalation resolution ────────────────────────────────────────────

    def resolve_escalation(
        self,
        order_test_id: int,
        user_id: int,
        action: EscalationResolutionAction,
        validation_notes: Optional[str] = None,
        rejection_reason: Optional[str] = None,
        read_back_payload: Optional[Dict[str, Any]] = None,
    ) -> EscalationResolveResult:
        order_test = self._get_order_test(order_test_id, status=TestStatus.ESCALATED)
        order_id = order_test.orderId
        test_code = order_test.testCode
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
        ticket = self.escalation.resolve_ticket(
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

        self.audit.log_escalation_resolution_force_validate(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            ticket_id=ticket.id,
            user_id=user_id,
            validation_notes=validation_notes,
            metadata=ticket.ticketMetadata,
        )

        self.db.commit()
        self.db.refresh(order_test)
        update_order_status(self.db, order_id)
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

        new_test = self.quality._create_retest(
            original_test,
            user_id,
            reason,
            None,
            retest_number=0,
            technician_note_prefix="Authorized re-test (escalation)",
        )

        self.escalation.resolve_ticket(
            original_test.id,
            EscalationResolutionAction.AUTHORIZE_RETEST,
            user_id,
            notes=reason,
        )

        self.quality._record_issue(
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

        self.audit.log_escalation_resolution_authorize_retest(
            order_id=order_id,
            test_code=test_code,
            original_test_id=original_test.id,
            new_test_id=new_test.id,
            user_id=user_id,
            reason=reason,
        )

        self.db.commit()
        self.db.refresh(new_test)
        update_order_status(self.db, order_id)
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

        sample = self._get_sample(original_test.sampleId)
        TestStateMachine.validate_transition(TestStatus.ESCALATED, TestStatus.SUPERSEDED)
        original_test.status = TestStatus.SUPERSEDED

        if sample.status == SampleStatus.COLLECTED:
            self.quality._reject_sample_record(sample, user_id, reason, None)

        new_sample = self.quality._create_recollection_sample(
            sample, user_id, reason, supervisor_authorized=True
        )
        self.quality._reattach_tests_to_recollection(sample, new_sample)

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
        self.db.add(new_test)
        self.db.flush()
        original_test.retestOrderTestId = new_test.id

        ticket = self.escalation.resolve_ticket(
            original_test.id,
            EscalationResolutionAction.AUTHORIZE_RECOLLECT,
            user_id,
            notes=reason,
        )

        self.quality._record_issue(
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

        self.audit.log_escalation_resolution_authorize_recollect(
            order_id=order_id,
            test_code=test_code,
            original_test_id=original_test.id,
            new_test_id=new_test.id,
            new_sample_id=new_sample.sampleId,
            ticket_id=ticket.id,
            user_id=user_id,
            reason=reason,
        )

        self.audit.log_recollection_request(
            original_sample_id=sample.sampleId,
            new_sample_id=new_sample.sampleId,
            user_id=user_id,
            recollection_reason=reason,
            recollection_attempt=new_sample.recollectionAttempt,
            comment=reason,
        )

        self.db.commit()
        self.db.refresh(new_test)
        update_order_status(self.db, order_id)
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
        ticket = self.escalation.get_open_ticket(order_test.id)
        if not ticket or ticket.reasonCode != EscalationReasonCode.AMEND_RES:
            raise LabOperationError("No amendment escalation ticket found", status_code=404)

        proposed = (ticket.ticketMetadata or {}).get("proposedResults")
        if not proposed:
            raise LabOperationError("Amendment ticket has no proposed results", status_code=400)

        # Re-validate proposed results
        order = self.db.query(Order).filter(Order.id == order_id).first()
        test_def = self.db.query(Test).filter(Test.testCode == test_code).first()
        
        if test_def and order:
            # Validate results against physiologic limits
            result_items = self.result_validator.validate_results(
                proposed, test_def, order.patient
            )
            # Recalculate flags
            updated_results = self.flag_calculator.calculate_flags(
                result_items, test_def
            )
            order_test.results = updated_results
            order_test.hasCriticalValues = any(r.get('isCritical') for r in updated_results)
        else:
            # Fallback if test definition is missing
            order_test.results = proposed
        
        order_test.resultValidatedAt = datetime.now(timezone.utc)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED

        self.escalation.resolve_ticket(
            order_test.id,
            EscalationResolutionAction.APPLY_AMENDMENT,
            user_id,
            notes=validation_notes,
        )

        self.audit.log_escalation_resolution_apply_amendment(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            ticket_id=ticket.id,
            user_id=user_id,
            validation_notes=validation_notes,
        )

        self.db.commit()
        self.db.refresh(order_test)
        update_order_status(self.db, order_id)
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

        ticket = self.escalation.resolve_ticket(
            original_test.id,
            EscalationResolutionAction.CANCEL_TEST,
            user_id,
            notes=reason,
        )

        self.quality._record_issue(
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

        self.audit.log_escalation_resolution_cancel_test(
            order_id=order_id,
            test_code=test_code,
            test_id=original_test.id,
            sample_id=original_test.sampleId or 0,
            user_id=user_id,
            reason=reason,
            metadata={"ticketId": ticket.id},
        )

        self.db.commit()
        self.db.refresh(original_test)
        update_order_status(self.db, order_id)
        return EscalationResolveResult(
            success=True,
            action=EscalationResolutionAction.CANCEL_TEST,
            message="Test cancelled.",
            escalatedTestId=original_test.id,
        )

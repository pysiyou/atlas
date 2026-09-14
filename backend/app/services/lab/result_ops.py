"""Lab workflow resultoperations operations."""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm.attributes import flag_modified

from app.models.order import Order, OrderTest
from app.models.test import Test
from app.schemas.enums import (
    EscalationReasonCode,
    LabOperationType,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.schemas.enums import OrderStatus
from app.services.lab.delta_check import DeltaCheckService
from app.services.lab.reflex import ReflexEngine
from app.services.lab.state import TestStateMachine
from app.services.orders.order import OrderService, build_order_completion_metadata, update_order_status
from app.utils.exceptions import LabOperationError

class ResultOperations:
    def __init__(self, svc):
        self._svc = svc

    def enter_results(
        self,
        order_test_id: int,
        user_id: int,
        results: Dict[str, Any],
        technician_notes: Optional[str] = None,
        skip_validation: bool = False,
    ) -> OrderTest:
        order_test = self._svc._get_order_test(order_test_id, for_update=True)  # Add row lock
        order_id = order_test.orderId
        test_code = order_test.testCode

        can_enter, reason = TestStateMachine.can_enter_results(order_test.status)
        if not can_enter:
            raise LabOperationError(reason, status_code=400)

        test_def = self._svc.db.query(Test).filter(Test.code == test_code).first()
        result_items = test_def.resultItems if test_def else []

        if not skip_validation and result_items:
            validation_errors = self._svc.result_validator.validate_results(results, result_items)
            if self._svc.result_validator.has_blocking_errors(validation_errors):
                error_msg = self._svc.result_validator.format_error_message(validation_errors)
                raise LabOperationError(error_msg, status_code=400, error_code="VALIDATION_ERROR")

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        patient = order.patient if order else None
        patient_gender = patient.gender.value if patient and patient.gender else None
        patient_dob = patient.dateOfBirth if patient else None

        flags = []
        if result_items:
            flags = self._svc.flag_calculator.calculate_flags(
                results=results,
                result_items=result_items,
                patient_gender=patient_gender,
                patient_dob=patient_dob,
            )

        results_serializable = self._svc._results_to_json_serializable(results)
        order_test.results = results_serializable
        order_test.resultEnteredAt = datetime.now(timezone.utc)
        order_test.enteredBy = str(user_id)
        order_test.technicianNotes = technician_notes
        if flags:
            order_test.flags = self._svc.flag_calculator.flags_to_string_list(flags)
            flag_modified(order_test, "flags")

        has_critical = self._svc.flag_calculator.has_critical_values(flags)
        order_test.hasCriticalValues = has_critical

        if order and patient:
            delta_warnings = DeltaCheckService(self._svc.db).check_results(
                patient_id=order.patientId,
                test_code=test_code,
                results=results_serializable,
                exclude_order_test_id=order_test.id,
            )
            if delta_warnings:
                delta_flag_strings = [
                    f"DELTA:{w.item_code}:{w.percent_change}"
                    for w in delta_warnings
                ]
                existing_flags = list(order_test.flags or [])
                order_test.flags = existing_flags + delta_flag_strings
                flag_modified(order_test, "flags")
                self._svc.audit.log_operation(
                    operation_type=LabOperationType.RESULT_ENTRY,
                    entity_type="order_test",
                    entity_id=order_test.id,
                    user_id=user_id,
                    metadata={
                        "deltaChecks": [
                            {
                                "itemCode": w.item_code,
                                "percentChange": w.percent_change,
                                "priorValue": w.prior_value,
                                "currentValue": w.current_value,
                            }
                            for w in delta_warnings
                        ]
                    },
                )

        if has_critical:
            critical_flags = self._svc.flag_calculator.get_critical_flags(flags)
            self._svc.audit.log_critical_value_detected(
                order_id=order_id,
                test_id=order_test.id,
                test_code=test_code,
                user_id=user_id,
                critical_values=self._svc.flag_calculator.flags_to_json(critical_flags),
            )
            self._svc.escalation.escalate_test(
                order_test,
                EscalationReasonCode.CRIT_VAL,
                user_id,
                metadata={
                    "criticalValues": self._svc.flag_calculator.flags_to_json(critical_flags),
                    "results": results_serializable,
                },
                from_status=TestStatus.SAMPLE_COLLECTED,
            )
        else:
            order_test.status = TestStatus.RESULTED

        self._svc.audit.log_result_entry(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            results=results_serializable,
            comment=technician_notes,
        )

        self._svc.db.commit()
        self._svc.db.refresh(order_test)
        update_order_status(self._svc.db, order_id)
        return order_test

    def validate_results(
        self,
        order_test_id: int,
        user_id: int,
        validation_notes: Optional[str] = None,
    ) -> OrderTest:
        order_test = self._svc._get_order_test(order_test_id, status=TestStatus.RESULTED, for_update=True)  # Add row lock
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
            sample = self._svc._get_sample(order_test.sampleId)
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

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        completion_meta = build_order_completion_metadata(order) if order else {}

        self._svc.audit.log_result_validation_approve(
            order_id=order_id,
            test_code=test_code,
            test_id=order_test.id,
            user_id=user_id,
            validation_notes=validation_notes,
            metadata=completion_meta,
        )

        reflex_added = ReflexEngine(self._svc.db).evaluate_after_validation(order_test, user_id)
        if reflex_added:
            reflex_note = "; ".join(
                f"Reflex {r.added_test_code}: {r.rule_description}" for r in reflex_added
            )
            order_test.validationNotes = (
                f"{order_test.validationNotes or ''} [{reflex_note}]".strip()
            )

        self._svc.db.commit()
        self._svc.db.refresh(order_test)
        update_order_status(self._svc.db, order_id)

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        if order and order.overallStatus == OrderStatus.COMPLETED:
            try:
                OrderService(self._svc.db).mark_as_reported(order_id)
            except Exception:
                pass

        return order_test

    def reject_results(
        self,
        order_test_id: int,
        user_id: int,
        rejection_reason: str,
        validation_notes: Optional[str] = None,
        preferred_remedy: Optional[RemedyType] = None,
    ):
        """Reject resulted test via validate endpoint (delegates to quality workflow)."""
        return self._svc.quality._report_test_issue(
            order_test_id=order_test_id,
            user_id=user_id,
            reason=rejection_reason,
            notes=validation_notes,
            preferred_remedy=preferred_remedy,
        )

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
        order_test = self._svc._get_order_test(order_test_id, status=TestStatus.VALIDATED)
        order_id = order_test.orderId

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
        ticket = self._svc.escalation.escalate_test(
            order_test,
            EscalationReasonCode.AMEND_RES,
            user_id,
            metadata=metadata,
            from_status=TestStatus.VALIDATED,
        )

        self._svc.audit.log_operation(
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

        self._svc.db.commit()
        self._svc.db.refresh(order_test)
        update_order_status(self._svc.db, order_id)
        return order_test



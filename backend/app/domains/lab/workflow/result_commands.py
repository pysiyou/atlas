"""Lab result entry, validation, and amendment commands."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.lab.results.delta_check import DeltaCheckService
from app.domains.lab.results.reflex import ReflexEngine
from app.domains.lab.rules.state_machines import TestStateMachine
from app.domains.orders.models import Order, OrderTest
from app.platform.utils.exceptions import LabOperationError
from app.shared.contracts.enums import (
    EscalationReasonCode,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from sqlalchemy.orm.attributes import flag_modified


class ResultCommandHandler:
    def __init__(self, svc):
        self._svc = svc

    def enter_results(
        self,
        order_test_id: int,
        user_id: int,
        results: dict[str, Any],
        technician_notes: str | None = None,
        skip_validation: bool = False,
    ) -> OrderTest:
        order_test = self._svc._get_order_test(order_test_id, for_update=True)
        order_id = order_test.orderId
        test_code = order_test.testCode

        from app.domains.lab.rules.eligibility import assert_can_enter_results

        assert_can_enter_results(order_test)

        test_def = self._svc.db.query(CatalogTest).filter(CatalogTest.code == test_code).first()
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
        order_test.resultEnteredAt = datetime.now(UTC)
        order_test.enteredBy = str(user_id)
        order_test.technicianNotes = technician_notes
        if flags:
            order_test.flags = self._svc.flag_calculator.flags_to_string_list(flags)
            flag_modified(order_test, "flags")

        has_critical = self._svc.flag_calculator.has_critical_values(flags)
        order_test.hasCriticalValues = has_critical

        delta_warnings: list = []
        if order and patient:
            delta_warnings = DeltaCheckService(self._svc.db).check_results(
                patient_id=order.patientId,
                test_code=test_code,
                results=results_serializable,
                exclude_order_test_id=order_test.id,
            )
            if delta_warnings:
                delta_flag_strings = [
                    f"DELTA:{w.item_code}:{w.percent_change}" for w in delta_warnings
                ]
                existing_flags = list(order_test.flags or [])
                order_test.flags = existing_flags + delta_flag_strings
                flag_modified(order_test, "flags")

        enter_metadata: dict[str, Any] = {
            "source": "manual" if user_id > 0 else "analyzer",
            "results": results_serializable,
        }
        if order_test.flags:
            enter_metadata["flags"] = list(order_test.flags)
        if technician_notes and str(technician_notes).strip():
            enter_metadata["notes"] = str(technician_notes).strip()
        if delta_warnings:
            enter_metadata["delta_checks"] = [
                {
                    "item_code": w.item_code,
                    "percent_change": w.percent_change,
                    "prior_value": w.prior_value,
                    "current_value": w.current_value,
                }
                for w in delta_warnings
            ]

        if has_critical:
            critical_flags = self._svc.flag_calculator.get_critical_flags(flags)
            crit_json = self._svc.flag_calculator.flags_to_json(critical_flags)
            self._svc.emitter.result_critical_detected(
                order_id,
                order_test.id,
                test_code,
                user_id,
                metadata={"critical_values": crit_json, "results": results_serializable},
            )
            self._svc.escalation.escalate_test(
                order_test,
                EscalationReasonCode.CRIT_VAL,
                user_id,
                metadata={
                    "criticalValues": crit_json,
                    "results": results_serializable,
                },
                from_status=TestStatus.SAMPLE_COLLECTED,
            )
        else:
            order_test.status = TestStatus.RESULTED

        self._svc.emitter.result_entered(
            order_id,
            order_test.id,
            test_code,
            user_id,
            metadata=enter_metadata,
        )

        return order_test

    def validate_results(
        self,
        order_test_id: int,
        user_id: int,
        validation_notes: str | None = None,
    ) -> OrderTest:
        order_test = self._svc._get_order_test(
            order_test_id, status=TestStatus.RESULTED, for_update=True
        )  # Add row lock
        order_id = order_test.orderId

        # Note: The status filter above ensures order_test.status == RESULTED,
        # so no need for additional escalation check here.

        from app.domains.lab.rules.eligibility import assert_can_validate

        assert_can_validate(order_test)

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

        order_test.resultValidatedAt = datetime.now(UTC)
        order_test.validatedBy = str(user_id)
        order_test.validationNotes = validation_notes
        order_test.status = TestStatus.VALIDATED

        approve_metadata: dict[str, Any] = {"validation_notes": validation_notes}
        if order_test.results:
            approve_metadata["results"] = order_test.results
        if order_test.flags:
            approve_metadata["flags"] = list(order_test.flags)

        self._svc.emitter.validation_approved(
            order_id,
            order_test.id,
            order_test.testCode,
            user_id,
            metadata=approve_metadata,
        )

        reflex_added = ReflexEngine(self._svc.db).evaluate_after_validation(order_test, user_id)
        if reflex_added:
            reflex_note = "; ".join(
                f"Reflex {r.added_test_code}: {r.rule_description}" for r in reflex_added
            )
            order_test.validationNotes = (
                f"{order_test.validationNotes or ''} [{reflex_note}]".strip()
            )
            for reflex in reflex_added:
                self._svc.emitter.order_test_reflex(
                    order_id,
                    reflex.order_test_id,
                    reflex.added_test_code,
                    order_test.testCode,
                    user_id,
                )

        return order_test

    def reject_results(
        self,
        order_test_id: int,
        user_id: int,
        rejection_reason: str,
        validation_notes: str | None = None,
        preferred_remedy: RemedyType | None = None,
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
        proposed_results: dict[str, Any] | None = None,
        notes: str | None = None,
    ) -> OrderTest:
        """
        Request amendment for a validated test result.
        Creates AMEND-RES escalation for supervisor review.
        """
        order_test = self._svc._get_order_test(
            order_test_id, status=TestStatus.VALIDATED, for_update=True
        )

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
            "originalValidatedAt": order_test.resultValidatedAt.isoformat()
            if order_test.resultValidatedAt
            else None,
            "originalValidatedBy": order_test.validatedBy,
            "requestNotes": notes,
        }
        if proposed_results:
            metadata["proposedResults"] = proposed_results

        # Create escalation ticket
        self._svc.escalation.escalate_test(
            order_test,
            EscalationReasonCode.AMEND_RES,
            user_id,
            metadata=metadata,
            from_status=TestStatus.VALIDATED,
        )

        return order_test

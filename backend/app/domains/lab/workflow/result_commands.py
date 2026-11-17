"""Lab result entry and validation commands."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.domains.catalog.service import analyte_definitions_for_test
from app.domains.lab.constants import ANALYZER_USER_ID, is_analyzer_user_id
from app.domains.catalog.models import OrderableTest
from app.domains.lab.results.delta_check import DeltaCheckService
from app.domains.lab.results.flags import ResultFlag
from app.domains.lab.results.reflex import ReflexEngine
from app.domains.orders.models import Order, OrderTest
from app.platform.utils import parse_numeric_result_value
from app.platform.utils import LabOperationError
from app.shared.contracts.enums import (
    RemedyType,
    ResultStatus,
    SampleStatus,
    TestStatus,
)
from sqlalchemy.orm.attributes import flag_modified


def _scalar_result_value(raw: Any) -> Any:
    """Unwrap `{value: ...}` payloads while keeping plain scalars."""
    numeric = parse_numeric_result_value(raw)
    if numeric is not None:
        return numeric
    if isinstance(raw, dict) and "value" in raw:
        return raw.get("value")
    return raw


def _reference_range_text(flag: ResultFlag | None) -> str:
    if flag is None:
        return ""
    if flag.reference_low is not None and flag.reference_high is not None:
        return f"{flag.reference_low} - {flag.reference_high}"
    if flag.reference_low is not None:
        return f"> {flag.reference_low}"
    if flag.reference_high is not None:
        return f"< {flag.reference_high}"
    return ""


class ResultCommandHandler:
    def __init__(self, svc):
        self._svc = svc

    def _shape_stored_results(
        self,
        results: dict[str, Any],
        analyte_definitions: list[dict[str, Any]],
        flags: list[ResultFlag],
    ) -> dict[str, Any]:
        """Persist value + catalog unit/reference/status so clients do not own flags."""
        flags_by_code = {flag.analyte_code: flag for flag in flags}
        items_by_code = {}
        for item in analyte_definitions:
            code = item.get("analyte_code")
            if code:
                items_by_code[code] = item
        shaped: dict[str, Any] = {}
        for code, raw in results.items():
            item = items_by_code.get(code) or {}
            flag = flags_by_code.get(code)
            status = flag.status.value if flag is not None else ResultStatus.NORMAL.value
            shaped[code] = {
                "value": _scalar_result_value(raw),
                "unit": item.get("unit") or (flag.unit if flag is not None else None),
                "referenceRange": _reference_range_text(flag),
                "status": status,
            }
        return self._svc._results_to_json_serializable(shaped)

    def enter_results(
        self,
        order_test_id: int,
        user_id: str,
        results: dict[str, Any],
        technician_notes: str | None = None,
        skip_validation: bool = False,
        extra_metadata: dict[str, Any] | None = None,
    ) -> OrderTest:
        order_test = self._svc._get_order_test(order_test_id, for_update=True)
        order_id = order_test.orderId
        test_code = order_test.testCode

        from app.domains.lab.rules.eligibility import assert_can_enter_results

        assert_can_enter_results(order_test)

        analyte_defs = analyte_definitions_for_test(self._svc.db, test_code)

        if not skip_validation and analyte_defs:
            validation_errors = self._svc.result_validator.validate_results(results, analyte_defs)
            if self._svc.result_validator.has_blocking_errors(validation_errors):
                error_msg = self._svc.result_validator.format_error_message(validation_errors)
                raise LabOperationError(error_msg, status_code=400, error_code="VALIDATION_ERROR")

        order = self._svc.db.query(Order).filter(Order.orderId == order_id).first()
        patient = order.patient if order else None
        patient_gender = patient.gender.value if patient and patient.gender else None
        patient_dob = patient.dateOfBirth if patient else None

        flags = []
        if analyte_defs:
            flags = self._svc.flag_calculator.calculate_flags(
                results=results,
                analyte_definitions=analyte_defs,
                patient_gender=patient_gender,
                patient_dob=patient_dob,
            )

        results_serializable = (
            self._shape_stored_results(results, analyte_defs, flags)
            if analyte_defs
            else self._svc._results_to_json_serializable(results)
        )
        order_test.results = results_serializable
        flag_modified(order_test, "results")
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
                    f"DELTA:{w.analyte_code}:{w.percent_change}" for w in delta_warnings
                ]
                existing_flags = list(order_test.flags or [])
                order_test.flags = existing_flags + delta_flag_strings
                flag_modified(order_test, "flags")

        enter_metadata: dict[str, Any] = {
            "source": "analyzer" if is_analyzer_user_id(user_id) else "manual",
            "results": results_serializable,
        }
        if extra_metadata:
            enter_metadata.update(extra_metadata)
        if order_test.flags:
            enter_metadata["flags"] = list(order_test.flags)
        if technician_notes and str(technician_notes).strip():
            enter_metadata["notes"] = str(technician_notes).strip()
        if delta_warnings:
            enter_metadata["delta_checks"] = [
                {
                    "analyte_code": w.analyte_code,
                    "percent_change": w.percent_change,
                    "prior_value": w.prior_value,
                    "current_value": w.current_value,
                }
                for w in delta_warnings
            ]

        # Criticals stay RESULTED so they appear on the validation card (not a ticket).
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
        order_test.status = TestStatus.RESULTED

        self._svc.emitter.result_entered(
            order_id,
            order_test.id,
            test_code,
            user_id,
            metadata=enter_metadata,
        )

        self._maybe_auto_verify(
            order_test,
            user_id=user_id,
            flags=flags,
            delta_warnings=delta_warnings,
            extra_metadata=extra_metadata,
        )

        return order_test

    def _maybe_auto_verify(
        self,
        order_test: OrderTest,
        *,
        user_id: str,
        flags: list[ResultFlag],
        delta_warnings: list,
        extra_metadata: dict[str, Any] | None,
    ) -> None:
        """Auto-validate analyzer results that are fully normal."""
        from app.platform.config import client_config
        from app.shared.contracts.enums import ResultStatus as FlagStatus

        if not client_config.workflows.get("enableAutoVerification", False):
            return
        source = (extra_metadata or {}).get("source")
        is_analyzer = is_analyzer_user_id(user_id) or source == "analyzer"
        if not is_analyzer:
            return
        if order_test.status != TestStatus.RESULTED:
            return
        if order_test.hasCriticalValues:
            return
        if any(flag.status != FlagStatus.NORMAL for flag in flags):
            return
        if delta_warnings:
            return
        validated = self.validate_results(
            order_test.id,
            user_id=ANALYZER_USER_ID,
            validation_notes="Auto-verified",
        )
        self._svc.emitter.validation_auto(
            validated.orderId,
            validated.id,
            validated.testCode,
            ANALYZER_USER_ID,
            metadata={"source": "analyzer"},
        )

    def validate_results(
        self,
        order_test_id: int,
        user_id: str,
        validation_notes: str | None = None,
        critical_seen: bool = False,
    ) -> OrderTest:
        order_test = self._svc._get_order_test(
            order_test_id, status=TestStatus.RESULTED, for_update=True
        )  # Add row lock
        order_id = order_test.orderId

        from app.domains.lab.rules.eligibility import assert_can_validate
        from app.platform.config import client_config

        user_id_str = str(user_id)
        assert_can_validate(order_test, validator_id=user_id_str)

        if order_test.hasCriticalValues and not critical_seen:
            raise LabOperationError(
                "Confirm you have seen the critical result before approving.",
                status_code=400,
                error_code="CRITICAL_SEEN_REQUIRED",
            )
        if order_test.hasCriticalValues:
            order_test.criticalAcknowledgedAt = datetime.now(UTC)
            self._svc.emitter.result_critical_acknowledged(
                order_id,
                order_test.id,
                order_test.testCode,
                user_id,
                metadata={"source": "validation_confirm"},
            )

        require_dual = client_config.workflows.get("requireDualValidation", False)
        is_second_signoff = (
            require_dual and order_test.validatedBy and not order_test.secondValidatorId
        )
        is_first_dual_signoff = require_dual and not order_test.validatedBy

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

        now = datetime.now(UTC)
        if is_first_dual_signoff:
            order_test.validatedBy = user_id_str
            order_test.resultValidatedAt = now
            order_test.validationNotes = validation_notes
            # Await second validator; keep status RESULTED
        elif is_second_signoff:
            order_test.secondValidatorId = user_id_str
            order_test.secondValidatedAt = now
            if validation_notes:
                order_test.validationNotes = validation_notes
            order_test.status = TestStatus.VALIDATED
        else:
            order_test.resultValidatedAt = now
            order_test.validatedBy = user_id_str
            order_test.validationNotes = validation_notes
            order_test.status = TestStatus.VALIDATED

        approve_metadata: dict[str, Any] = {"validation_notes": validation_notes}
        if is_first_dual_signoff:
            approve_metadata["dual_validation"] = "first_signoff"
        if order_test.results:
            approve_metadata["results"] = order_test.results
        if order_test.flags:
            approve_metadata["flags"] = list(order_test.flags)

        if not is_first_dual_signoff:
            self._svc.emitter.validation_approved(
                order_id,
                order_test.id,
                order_test.testCode,
                user_id,
                metadata=approve_metadata,
            )

        reflex_added = []
        if not is_first_dual_signoff:
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
        user_id: str,
        rejection_reason: str,
        validation_notes: str | None = None,
        preferred_remedy: RemedyType | None = None,
    ):
        """Reject resulted test via validate endpoint (delegates to quality workflow)."""
        return self._svc.quality.report_test_validation_issue(
            order_test_id=order_test_id,
            user_id=user_id,
            reason=rejection_reason,
            notes=validation_notes,
            preferred_remedy=preferred_remedy,
        )

from __future__ import annotations

"""Lab domain constants not generated from contracts."""

# System actor for analyzer ingest; not a login account.
ANALYZER_USER_ID = "100000"


def is_analyzer_user_id(user_id: str | None) -> bool:
    """True when results were entered by the analyzer ingest path, not a human login."""
    if user_id is None:
        return False
    return str(user_id).strip() == ANALYZER_USER_ID

# --- from workflow/result_commands.py ---

"""Lab result entry and validation commands."""
from datetime import UTC, datetime
from typing import Any

from app.domains.catalog.service import analyte_definitions_for_test
from app.domains.catalog.models import OrderableTest
from app.domains.lab.results.service import DeltaCheckService
from app.domains.lab.results.service import ResultFlag
from app.shared.reference_range import band_low_high, resolve_reference_band
from app.domains.lab.results.service import ReflexEngine
from app.domains.orders.models import Order, OrderTest
from app.domains.lab.results.service import parse_numeric_result_value
from app.shared.exceptions import LabOperationError
from app.shared.enums import (
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


def _reference_range_text(
    flag: ResultFlag | None,
    *,
    analyte_item: dict[str, Any] | None = None,
) -> str:
    """Numeric flags supply bounds; SELECT/TEXT rows use catalog ``reference_range`` text."""
    if flag is not None:
        if flag.reference_low is not None and flag.reference_high is not None:
            return f"{flag.reference_low} - {flag.reference_high}"
        if flag.reference_low is not None:
            return f"> {flag.reference_low}"
        if flag.reference_high is not None:
            return f"< {flag.reference_high}"

    if analyte_item:
        band = resolve_reference_band(analyte_item.get("reference_range") or {})
        text = band.get("text")
        if text:
            return str(text).strip()
        low, high = band_low_high(band)
        if low is not None and high is not None:
            return f"{low} - {high}"
        if low is not None:
            return f"> {low}"
        if high is not None:
            return f"< {high}"
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
                "referenceRange": _reference_range_text(flag, analyte_item=item),
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

        from app.domains.lab.rules.service import assert_can_enter_results

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
        from app.shared.enums import ResultStatus as FlagStatus

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

        from app.domains.lab.rules.service import assert_can_validate
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

# --- from workflow/service.py ---

"""Unified Lab Operations Service — composition root for lab workflow mutations.

Transaction policy: every user-facing lab mutation runs through run_lab_mutation():
domain code mutates the shared Session only (no commit); rollup via apply_order_status_rollup;
one db.commit(); then board cache invalidation once.
"""

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any, TypeVar

from app.domains.audit.service import AuditEmitter
from app.domains.lab.specimen.models import Sample
from app.domains.lab.quality.service import CriticalNotificationService
from app.domains.lab.quality.service import QualityIssueService
from app.domains.lab.quality.service import RecollectionExecutionService
from app.domains.lab.results.service import FlagCalculatorService, ResultValidatorService
from app.domains.lab.rules.service import active_linked_tests_for_collection, assert_can_collect
from app.domains.lab.rules.service import TestStateMachine
from app.domains.lab.quality.schemas import AcknowledgeRequest, NotifyRequest
from app.domains.orders.models import Order, OrderTest
from app.domains.orders.service import apply_order_status_rollup
from app.platform.cache import invalidate_lab_board_summary_cache
from app.shared.exceptions import LabOperationError
from app.shared.enums import PaymentStatus, SampleStatus, TestStatus
from pydantic import BaseModel
from sqlalchemy.orm import Session

T = TypeVar("T")

__all__ = ["LabOperationsService", "LabOperationError"]


class CollectionCommandHandler:
    """Sample collection mutation used by LabOperationsService."""

    def __init__(self, svc: LabOperationsService):
        self._svc = svc

    @property
    def db(self):
        return self._svc.db

    def collect_sample(
        self,
        sample_id: str,
        user_id: str,
        collected_volume: float,
        container_type: str,
        container_color: str,
        collection_notes: str | None = None,
    ) -> Sample:
        sample = self._svc._get_sample(sample_id, for_update=True)
        order = self.db.query(Order).filter(Order.orderId == sample.orderId).first()
        if not order:
            raise LabOperationError(f"Order {sample.orderId} not found", status_code=404)
        order_tests_all = self._svc._linked_order_tests(sample)
        assert_can_collect(sample, order, order_tests_all)
        order_tests = active_linked_tests_for_collection(order_tests_all)
        before_state = self._svc._serialize_sample_state(sample)

        sample.status = SampleStatus.COLLECTED
        sample.collectedAt = datetime.now(UTC)
        sample.collectedBy = str(user_id)
        sample.collectedVolume = collected_volume
        sample.actualContainerType = container_type
        sample.actualContainerColor = container_color
        sample.collectionNotes = collection_notes
        sample.remainingVolume = collected_volume
        sample.updatedBy = str(user_id)

        for order_test in order_tests:
            if TestStateMachine.can_transition(order_test.status, TestStatus.SAMPLE_COLLECTED):
                order_test.status = TestStatus.SAMPLE_COLLECTED
                order_test.sampleId = sample_id
            elif order_test.status not in (
                TestStatus.SAMPLE_COLLECTED,
                TestStatus.RESULTED,
                TestStatus.ESCALATED,
            ):
                status_val = (
                    order_test.status.value if order_test.status else str(order_test.status)
                )
                raise LabOperationError(
                    f"Test {order_test.testCode} cannot be marked collected (status {status_val})",
                    status_code=400,
                    error_code="INVALID_TRANSITION",
                )

        after_state = self._svc._serialize_sample_state(sample)
        self._svc.emitter.sample_collected(
            sample_id,
            sample.orderId,
            user_id,
            before_state,
            after_state,
            metadata={"test_codes": sample.testCodes},
        )
        return sample


class LabOperationsService:
    """Composition root for lab workflow mutations."""

    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)
        self.recollection = RecollectionExecutionService(db, quality_service=None)
        self.quality = QualityIssueService(
            db,
            self.emitter,
            recollection_execution=self.recollection,
        )
        self.recollection.quality = self.quality
        self.result_validator = ResultValidatorService()
        self.flag_calculator = FlagCalculatorService()
        self._collection = CollectionCommandHandler(self)
        self._results = ResultCommandHandler(self)

    def _get_sample(self, sample_id: str, for_update: bool = False) -> Sample:
        from app.domains.lab.specimen.service import get_sample_or_error

        return get_sample_or_error(self.db, sample_id, for_update=for_update)

    def _get_order_test(
        self,
        order_test_id: int,
        status: TestStatus | None = None,
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

    def _order_id_for_order_test(self, order_test_id: int | str | None) -> str | None:
        """Resolve order_id without raising so missing tests skip cache targeting."""
        if order_test_id is None or order_test_id == "":
            return None
        try:
            parsed = int(order_test_id)
        except (TypeError, ValueError):
            return None
        ot = self.db.query(OrderTest).filter(OrderTest.id == parsed).first()
        return ot.orderId if ot else None

    def _assert_order_paid_for_collection(self, order_id: str) -> None:
        order = self.db.query(Order).filter(Order.orderId == order_id).first()
        if not order:
            raise LabOperationError(f"Order {order_id} not found", status_code=404)
        sample = (
            self.db.query(Sample)
            .filter(Sample.orderId == order_id, Sample.status == SampleStatus.PENDING)
            .first()
        )
        if sample:
            order_tests = self._linked_order_tests(sample)
            assert_can_collect(sample, order, order_tests)
        elif order.paymentStatus != PaymentStatus.PAID:
            raise LabOperationError(
                "Sample collection requires payment. Mark the order as paid before collecting.",
                status_code=402,
                error_code="PAYMENT_REQUIRED",
            )

    @staticmethod
    def _resolve_order_id(result: Any, explicit: str | None) -> str | None:
        if explicit:
            return explicit
        if result is None:
            return None
        if isinstance(result, dict):
            oid = result.get("orderId") or result.get("order_id")
            return str(oid) if oid is not None else None
        for attr in ("orderId", "order_id"):
            if hasattr(result, attr):
                val = getattr(result, attr)
                if val is not None:
                    return str(val)
        if hasattr(result, "sampleId"):
            return None
        return None

    def _refresh_mutation_result(self, result: Any) -> None:
        if isinstance(result, Sample | OrderTest):
            self.db.refresh(result)

    def run_lab_mutation(
        self,
        fn: Callable[[], T],
        *,
        order_id: str | None = None,
    ) -> T:
        """Single commit, in-session order rollup, cache invalidate. fn must not commit."""
        try:
            with self.db.begin_nested():
                result = fn()
                resolved_order_id = self._resolve_order_id(result, order_id)
                if resolved_order_id is not None:
                    apply_order_status_rollup(self.db, resolved_order_id)
            self.db.commit()
            self._refresh_mutation_result(result)
            self._invalidate_lab_monitor_cache()
            return result
        except LabOperationError:
            raise
        except Exception:
            self.db.rollback()
            raise

    def _serialize_sample_state(self, sample: Sample) -> dict[str, Any]:
        return {
            "sampleId": sample.sampleId,
            "status": sample.status.value if sample.status else None,
            "collectedAt": sample.collectedAt.isoformat() if sample.collectedAt else None,
            "rejectedAt": sample.rejectedAt.isoformat() if sample.rejectedAt else None,
            "recollectionAttempt": sample.recollectionAttempt,
        }

    @staticmethod
    def _results_to_json_serializable(results: dict[str, Any]) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for k, v in results.items():
            if v is None or isinstance(v, str | int | float | bool):
                out[k] = v
            elif isinstance(v, BaseModel):
                out[k] = v.model_dump()
            elif isinstance(v, dict):
                out[k] = LabOperationsService._results_to_json_serializable(v)
            elif isinstance(v, list):
                out[k] = [item.model_dump() if isinstance(item, BaseModel) else item for item in v]
            else:
                out[k] = v
        return out

    def _linked_order_tests(
        self,
        sample: Sample,
        *,
        exclude_statuses: list[TestStatus] | None = None,
    ) -> list[OrderTest]:
        from app.domains.lab.specimen.service import linked_order_tests_for_sample

        return linked_order_tests_for_sample(self.db, sample, exclude_statuses=exclude_statuses)

    def _invalidate_lab_monitor_cache(self) -> None:
        invalidate_lab_board_summary_cache()

    def collect_sample(self, **kwargs) -> Sample:
        sample_id = kwargs["sample_id"]
        row = self.db.query(Sample).filter(Sample.sampleId == sample_id).first()
        order_id = row.orderId if row else None
        return self.run_lab_mutation(
            lambda: self._collection.collect_sample(**kwargs),
            order_id=order_id,
        )

    def enter_results(self, **kwargs) -> OrderTest:
        return self.run_lab_mutation(
            lambda: self._results.enter_results(**kwargs),
            order_id=self._order_id_for_order_test(kwargs.get("order_test_id")),
        )

    def validate_results(self, **kwargs) -> OrderTest:
        from app.domains.orders.service import OrderService
        from app.shared.enums import OrderStatus

        def _mutate() -> OrderTest:
            return self._results.validate_results(**kwargs)

        order_test = self.run_lab_mutation(
            _mutate,
            order_id=self._order_id_for_order_test(kwargs.get("order_test_id")),
        )
        order = self.db.query(Order).filter(Order.orderId == order_test.orderId).first()
        if order and order.overallStatus == OrderStatus.COMPLETED:
            import logging

            logger = logging.getLogger(__name__)
            try:
                OrderService(self.db).mark_as_reported(
                    order_test.orderId, kwargs["user_id"]
                )
            except Exception as exc:
                logger.error(
                    "mark_as_reported failed after validation for order %s: %s",
                    order_test.orderId,
                    exc,
                    exc_info=True,
                )
        return order_test

    def reject_results(self, **kwargs):
        return self.run_lab_mutation(
            lambda: self._results.reject_results(**kwargs),
            order_id=self._order_id_for_order_test(kwargs.get("order_test_id")),
        )

    def report_quality_issue(self, **kwargs):
        from app.shared.enums import QualityIssueTargetType

        target_id = kwargs.get("target_id")
        target_type = kwargs.get("target_type")
        if target_type == QualityIssueTargetType.SAMPLE:
            sample = self.db.query(Sample).filter(Sample.sampleId == target_id).first()
            order_id = sample.orderId if sample else None
        else:
            order_id = self._order_id_for_order_test(target_id)
        return self.run_lab_mutation(
            lambda: self.quality.report_issue(**kwargs),
            order_id=order_id,
        )

    def notify_critical_value(self, test_id: int, request: NotifyRequest, user_id: str) -> dict:
        return self.run_lab_mutation(
            lambda: CriticalNotificationService(self.db).notify(test_id, request, user_id),
            order_id=self._order_id_for_order_test(test_id),
        )

    def acknowledge_critical_value(
        self, test_id: int, request: AcknowledgeRequest, user_id: str
    ) -> dict:
        return self.run_lab_mutation(
            lambda: CriticalNotificationService(self.db).acknowledge(test_id, request, user_id),
            order_id=self._order_id_for_order_test(test_id),
        )

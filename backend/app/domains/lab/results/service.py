from __future__ import annotations

# --- from order_test_display.py ---

"""Order-line display ids used on worklists and audit search."""
from app.shared.identifiers import looks_like_accession, looks_like_mnemonic


def format_order_test_display(accession: str | None, test_code: str | None) -> str:
    acc = (accession or "").strip()
    code = (test_code or "").strip().upper()
    if acc and code:
        return f"{acc}/{code}"
    return acc or code or "-"


def parse_order_test_display_search(term: str) -> tuple[str, str] | None:
    trimmed = term.strip()
    slash = trimmed.find("/")
    if slash <= 0:
        return None
    accession = trimmed[:slash].strip()
    test_code = trimmed[slash + 1 :].strip().upper()
    if not looks_like_accession(accession) or not looks_like_mnemonic(test_code):
        return None
    return accession, test_code


# --- from results/numeric.py ---

"""Parse numeric values from result entries (scalars, strings, structured payloads)."""

from typing import Any


def parse_numeric_result_value(value: Any) -> float | None:
    if value is None:
        return None

    if isinstance(value, dict):
        if "value" in value:
            return parse_numeric_result_value(value["value"])
        return None

    if hasattr(value, "model_dump"):
        dumped = value.model_dump()
        if isinstance(dumped, dict):
            return parse_numeric_result_value(dumped.get("value"))

    value_attr = getattr(value, "value", None)
    if value_attr is not None and not isinstance(value, str | int | float | bool):
        parsed = parse_numeric_result_value(value_attr)
        if parsed is not None:
            return parsed

    if isinstance(value, int | float):
        return float(value)

    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        if stripped[0] in "<>":
            stripped = stripped[1:].strip()
        try:
            return float(stripped)
        except ValueError:
            return None

    return None


# --- from results/flags.py ---

"""Result flag calculation from reference ranges."""
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from app.shared.reference_range import band_low_high, resolve_reference_band
from app.shared.enums import ResultStatus


@dataclass
class ResultFlag:
    """Calculated flag for one ``analyte_code`` on an orderable test."""

    analyte_code: str
    analyte_name: str
    value: float
    status: ResultStatus
    reference_low: float | None
    reference_high: float | None
    critical_low: float | None
    critical_high: float | None
    unit: str | None


class FlagCalculatorService:
    """
    Service for calculating result flags based on reference ranges.

    Determines if results are NORMAL, HIGH, LOW, CRITICAL_HIGH, or CRITICAL_LOW
    based on the test catalog reference ranges and patient demographics.
    """

    def calculate_flags(
        self,
        results: dict[str, Any],
        analyte_definitions: list[dict[str, Any]],
        patient_gender: str | None = None,
        patient_dob: str | None = None,
    ) -> list[ResultFlag]:
        """
        Calculate flags for all result values.

        Args:
            results: Dict of analyte_code -> value
            analyte_definitions: Analyte defs from catalog for this orderable test
            patient_gender: Patient gender ('male' or 'female')
            patient_dob: Patient date of birth (ISO format string)

        Returns:
            List of ResultFlag objects
        """
        flags = []
        patient_age = self._calculate_age(patient_dob) if patient_dob else None

        for item in analyte_definitions:
            analyte_code = item.get("analyte_code")
            if not analyte_code or analyte_code not in results:
                continue
            value = results[analyte_code]
            value_type = item.get("value_type", "NUMERIC")

            # Skip non-numeric values
            if value_type not in ("NUMERIC", "numeric"):
                continue

            # Parse numeric value (scalar or structured {"value": ...})
            numeric_value = parse_numeric_result_value(value)
            if numeric_value is None:
                continue

            # Get applicable reference range
            ref_band = resolve_reference_band(
                item.get("reference_range") or {},
                gender=patient_gender,
                age=patient_age,
            )
            ref_low, ref_high = band_low_high(ref_band)

            # Get critical range
            critical_range = item.get("critical_range", {})

            # Calculate status
            status = self._evaluate_value(
                numeric_value,
                ref_low,
                ref_high,
                critical_range.get("low"),
                critical_range.get("high"),
            )

            flags.append(
                ResultFlag(
                    analyte_code=analyte_code,
                    analyte_name=item.get("name") or analyte_code,
                    value=numeric_value,
                    status=status,
                    reference_low=ref_low,
                    reference_high=ref_high,
                    critical_low=critical_range.get("low"),
                    critical_high=critical_range.get("high"),
                    unit=item.get("unit"),
                )
            )

        return flags

    def _calculate_age(self, dob_str: str) -> int:
        """Calculate age from date of birth string"""
        try:
            if "T" in dob_str:
                dob = datetime.fromisoformat(dob_str.replace("Z", "+00:00")).date()
            else:
                dob = datetime.strptime(dob_str, "%Y-%m-%d").date()

            today = date.today()
            age = today.year - dob.year
            if (today.month, today.day) < (dob.month, dob.day):
                age -= 1
            return age
        except (ValueError, AttributeError):
            return 0

    def _evaluate_value(
        self,
        value: float,
        ref_low: float | None,
        ref_high: float | None,
        crit_low: float | None,
        crit_high: float | None,
    ) -> ResultStatus:
        """
        Evaluate a value against reference and critical ranges.

        Returns the appropriate ResultStatus.
        """
        # Check critical ranges first (most severe)
        if crit_low is not None and value < crit_low:
            return ResultStatus.CRITICAL_LOW
        if crit_high is not None and value > crit_high:
            return ResultStatus.CRITICAL_HIGH

        # Check reference ranges
        if ref_low is not None and value < ref_low:
            return ResultStatus.LOW
        if ref_high is not None and value > ref_high:
            return ResultStatus.HIGH

        return ResultStatus.NORMAL

    def has_critical_values(self, flags: list[ResultFlag]) -> bool:
        """Check if any flags indicate critical values"""
        critical_statuses = {
            ResultStatus.CRITICAL,
            ResultStatus.CRITICAL_HIGH,
            ResultStatus.CRITICAL_LOW,
        }
        return any(f.status in critical_statuses for f in flags)

    def get_critical_flags(self, flags: list[ResultFlag]) -> list[ResultFlag]:
        """Get only critical flags"""
        critical_statuses = {
            ResultStatus.CRITICAL,
            ResultStatus.CRITICAL_HIGH,
            ResultStatus.CRITICAL_LOW,
        }
        return [f for f in flags if f.status in critical_statuses]

    def flags_to_json(self, flags: list[ResultFlag]) -> list[dict[str, Any]]:
        """Convert flags to JSON-serializable format"""
        return [
            {
                "analyte_code": f.analyte_code,
                "analyte_name": f.analyte_name,
                "value": f.value,
                "status": f.status.value,
                "reference_low": f.reference_low,
                "reference_high": f.reference_high,
                "critical_low": f.critical_low,
                "critical_high": f.critical_high,
                "unit": f.unit,
            }
            for f in flags
        ]

    def flags_to_string_list(self, flags: list[ResultFlag]) -> list[str]:
        """Convert flags to simple string list for OrderTest.flags field"""
        result = []
        for f in flags:
            if f.status != ResultStatus.NORMAL:
                result.append(f"{f.analyte_code}:{f.status.value}")
        return result


# --- from results/validator.py ---

"""
Result Validator Service

Validates test results against catalog physiologic ranges and critical ranges.
"""
from dataclasses import dataclass
from typing import Any



@dataclass
class ResultValidationError:
    """Represents a validation error for a result value"""

    analyte_code: str
    value: Any
    error_type: str  # 'physiologic_limit', 'type_error', 'range_warning'
    message: str
    is_blocking: bool  # If True, prevents result entry


class ResultValidatorService:
    """Validates numeric results using catalog analyte definitions."""

    def validate_results(
        self, results: dict[str, Any], analyte_definitions: list[dict[str, Any]] | None = None
    ) -> list[ResultValidationError]:
        errors = []
        for analyte_code, value in results.items():
            item_errors = self._validate_single_result(analyte_code, value, analyte_definitions)
            errors.extend(item_errors)
        return errors

    def _validate_single_result(
        self, analyte_code: str, value: Any, analyte_definitions: list[dict[str, Any]] | None = None
    ) -> list[ResultValidationError]:
        errors = []

        item_def = None
        if analyte_definitions:
            item_def = next(
                (
                    item
                    for item in analyte_definitions
                    if item.get("analyte_code") == analyte_code
                ),
                None,
            )

        value_type = "NUMERIC"
        if item_def:
            value_type = item_def.get("value_type", "NUMERIC")

        if value_type not in ("NUMERIC", "numeric"):
            return errors

        numeric_value = parse_numeric_result_value(value)
        if numeric_value is None:
            return errors

        physiologic = item_def.get("physiologic_range") if item_def else None
        if (
            physiologic
            and physiologic.get("min") is not None
            and physiologic.get("max") is not None
        ):
            pmin = physiologic["min"]
            pmax = physiologic["max"]
            if numeric_value < pmin:
                errors.append(
                    ResultValidationError(
                        analyte_code=analyte_code,
                        value=value,
                        error_type="physiologic_limit",
                        message=(
                            f"{analyte_code} value {value} is below physiologic minimum ({pmin}). "
                            "This value is not compatible with life."
                        ),
                        is_blocking=True,
                    )
                )
            elif numeric_value > pmax:
                errors.append(
                    ResultValidationError(
                        analyte_code=analyte_code,
                        value=value,
                        error_type="physiologic_limit",
                        message=(
                            f"{analyte_code} value {value} exceeds physiologic maximum ({pmax}). "
                            "This value is not compatible with life."
                        ),
                        is_blocking=True,
                    )
                )

        if item_def:
            critical_range = item_def.get("critical_range", {})
            critical_low = critical_range.get("low")
            critical_high = critical_range.get("high")

            if critical_low is not None and numeric_value < critical_low:
                errors.append(
                    ResultValidationError(
                        analyte_code=analyte_code,
                        value=value,
                        error_type="critical_low",
                        message=f"{analyte_code} value {value} is critically low (< {critical_low})",
                        is_blocking=False,
                    )
                )
            elif critical_high is not None and numeric_value > critical_high:
                errors.append(
                    ResultValidationError(
                        analyte_code=analyte_code,
                        value=value,
                        error_type="critical_high",
                        message=f"{analyte_code} value {value} is critically high (> {critical_high})",
                        is_blocking=False,
                    )
                )

        return errors

    def has_blocking_errors(self, errors: list[ResultValidationError]) -> bool:
        return any(e.is_blocking for e in errors)

    def get_blocking_errors(
        self, errors: list[ResultValidationError]
    ) -> list[ResultValidationError]:
        return [e for e in errors if e.is_blocking]

    def format_error_message(self, errors: list[ResultValidationError]) -> str:
        blocking = self.get_blocking_errors(errors)
        if not blocking:
            return ""
        messages = [e.message for e in blocking]
        return "Validation failed: " + "; ".join(messages)


# --- from results/delta_check.py ---

"""Delta check — compare current result to patient's last validated value for same analyte."""

from dataclasses import dataclass
from typing import Any

from app.domains.orders.models import Order, OrderTest
from app.shared.enums import TestStatus
from sqlalchemy.orm import Session

DEFAULT_DELTA_PERCENT = 20.0


@dataclass
class DeltaCheckWarning:
    analyte_code: str
    current_value: float
    prior_value: float
    percent_change: float
    prior_order_test_id: int
    prior_validated_at: str


class DeltaCheckService:
    def __init__(self, db: Session):
        self.db = db

    def check_results(
        self,
        patient_id: str,
        test_code: str,
        results: dict[str, Any],
        exclude_order_test_id: int | None = None,
        delta_percent: float = DEFAULT_DELTA_PERCENT,
    ) -> list[DeltaCheckWarning]:
        warnings: list[DeltaCheckWarning] = []
        prior_tests = (
            self.db.query(OrderTest, Order)
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(
                Order.patientId == patient_id,
                OrderTest.testCode == test_code,
                OrderTest.status == TestStatus.VALIDATED,
                OrderTest.results.isnot(None),
            )
            .order_by(OrderTest.resultValidatedAt.desc())
            .limit(5)
            .all()
        )

        prior_results: dict[str, float] = {}
        prior_meta: dict[str, tuple] = {}
        for ot, _order in prior_tests:
            if exclude_order_test_id and ot.id == exclude_order_test_id:
                continue
            if not ot.results:
                continue
            for code, value in ot.results.items():
                if code in prior_results:
                    continue
                numeric = parse_numeric_result_value(value)
                if numeric is not None:
                    prior_results[code] = numeric
                    prior_meta[code] = (
                        ot.id,
                        ot.resultValidatedAt.isoformat() if ot.resultValidatedAt else "",
                    )

        for analyte_code, value in results.items():
            current = parse_numeric_result_value(value)
            prior = prior_results.get(analyte_code)
            if current is None or prior is None or prior == 0:
                continue
            pct = abs((current - prior) / prior) * 100.0
            if pct >= delta_percent:
                meta = prior_meta[analyte_code]
                warnings.append(
                    DeltaCheckWarning(
                        analyte_code=analyte_code,
                        current_value=current,
                        prior_value=prior,
                        percent_change=round(pct, 1),
                        prior_order_test_id=meta[0],
                        prior_validated_at=meta[1],
                    )
                )
        return warnings


# --- from results/reflex.py ---

"""Reflex testing engine — add linked tests after validation based on catalog rules."""

import json
from dataclasses import dataclass
from typing import Any

from app.domains.catalog.models import OrderableTest
from app.domains.lab.specimen.service import generate_samples_for_order
from app.domains.orders.models import Order, OrderTest
from app.shared.enums import TestStatus
from sqlalchemy.orm import Session

# Catalog-level reflex rules keyed by triggering test code
REFLEX_RULES: dict[str, list[dict[str, Any]]] = {}


@dataclass
class ReflexTriggerResult:
    added_test_code: str
    rule_description: str
    order_test_id: int


class ReflexEngine:
    def __init__(self, db: Session):
        self.db = db

    def _load_rules(self, test_code: str, test_def: OrderableTest | None) -> list[dict[str, Any]]:
        return list(REFLEX_RULES.get(test_code, []))

    def _evaluate_rule(self, rule: dict[str, Any], results: dict[str, Any]) -> bool:
        analyte_code = rule.get("analyte_code") or rule.get("analyte") or rule.get("item")
        if not analyte_code or analyte_code not in results:
            return False
        value = parse_numeric_result_value(results[analyte_code])
        if value is None:
            return False
        threshold = rule.get("value")
        op = rule.get("operator", "gt")
        if threshold is None:
            return False
        if op == "gt":
            return value > threshold
        if op == "gte":
            return value >= threshold
        if op == "lt":
            return value < threshold
        if op == "lte":
            return value <= threshold
        if op == "eq":
            return value == threshold
        return False

    def evaluate_after_validation(
        self,
        order_test: OrderTest,
        user_id: str,
    ) -> list[ReflexTriggerResult]:
        if not order_test.results:
            return []

        order = self.db.query(Order).filter(Order.orderId == order_test.orderId).first()
        if not order:
            return []

        test_def = (
            self.db.query(OrderableTest).filter(OrderableTest.code == order_test.testCode).first()
        )
        rules = self._load_rules(order_test.testCode, test_def)
        if not rules:
            return []

        added: list[ReflexTriggerResult] = []
        existing_codes = {
            t.testCode
            for t in self.db.query(OrderTest).filter(OrderTest.orderId == order.orderId).all()
            if t.status not in (TestStatus.CANCELLED, TestStatus.REMOVED, TestStatus.SUPERSEDED)
        }

        for rule in rules:
            add_code = rule.get("addTest")
            if not add_code or add_code in existing_codes:
                continue
            if not self._evaluate_rule(rule, order_test.results):
                continue

            reflex_test_def = (
                self.db.query(OrderableTest)
                .filter(OrderableTest.code == add_code, OrderableTest.isActive.is_(True))
                .first()
            )
            if not reflex_test_def:
                continue

            new_ot = OrderTest(
                orderId=order.orderId,
                testCode=add_code,
                status=TestStatus.PENDING,
                priceAtOrder=reflex_test_def.price,
                isReflexTest=True,
                triggeredBy=order_test.testCode,
                reflexRule=rule.get("rule") or f"Reflex from {order_test.testCode}",
            )
            self.db.add(new_ot)
            self.db.flush()

            generate_samples_for_order(order.orderId, self.db, user_id)

            added.append(
                ReflexTriggerResult(
                    added_test_code=add_code,
                    rule_description=new_ot.reflexRule or "",
                    order_test_id=new_ot.id,
                )
            )
            existing_codes.add(add_code)

        return added


# --- from results/query_service.py ---

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

    def get_order_test_context(self, order_test_id: int):
        from app.domains.lab.quality.models import EscalationTicket
        from app.domains.lab.specimen.models import Sample
        from app.domains.lab.rules.service import lab_projections_for_order
        from app.domains.orders.models import Order, OrderTest
        from app.shared.enums import EscalationTicketStatus
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
            projection = lab_projections_for_order(self.db, order_test.order).get(order_test.id)
        return self._with_lab_projection(item, projection)

    def _prior_test_display(self, order_test, samples_by_id) -> str | None:
        """Accession/mnemonic of the superseded test, when this row is a retest."""
        from app.domains.lab.specimen.models import Sample
        from app.domains.orders.models import OrderTest
        from app.domains.lab.results.service import format_order_test_display

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
        from app.domains.lab.quality.schemas import PendingEscalationItemResponse

        order = t.order
        patient = order.patient if order else None
        sample = samples_by_id.get(t.sampleId) if t.sampleId else None
        test_def = t.test
        ticket = tickets_by_test.get(t.id) if tickets_by_test else None
        reason_code = ticket.reasonCode.value if ticket and ticket.reasonCode else None
        from app.domains.lab.rules.service import escalation_action_flags

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

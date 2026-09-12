"""
Result Validator Service

Validates test results against physiologic limits and reference ranges.
Prevents entry of impossible values that could lead to patient harm.
"""
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.data.physiologic_limits import PHYSIOLOGIC_LIMITS
from app.schemas.enums import ResultStatus
from app.utils.result_values import PHYSIOLOGIC_LIMIT_ALIASES, parse_numeric_result_value


@dataclass
class ValidationError:
    """Represents a validation error for a result value"""
    item_code: str
    value: Any
    error_type: str  # 'physiologic_limit', 'type_error', 'range_warning'
    message: str
    is_blocking: bool  # If True, prevents result entry


class ResultValidatorService:
    """
    Service for validating test result values.

    Validates against:
    1. Physiologic limits (impossible values)
    2. Numeric type requirements
    3. Reference range warnings (non-blocking)
    """

    def __init__(self):
        self.physiologic_limits = PHYSIOLOGIC_LIMITS

    def validate_results(
        self,
        results: Dict[str, Any],
        result_items: Optional[List[Dict[str, Any]]] = None
    ) -> List[ValidationError]:
        """
        Validate all result values.

        Args:
            results: Dict of item_code -> value
            result_items: Optional list of result item definitions from test catalog

        Returns:
            List of ValidationError objects (empty if all valid)
        """
        errors = []

        for item_code, value in results.items():
            item_errors = self._validate_single_result(item_code, value, result_items)
            errors.extend(item_errors)

        return errors

    def _validate_single_result(
        self,
        item_code: str,
        value: Any,
        result_items: Optional[List[Dict[str, Any]]] = None
    ) -> List[ValidationError]:
        """Validate a single result value"""
        errors = []

        # Get result item definition if available
        item_def = None
        if result_items:
            item_def = next(
                (item for item in result_items if item.get('item_code') == item_code),
                None
            )

        # Determine if this should be numeric
        value_type = 'NUMERIC'  # Default assumption
        if item_def:
            value_type = item_def.get('value_type', 'NUMERIC')

        # Skip validation for non-numeric values
        if value_type not in ('NUMERIC', 'numeric'):
            return errors

        # Try to parse as number (scalar or structured {"value": ...})
        numeric_value = parse_numeric_result_value(value)
        if numeric_value is None:
            return errors

        # Check physiologic limits
        limit = self._get_physiologic_limit(item_code)
        if limit:
            if numeric_value < limit['min']:
                errors.append(ValidationError(
                    item_code=item_code,
                    value=value,
                    error_type='physiologic_limit',
                    message=f"{item_code} value {value} is below physiologic minimum ({limit['min']}). This value is not compatible with life.",
                    is_blocking=True
                ))
            elif numeric_value > limit['max']:
                errors.append(ValidationError(
                    item_code=item_code,
                    value=value,
                    error_type='physiologic_limit',
                    message=f"{item_code} value {value} exceeds physiologic maximum ({limit['max']}). This value is not compatible with life.",
                    is_blocking=True
                ))

        # Check against critical range from item definition
        if item_def:
            critical_range = item_def.get('critical_range', {})
            critical_low = critical_range.get('low')
            critical_high = critical_range.get('high')

            # These are warnings, not blocking errors
            if critical_low is not None and numeric_value < critical_low:
                errors.append(ValidationError(
                    item_code=item_code,
                    value=value,
                    error_type='critical_low',
                    message=f"{item_code} value {value} is critically low (< {critical_low})",
                    is_blocking=False
                ))
            elif critical_high is not None and numeric_value > critical_high:
                errors.append(ValidationError(
                    item_code=item_code,
                    value=value,
                    error_type='critical_high',
                    message=f"{item_code} value {value} is critically high (> {critical_high})",
                    is_blocking=False
                ))

        return errors

    def _get_physiologic_limit(self, item_code: str) -> Optional[Dict[str, float]]:
        """Get physiologic limit for an item code, checking various naming conventions."""
        resolved_code = PHYSIOLOGIC_LIMIT_ALIASES.get(item_code, item_code)

        # Direct match
        if resolved_code in self.physiologic_limits:
            return self.physiologic_limits[resolved_code]

        # Case-insensitive exact match
        resolved_upper = resolved_code.upper()
        for key, limit in self.physiologic_limits.items():
            if key.upper() == resolved_upper:
                return limit

        # Partial match for longer keys only (avoid "P" matching "PLAT")
        resolved_lower = resolved_code.lower()
        for key, limit in self.physiologic_limits.items():
            if len(key) < 3:
                continue
            key_lower = key.lower()
            if key_lower in resolved_lower or resolved_lower in key_lower:
                return limit

        return None

    def has_blocking_errors(self, errors: List[ValidationError]) -> bool:
        """Check if any errors are blocking"""
        return any(e.is_blocking for e in errors)

    def get_blocking_errors(self, errors: List[ValidationError]) -> List[ValidationError]:
        """Get only blocking errors"""
        return [e for e in errors if e.is_blocking]

    def format_error_message(self, errors: List[ValidationError]) -> str:
        """Format errors into a human-readable message"""
        blocking = self.get_blocking_errors(errors)
        if not blocking:
            return ""

        messages = [e.message for e in blocking]
        return "Validation failed: " + "; ".join(messages)


@dataclass
class ResultFlag:
    """Represents a calculated flag for a result item"""
    item_code: str
    item_name: str
    value: float
    status: ResultStatus
    reference_low: Optional[float]
    reference_high: Optional[float]
    critical_low: Optional[float]
    critical_high: Optional[float]
    unit: Optional[str]


class FlagCalculatorService:
    """
    Service for calculating result flags based on reference ranges.

    Determines if results are NORMAL, HIGH, LOW, CRITICAL_HIGH, or CRITICAL_LOW
    based on the test catalog reference ranges and patient demographics.
    """

    def calculate_flags(
        self,
        results: Dict[str, Any],
        result_items: List[Dict[str, Any]],
        patient_gender: Optional[str] = None,
        patient_dob: Optional[str] = None
    ) -> List[ResultFlag]:
        """
        Calculate flags for all result values.

        Args:
            results: Dict of item_code -> value
            result_items: List of result item definitions from test catalog
            patient_gender: Patient gender ('male' or 'female')
            patient_dob: Patient date of birth (ISO format string)

        Returns:
            List of ResultFlag objects
        """
        flags = []
        patient_age = self._calculate_age(patient_dob) if patient_dob else None

        for item in result_items:
            item_code = item.get('item_code')
            if item_code not in results:
                continue

            value = results[item_code]
            value_type = item.get('value_type', 'NUMERIC')

            # Skip non-numeric values
            if value_type not in ('NUMERIC', 'numeric'):
                continue

            # Parse numeric value (scalar or structured {"value": ...})
            numeric_value = parse_numeric_result_value(value)
            if numeric_value is None:
                continue

            # Get applicable reference range
            ref_range = self._get_applicable_range(
                item.get('reference_range', {}),
                patient_gender,
                patient_age
            )

            # Get critical range
            critical_range = item.get('critical_range', {})

            # Calculate status
            status = self._evaluate_value(
                numeric_value,
                ref_range.get('low'),
                ref_range.get('high'),
                critical_range.get('low'),
                critical_range.get('high')
            )

            flags.append(ResultFlag(
                item_code=item_code,
                item_name=item.get('item_name', item_code),
                value=numeric_value,
                status=status,
                reference_low=ref_range.get('low'),
                reference_high=ref_range.get('high'),
                critical_low=critical_range.get('low'),
                critical_high=critical_range.get('high'),
                unit=item.get('unit')
            ))

        return flags

    def _calculate_age(self, dob_str: str) -> int:
        """Calculate age from date of birth string"""
        try:
            if 'T' in dob_str:
                dob = datetime.fromisoformat(dob_str.replace('Z', '+00:00')).date()
            else:
                dob = datetime.strptime(dob_str, '%Y-%m-%d').date()

            today = date.today()
            age = today.year - dob.year
            if (today.month, today.day) < (dob.month, dob.day):
                age -= 1
            return age
        except (ValueError, AttributeError):
            return 0

    def _get_applicable_range(
        self,
        reference_range: Dict[str, Any],
        gender: Optional[str],
        age: Optional[int]
    ) -> Dict[str, Optional[float]]:
        """
        Select the appropriate reference range based on patient demographics.

        Priority:
        1. Gender-specific adult range (if gender matches)
        2. Pediatric range (if age < 18)
        3. General adult range
        """
        result = {'low': None, 'high': None}

        if not reference_range:
            return result

        # Check gender-specific ranges first
        if gender == 'male' and 'adult_male' in reference_range:
            return reference_range['adult_male']
        if gender == 'female' and 'adult_female' in reference_range:
            return reference_range['adult_female']

        # Check pediatric range
        if age is not None and age < 18 and 'pediatric' in reference_range:
            return reference_range['pediatric']

        # Fall back to general adult range
        if 'adult_general' in reference_range:
            return reference_range['adult_general']

        # Handle legacy format (direct low/high)
        if 'low' in reference_range or 'high' in reference_range:
            return {
                'low': reference_range.get('low'),
                'high': reference_range.get('high')
            }

        return result

    def _evaluate_value(
        self,
        value: float,
        ref_low: Optional[float],
        ref_high: Optional[float],
        crit_low: Optional[float],
        crit_high: Optional[float]
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

    def has_critical_values(self, flags: List[ResultFlag]) -> bool:
        """Check if any flags indicate critical values"""
        critical_statuses = {ResultStatus.CRITICAL, ResultStatus.CRITICAL_HIGH, ResultStatus.CRITICAL_LOW}
        return any(f.status in critical_statuses for f in flags)

    def has_abnormal_values(self, flags: List[ResultFlag]) -> bool:
        """Check if any flags indicate abnormal values"""
        abnormal_statuses = {
            ResultStatus.HIGH, ResultStatus.LOW,
            ResultStatus.CRITICAL, ResultStatus.CRITICAL_HIGH, ResultStatus.CRITICAL_LOW
        }
        return any(f.status in abnormal_statuses for f in flags)

    def get_critical_flags(self, flags: List[ResultFlag]) -> List[ResultFlag]:
        """Get only critical flags"""
        critical_statuses = {ResultStatus.CRITICAL, ResultStatus.CRITICAL_HIGH, ResultStatus.CRITICAL_LOW}
        return [f for f in flags if f.status in critical_statuses]

    def flags_to_json(self, flags: List[ResultFlag]) -> List[Dict[str, Any]]:
        """Convert flags to JSON-serializable format"""
        return [
            {
                'item_code': f.item_code,
                'item_name': f.item_name,
                'value': f.value,
                'status': f.status.value,
                'reference_low': f.reference_low,
                'reference_high': f.reference_high,
                'critical_low': f.critical_low,
                'critical_high': f.critical_high,
                'unit': f.unit
            }
            for f in flags
        ]

    def flags_to_string_list(self, flags: List[ResultFlag]) -> List[str]:
        """Convert flags to simple string list for OrderTest.flags field"""
        result = []
        for f in flags:
            if f.status != ResultStatus.NORMAL:
                result.append(f"{f.item_code}:{f.status.value}")
        return result


class ResultQueryService:
    """Read/query operations for result entry and escalation views."""

    def __init__(self, db: Session):
        self.db = db

    def get_pending_escalation(self) -> list:
        from sqlalchemy.orm import joinedload
        from app.models.order import Order, OrderTest
        from app.models.sample import Sample
        from app.models.escalation import EscalationTicket
        from app.schemas.enums import EscalationTicketStatus, TestStatus

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

        return [
            self._enrich_order_test(t, samples_by_id, tickets_by_test)
            for t in tests
        ]

    def get_order_test_context(self, order_test_id: int):
        from fastapi import HTTPException, status as http_status
        from sqlalchemy.orm import joinedload
        from app.models.order import Order, OrderTest
        from app.models.sample import Sample
        from app.models.escalation import EscalationTicket
        from app.schemas.enums import EscalationTicketStatus

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
        from app.schemas.lab import PendingEscalationItemResponse

        order = t.order
        patient = order.patient if order else None
        sample = samples_by_id.get(t.sampleId) if t.sampleId else None
        test_def = t.test
        ticket = tickets_by_test.get(t.id) if tickets_by_test else None
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
        )

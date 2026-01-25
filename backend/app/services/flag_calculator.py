"""
Flag Calculator Service

Calculates result flags (HIGH, LOW, CRITICAL) based on reference ranges.
Supports age and gender-specific reference ranges.
"""
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

from app.schemas.enums import ResultStatus


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

            # Parse numeric value
            try:
                if isinstance(value, str):
                    if value.startswith('<') or value.startswith('>'):
                        numeric_value = float(value[1:])
                    else:
                        numeric_value = float(value)
                else:
                    numeric_value = float(value)
            except (ValueError, TypeError):
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

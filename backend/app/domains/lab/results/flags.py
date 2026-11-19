"""Result flag calculation from reference ranges."""
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from app.domains.lab.results.numeric import parse_numeric_result_value
from app.shared.generated.enums import ResultStatus
from app.shared.ranges import band_low_high, resolve_reference_band


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

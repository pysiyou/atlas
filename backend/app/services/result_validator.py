"""
Result Validator Service

Validates test results against physiologic limits and reference ranges.
Prevents entry of impossible values that could lead to patient harm.
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from app.services.physiologic_limits import PHYSIOLOGIC_LIMITS
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

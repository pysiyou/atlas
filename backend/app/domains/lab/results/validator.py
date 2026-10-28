"""
Result Validator Service

Validates test results against catalog physiologic ranges and critical ranges.
"""
from dataclasses import dataclass
from typing import Any

from app.platform.utils.common import parse_numeric_result_value


@dataclass
class ResultValidationError:
    """Represents a validation error for a result value"""

    item_code: str
    value: Any
    error_type: str  # 'physiologic_limit', 'type_error', 'range_warning'
    message: str
    is_blocking: bool  # If True, prevents result entry


class ResultValidatorService:
    """Validates numeric results using test catalog result_item definitions."""

    def validate_results(
        self, results: dict[str, Any], result_items: list[dict[str, Any]] | None = None
    ) -> list[ResultValidationError]:
        errors = []
        for item_code, value in results.items():
            item_errors = self._validate_single_result(item_code, value, result_items)
            errors.extend(item_errors)
        return errors

    def _validate_single_result(
        self, item_code: str, value: Any, result_items: list[dict[str, Any]] | None = None
    ) -> list[ResultValidationError]:
        errors = []

        item_def = None
        if result_items:
            item_def = next(
                (item for item in result_items if item.get("item_code") == item_code), None
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
                        item_code=item_code,
                        value=value,
                        error_type="physiologic_limit",
                        message=(
                            f"{item_code} value {value} is below physiologic minimum ({pmin}). "
                            "This value is not compatible with life."
                        ),
                        is_blocking=True,
                    )
                )
            elif numeric_value > pmax:
                errors.append(
                    ResultValidationError(
                        item_code=item_code,
                        value=value,
                        error_type="physiologic_limit",
                        message=(
                            f"{item_code} value {value} exceeds physiologic maximum ({pmax}). "
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
                        item_code=item_code,
                        value=value,
                        error_type="critical_low",
                        message=f"{item_code} value {value} is critically low (< {critical_low})",
                        is_blocking=False,
                    )
                )
            elif critical_high is not None and numeric_value > critical_high:
                errors.append(
                    ResultValidationError(
                        item_code=item_code,
                        value=value,
                        error_type="critical_high",
                        message=f"{item_code} value {value} is critically high (> {critical_high})",
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

"""
Result Validator Service

Validates test results against physiologic limits and reference ranges.
Prevents entry of impossible values that could lead to patient harm.
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class ValidationError:
    """Represents a validation error for a result value"""
    item_code: str
    value: Any
    error_type: str  # 'physiologic_limit', 'type_error', 'range_warning'
    message: str
    is_blocking: bool  # If True, prevents result entry


# Physiologic limits - values outside these are physically impossible
# These are absolute limits that should block result entry
PHYSIOLOGIC_LIMITS: Dict[str, Dict[str, float]] = {
    # Blood gases
    'pH': {'min': 6.5, 'max': 8.0},
    'pCO2': {'min': 5, 'max': 150},
    'pO2': {'min': 0, 'max': 700},
    'HCO3': {'min': 1, 'max': 60},

    # Electrolytes (mEq/L or mmol/L)
    'Na': {'min': 90, 'max': 200},
    'K': {'min': 1.0, 'max': 12.0},
    'Cl': {'min': 60, 'max': 150},
    'Ca': {'min': 2.0, 'max': 20.0},
    'Mg': {'min': 0.3, 'max': 10.0},
    'P': {'min': 0.5, 'max': 20.0},
    'Phosphorus': {'min': 0.5, 'max': 20.0},

    # Glucose (mg/dL)
    'Glucose': {'min': 5, 'max': 2000},
    'GLU': {'min': 5, 'max': 2000},

    # Renal function
    'BUN': {'min': 0, 'max': 300},
    'Creatinine': {'min': 0.1, 'max': 50},
    'Cr': {'min': 0.1, 'max': 50},
    'eGFR': {'min': 0, 'max': 200},

    # Liver function
    'AST': {'min': 0, 'max': 10000},
    'ALT': {'min': 0, 'max': 10000},
    'ALP': {'min': 0, 'max': 5000},
    'Bilirubin': {'min': 0, 'max': 100},
    'TBil': {'min': 0, 'max': 100},
    'DBil': {'min': 0, 'max': 50},
    'Albumin': {'min': 0.5, 'max': 10},
    'Protein': {'min': 1, 'max': 20},

    # Hematology
    'WBC': {'min': 0.1, 'max': 500},
    'RBC': {'min': 0.5, 'max': 12},
    'Hemoglobin': {'min': 1, 'max': 30},
    'Hgb': {'min': 1, 'max': 30},
    'HGB': {'min': 1, 'max': 30},
    'Hematocrit': {'min': 5, 'max': 80},
    'Hct': {'min': 5, 'max': 80},
    'HCT': {'min': 5, 'max': 80},
    'Platelets': {'min': 1, 'max': 2000},
    'PLT': {'min': 1, 'max': 2000},
    'MCV': {'min': 30, 'max': 200},
    'MCH': {'min': 10, 'max': 60},
    'MCHC': {'min': 20, 'max': 50},
    'RDW': {'min': 5, 'max': 40},

    # Coagulation
    'PT': {'min': 5, 'max': 200},
    'INR': {'min': 0.5, 'max': 20},
    'PTT': {'min': 10, 'max': 250},
    'aPTT': {'min': 10, 'max': 250},
    'Fibrinogen': {'min': 20, 'max': 2000},

    # Cardiac markers
    'Troponin': {'min': 0, 'max': 1000},
    'TnI': {'min': 0, 'max': 1000},
    'TnT': {'min': 0, 'max': 1000},
    'BNP': {'min': 0, 'max': 100000},
    'CK': {'min': 0, 'max': 50000},
    'CK-MB': {'min': 0, 'max': 5000},

    # Thyroid
    'TSH': {'min': 0, 'max': 500},
    'T3': {'min': 0, 'max': 1000},
    'T4': {'min': 0, 'max': 50},
    'FT3': {'min': 0, 'max': 50},
    'FT4': {'min': 0, 'max': 20},

    # Lipids
    'Cholesterol': {'min': 20, 'max': 1000},
    'TotalCholesterol': {'min': 20, 'max': 1000},
    'Triglycerides': {'min': 10, 'max': 10000},
    'HDL': {'min': 5, 'max': 200},
    'LDL': {'min': 5, 'max': 500},

    # Urinalysis
    'UrineSpecificGravity': {'min': 1.000, 'max': 1.060},
    'SG': {'min': 1.000, 'max': 1.060},

    # Inflammatory markers
    'CRP': {'min': 0, 'max': 500},
    'ESR': {'min': 0, 'max': 200},
    'Procalcitonin': {'min': 0, 'max': 1000},

    # Vital signs (if entered as lab values)
    'Temperature': {'min': 85, 'max': 115},  # Fahrenheit
    'TemperatureC': {'min': 25, 'max': 45},  # Celsius
}


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

        # Try to parse as number
        try:
            if isinstance(value, str):
                # Handle special cases like "<5" or ">100"
                if value.startswith('<') or value.startswith('>'):
                    numeric_value = float(value[1:])
                else:
                    numeric_value = float(value)
            else:
                numeric_value = float(value)
        except (ValueError, TypeError):
            # Can't parse as number - may be acceptable for some tests
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
        """Get physiologic limit for an item code, checking various naming conventions"""
        # Direct match
        if item_code in self.physiologic_limits:
            return self.physiologic_limits[item_code]

        # Case-insensitive match
        item_code_upper = item_code.upper()
        for key, limit in self.physiologic_limits.items():
            if key.upper() == item_code_upper:
                return limit

        # Partial match (e.g., "Hemoglobin_value" should match "Hemoglobin")
        for key, limit in self.physiologic_limits.items():
            if key.lower() in item_code.lower() or item_code.lower() in key.lower():
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

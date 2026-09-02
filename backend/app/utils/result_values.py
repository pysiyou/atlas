"""
Helpers for parsing structured or scalar laboratory result values.
"""
from typing import Any, Optional


# Known item-code aliases for physiologic limit lookup.
PHYSIOLOGIC_LIMIT_ALIASES = {
    "PLAT": "PLT",
}


def parse_numeric_result_value(value: Any) -> Optional[float]:
    """
    Extract a numeric value from a result entry.

    Supports scalar values (7.2), strings ("7.2", "<5"), structured
    objects ({"value": 7.2, ...}), and Pydantic result models.
    """
    if value is None:
        return None

    if isinstance(value, dict):
        if "value" in value:
            return parse_numeric_result_value(value["value"])
        return None

    # Pydantic models and similar objects (e.g. TestResultValue)
    if hasattr(value, "model_dump"):
        dumped = value.model_dump()
        if isinstance(dumped, dict):
            return parse_numeric_result_value(dumped.get("value"))

    value_attr = getattr(value, "value", None)
    if value_attr is not None and not isinstance(value, (str, int, float, bool)):
        parsed = parse_numeric_result_value(value_attr)
        if parsed is not None:
            return parsed

    if isinstance(value, (int, float)):
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

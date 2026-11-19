"""Parse numeric values from result entries (scalars, strings, structured payloads)."""
from __future__ import annotations

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
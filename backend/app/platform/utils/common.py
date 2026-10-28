"""
Database helper utilities for common operations.
"""
import re
from typing import Any, TypeVar

from app.shared.contracts.rejection_reasons import (
    is_specimen_rejection_registry_value,
    rejection_reason_domain,
)
from fastapi import HTTPException
from sqlalchemy.orm import Session

T = TypeVar("T")


def get_or_404(
    db: Session,
    model: type[T],
    id_value: int | str,
    id_field: str = "id",
    detail: str | None = None,
) -> T:
    """
    Fetch entity by ID or raise 404 HTTPException.
    Supports int (orderId, patientId, paymentId) or str IDs.
    """
    entity = db.query(model).filter(getattr(model, id_field) == id_value).first()
    if not entity:
        raise HTTPException(
            status_code=404,
            detail=detail or f"{model.__name__} not found",
        )
    return entity


"""Resolve numeric entity ids from search terms (raw digits or prefixed display ids e.g. PAT0001)."""


def parse_csv_values(raw: str | None) -> list[str]:
    """Split a comma-separated query param into trimmed non-empty tokens."""
    if not raw:
        return []
    return [token.strip() for token in raw.split(",") if token.strip()]


def parse_display_id_from_search(search_term: str, prefix: str) -> int | None:
    compact = re.sub(r"[\s-]", "", search_term.strip())
    if compact.startswith("#"):
        compact = compact[1:]
    upper = compact.upper()
    pfx = prefix.upper()
    if upper.startswith(pfx) and len(upper) > len(pfx):
        suffix = upper[len(pfx) :]
        if suffix.isdigit():
            return int(suffix)
    if compact.isdigit():
        return int(compact)
    return None


"""
Helpers for parsing structured or scalar laboratory result values.
"""


def parse_numeric_result_value(value: Any) -> float | None:
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


def infer_criterion_domain(reason: str) -> str:
    """Return specimen or analytical for a catalog label, id, or legacy enum wire."""
    return rejection_reason_domain(reason) or "analytical"


def is_specimen_rejection_reason(reason: str) -> bool:
    """Return True when value indicates a specimen problem per the rejection registry."""
    return is_specimen_rejection_registry_value(reason)

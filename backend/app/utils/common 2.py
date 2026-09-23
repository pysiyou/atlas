"""
Database helper utilities for common operations.
"""
import re
from typing import Any, TypeVar

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.enums import RejectionReason

T = TypeVar("T")


def apply_updates(db_model: Any, update_schema: BaseModel) -> None:
    """
    Apply Pydantic schema updates to SQLAlchemy model.
    Only updates fields that are present in the schema (exclude_unset=True)
    and exist on the model.
    """
    update_data = update_schema.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(db_model, field):
            setattr(db_model, field, value)


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


def parse_display_id_from_search(search_term: str, prefix: str) -> int | None:
    compact = re.sub(r"[\s-]", "", search_term.strip())
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


# Known item-code aliases for physiologic limit lookup.
PHYSIOLOGIC_LIMIT_ALIASES = {
    "PLAT": "PLT",
}


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


"""
Detect specimen vs analytical rejection criteria from catalog strings or slug enums.
"""

# Slug enums used internally for routing.
SPECIMEN_CRITERIA = frozenset(
    {
        RejectionReason.HEMOLYZED.value,
        RejectionReason.CLOTTED.value,
        RejectionReason.QNS.value,
        RejectionReason.WRONG_CONTAINER.value,
        RejectionReason.LABELING_ERROR.value,
        RejectionReason.TRANSPORT_DELAY.value,
        RejectionReason.CONTAMINATED.value,
        RejectionReason.LIPEMIC.value,
        RejectionReason.ICTERIC.value,
    }
)

# Catalog rejection strings map to specimen slugs via keyword matching (fallback only).
_SPECIMEN_KEYWORDS: dict[str, tuple[str, ...]] = {
    RejectionReason.HEMOLYZED.value: ("hemolyz",),
    RejectionReason.CLOTTED.value: ("clot",),
    RejectionReason.QNS.value: ("qns", "insufficient quantity"),
    RejectionReason.WRONG_CONTAINER.value: ("wrong container", "incorrect container", "wrong tube"),
    RejectionReason.LABELING_ERROR.value: ("unlabeled", "mislabeled", "label"),
    RejectionReason.TRANSPORT_DELAY.value: ("transport delay", "transport"),
    RejectionReason.CONTAMINATED.value: ("contaminat",),
    RejectionReason.LIPEMIC.value: ("lipemic", "lipemia"),
    RejectionReason.ICTERIC.value: ("icteric",),
}


def infer_criterion_domain(reason: str) -> str:
    """Return specimen or analytical for a catalog string or slug."""
    return "specimen" if is_specimen_rejection_reason(reason) else "analytical"


def is_specimen_rejection_reason(reason: str) -> bool:
    """Return True when a catalog string or slug indicates a specimen problem."""
    if reason in SPECIMEN_CRITERIA:
        return True

    lower = reason.lower()
    return any(
        any(keyword in lower for keyword in keywords) for keywords in _SPECIMEN_KEYWORDS.values()
    )

"""Lab blocker vocabulary and blocked-reason resolution."""

from __future__ import annotations

from typing import Any

from app.domains.lab.rules.eligibility import blocked_reason_for_work_item
from app.shared.contracts.enums import (
    PriorityLevel,
)
from app.shared.contracts.lab_blockers import (
    ATTENTION_TYPE_SORT as _GENERATED_ATTENTION_SORT,
)
from app.shared.contracts.lab_blockers import (
    BLOCKED_ATTENTION_TYPE as _GENERATED_ATTENTION,
)
from app.shared.contracts.lab_blockers import (
    BLOCKED_LABELS,
)
from app.shared.contracts.lab_blockers import (
    PRIORITY_ATTENTION_TYPES as _GENERATED_PRIORITY_ATTENTION,
)
from app.shared.contracts.lab_blockers import (
    SUPERVISOR_ATTENTION_TYPES as _GENERATED_SUPERVISOR_ATTENTION,
)
from sqlalchemy import case

__all__ = [
    "BLOCKED_LABELS",
    "blocked_reason_for_work_item",
    "BLOCKED_ATTENTION_TYPE",
    "ATTENTION_TYPE_SORT",
    "SUPERVISOR_ATTENTION_TYPES",
    "PRIORITY_ATTENTION_TYPES",
    "should_surface_attention",
    "attention_type_for",
    "priority_rank",
    "priority_sort_key",
]

BLOCKED_ATTENTION_TYPE = dict(_GENERATED_ATTENTION)
ATTENTION_TYPE_SORT = dict(_GENERATED_ATTENTION_SORT)
SUPERVISOR_ATTENTION_TYPES = set(_GENERATED_SUPERVISOR_ATTENTION)
PRIORITY_ATTENTION_TYPES = set(_GENERATED_PRIORITY_ATTENTION)


def should_surface_attention(
    blocked_reason: str | None,
    status: str,
    *,
    always: bool = False,
) -> bool:
    """Surface blocked work, TAT breaches, and always-on supervisor items."""
    if always or blocked_reason:
        return True
    return status in ("warning", "critical")


def attention_type_for(
    blocked_reason: str | None,
    status: str,
    priority: str,
) -> str:
    if blocked_reason:
        return BLOCKED_ATTENTION_TYPE.get(blocked_reason, "queue_overdue_warning")
    if status == "critical":
        return "queue_overdue_critical"
    if status == "warning":
        return "queue_overdue_warning"
    if priority == PriorityLevel.URGENT.value:
        return "priority_urgent"
    if priority == PriorityLevel.HIGH.value:
        return "priority_high"
    return "queue_overdue_warning"


# ── Priority ranking (worklist sort + attention merge) ─────────────────

PRIORITY_RANK: dict[Any, int] = {
    PriorityLevel.URGENT: 0,
    PriorityLevel.HIGH: 1,
    PriorityLevel.MEDIUM: 2,
    PriorityLevel.LOW: 3,
    PriorityLevel.URGENT.value: 0,
    PriorityLevel.HIGH.value: 1,
    PriorityLevel.MEDIUM.value: 2,
    PriorityLevel.LOW.value: 3,
    "urgent": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
}

PRIORITY_WEIGHT: dict[str, int] = {
    PriorityLevel.URGENT.value: 4,
    PriorityLevel.HIGH.value: 3,
    PriorityLevel.MEDIUM.value: 2,
    PriorityLevel.LOW.value: 1,
    "urgent": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}


def priority_rank(priority: Any) -> int:
    if isinstance(priority, PriorityLevel):
        return PRIORITY_RANK.get(priority, 99)
    return PRIORITY_RANK.get(priority, 99)


def priority_sort_key(column):
    return case(
        (column == PriorityLevel.URGENT, 0),
        (column == PriorityLevel.HIGH, 1),
        (column == PriorityLevel.MEDIUM, 2),
        (column == PriorityLevel.LOW, 3),
        else_=99,
    )

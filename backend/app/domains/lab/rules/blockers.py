"""Lab attention vocabulary and attention-reason resolution."""

from __future__ import annotations

from typing import Any

from app.domains.lab.rules.eligibility import attention_reason_for_work_item
from app.shared.contracts.enums import PriorityLevel
from app.shared.contracts.lab_contract import (
    ATTENTION_LABELS,
)
from app.shared.contracts.lab_contract import (
    ATTENTION_TYPE_BY_REASON as _GENERATED_ATTENTION_TYPE_BY_REASON,
)
from app.shared.contracts.lab_contract import (
    ATTENTION_TYPE_SORT as _GENERATED_ATTENTION_TYPE_SORT,
)
from app.shared.contracts.lab_contract import (
    PRIORITY_ATTENTION_TYPES as _GENERATED_PRIORITY_ATTENTION,
)
from app.shared.contracts.lab_contract import (
    PRIORITY_RANK as _GENERATED_PRIORITY_RANK,
)
from app.shared.contracts.lab_contract import (
    PRIORITY_WEIGHT as _GENERATED_PRIORITY_WEIGHT,
)
from app.shared.contracts.lab_contract import (
    SUPERVISOR_ATTENTION_TYPES as _GENERATED_SUPERVISOR_ATTENTION,
)
from sqlalchemy import case

__all__ = [
    "ATTENTION_LABELS",
    "attention_reason_for_work_item",
    "ATTENTION_TYPE_BY_REASON",
    "ATTENTION_TYPE_SORT",
    "SUPERVISOR_ATTENTION_TYPES",
    "PRIORITY_ATTENTION_TYPES",
    "should_surface_attention",
    "attention_type_for",
    "priority_rank",
    "priority_sort_key",
    "PRIORITY_RANK",
    "PRIORITY_WEIGHT",
]

ATTENTION_TYPE_BY_REASON = dict(_GENERATED_ATTENTION_TYPE_BY_REASON)
ATTENTION_TYPE_SORT = dict(_GENERATED_ATTENTION_TYPE_SORT)
SUPERVISOR_ATTENTION_TYPES = set(_GENERATED_SUPERVISOR_ATTENTION)
PRIORITY_ATTENTION_TYPES = set(_GENERATED_PRIORITY_ATTENTION)


def should_surface_attention(
    attention_reason: str | None,
    status: str,
    *,
    always: bool = False,
) -> bool:
    """Surface blocked work, TAT breaches, and always-on supervisor items."""
    if always or attention_reason:
        return True
    return status in ("warning", "critical")


def attention_type_for(
    attention_reason: str | None,
    status: str,
    priority: str,
) -> str:
    if attention_reason:
        return ATTENTION_TYPE_BY_REASON.get(attention_reason, "queue_overdue_warning")
    if status == "critical":
        return "queue_overdue_critical"
    if status == "warning":
        return "queue_overdue_warning"
    if priority == PriorityLevel.URGENT.value:
        return "priority_urgent"
    if priority == PriorityLevel.HIGH.value:
        return "priority_high"
    return "queue_overdue_warning"


def _priority_rank_map() -> dict[Any, int]:
    rank = dict(_GENERATED_PRIORITY_RANK)
    rank.update(
        {
            PriorityLevel.URGENT: rank.get(PriorityLevel.URGENT.value, 99),
            PriorityLevel.HIGH: rank.get(PriorityLevel.HIGH.value, 99),
            PriorityLevel.MEDIUM: rank.get(PriorityLevel.MEDIUM.value, 99),
            PriorityLevel.LOW: rank.get(PriorityLevel.LOW.value, 99),
            PriorityLevel.URGENT.value: rank.get(PriorityLevel.URGENT.value, 99),
            PriorityLevel.HIGH.value: rank.get(PriorityLevel.HIGH.value, 99),
            PriorityLevel.MEDIUM.value: rank.get(PriorityLevel.MEDIUM.value, 99),
            PriorityLevel.LOW.value: rank.get(PriorityLevel.LOW.value, 99),
        }
    )
    return rank


PRIORITY_RANK = _priority_rank_map()
PRIORITY_WEIGHT = dict(_GENERATED_PRIORITY_WEIGHT)


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

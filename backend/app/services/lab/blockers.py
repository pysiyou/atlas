"""Lab blocker vocabulary and blocked-reason resolution."""

from __future__ import annotations

from typing import Any

from app.schemas.enums import (
    PriorityLevel,
)
from app.services.lab.eligibility import BLOCKED_LABELS, blocked_reason_for_work_item
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

BLOCKED_ATTENTION_TYPE = {
    "critical_value": "escalation_critical",
    "amendment_pending": "escalation_amendment",
    "retry_limit": "escalation_retry_limit",
    "recollection_limit": "escalation_recollection_limit",
    "supervisor_review": "supervisor_approval",
    "recollection_approval": "supervisor_recollection_request",
    "payment_unpaid": "payment_blocked",
    "sample_rejected": "sample_rejected",
    "specimen_recollection": "recollection_waiting",
    "retest_pending": "retest_in_progress",
}

ATTENTION_TYPE_SORT = {
    "escalation_critical": 10,
    "escalation_amendment": 20,
    "escalation_retry_limit": 30,
    "escalation_recollection_limit": 40,
    "supervisor_approval": 45,
    "supervisor_recollection_request": 48,
    "payment_blocked": 50,
    "sample_rejected": 60,
    "recollection_waiting": 70,
    "retest_in_progress": 80,
    "priority_urgent": 82,
    "priority_high": 84,
    "queue_overdue_critical": 90,
    "queue_overdue_warning": 100,
}

SUPERVISOR_ATTENTION_TYPES = {
    "escalation_critical",
    "escalation_amendment",
    "escalation_retry_limit",
    "escalation_recollection_limit",
    "supervisor_approval",
    "supervisor_recollection_request",
}

PRIORITY_ATTENTION_TYPES = {"priority_urgent", "priority_high"}


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

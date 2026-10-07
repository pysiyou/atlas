"""
Status presentation vocabulary — GENERATED from contracts/status-presentation.json. DO NOT EDIT.
"""
from __future__ import annotations

CANONICAL_PRIMARY_VALUES: tuple[str, ...] = (
    "pending",
    "blocked",
    "in_progress",
    "completed",
    "cancelled",
    "superseded",
    "removed",
    "escalated",
    "rejected",
)

BADGE_VARIANTS: dict[str, str] = {
    "pending": "neutral",
    "blocked": "warning",
    "in_progress": "info",
    "completed": "success",
    "cancelled": "danger",
    "superseded": "neutral",
    "removed": "neutral",
    "escalated": "danger",
    "rejected": "danger",
}

DISPLAY_LABELS: dict[str, str] = {
    "pending": "PENDING",
    "blocked": "BLOCKED",
    "in_progress": "IN PROGRESS",
    "completed": "COMPLETED",
    "cancelled": "CANCELLED",
    "superseded": "SUPERSEDED",
    "removed": "REMOVED",
    "escalated": "ESCALATED",
    "rejected": "REJECTED",
}

TERMINAL_TEST_STATUSES: frozenset[str] = frozenset(
    {
        "validated",
        "cancelled",
        "superseded",
        "removed",
    }
)

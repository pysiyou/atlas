"""
Laboratory policy contract — GENERATED from contracts/lab.json. DO NOT EDIT.
"""
from __future__ import annotations

# ── Limits ──────────────────────────────────────────────────────────────

MAX_RETEST_ATTEMPTS = 2
MAX_RECOLLECTION_ATTEMPTS = 2
QUEUE_AGE_WARNING_HOURS = 4
QUEUE_AGE_CRITICAL_HOURS = 8

# ── Blockers ────────────────────────────────────────────────────────────

ATTENTION_REASON_KEYS: frozenset[str] = frozenset(
    {
        "payment_unpaid",
        "sample_rejected",
        "critical_value",
        "amendment_pending",
        "retry_limit",
        "recollection_limit",
        "supervisor_review",
        "recollection_approval",
    }
)

BLOCKS_PROGRESS_REASONS: frozenset[str] = frozenset(
    {
        "payment_unpaid",
        "sample_rejected",
        "critical_value",
        "amendment_pending",
        "retry_limit",
        "recollection_limit",
        "supervisor_review",
        "recollection_approval",
    }
)

def reason_blocks_progress(reason: str | None) -> bool:
    if not reason:
        return False
    return reason in BLOCKS_PROGRESS_REASONS

ATTENTION_LABELS: dict[str, str] = {
    "payment_unpaid": "Payment required",
    "sample_rejected": "Sample rejected",
    "critical_value": "Critical value — supervisor review",
    "amendment_pending": "Amendment pending",
    "retry_limit": "Re-test limit reached",
    "recollection_limit": "Recollection limit reached",
    "supervisor_review": "Supervisor approval required",
    "recollection_approval": "Recollection awaiting supervisor approval",
}

ATTENTION_TYPE_BY_REASON: dict[str, str] = {
    "payment_unpaid": "payment_blocked",
    "sample_rejected": "sample_rejected",
    "critical_value": "escalation_critical",
    "amendment_pending": "escalation_amendment",
    "retry_limit": "escalation_retry_limit",
    "recollection_limit": "escalation_recollection_limit",
    "supervisor_review": "supervisor_approval",
    "recollection_approval": "supervisor_recollection_request",
}

ALLOWED_ACTION_KEYS: tuple[str, ...] = (
    "collect",
    "enterResults",
    "validate",
    "reject",
)

PIPELINE_STAGES: tuple[str, ...] = (
    "collection",
    "entry",
    "validation",
    "escalation",
    "completed",
    "cancelled",
)

ATTENTION_TYPE_SORT: dict[str, int] = {
    "escalation_critical": 10,
    "escalation_amendment": 20,
    "escalation_retry_limit": 30,
    "escalation_recollection_limit": 40,
    "supervisor_approval": 45,
    "supervisor_recollection_request": 48,
    "payment_blocked": 50,
    "sample_rejected": 60,
    "priority_urgent": 82,
    "priority_high": 84,
    "queue_overdue_critical": 90,
    "queue_overdue_warning": 100,
}

SUPERVISOR_ATTENTION_TYPES: frozenset[str] = frozenset(
    {
        "escalation_critical",
        "escalation_amendment",
        "escalation_retry_limit",
        "escalation_recollection_limit",
        "supervisor_approval",
        "supervisor_recollection_request",
    }
)

PRIORITY_ATTENTION_TYPES: frozenset[str] = frozenset(
    {
        "priority_urgent",
        "priority_high",
    }
)

# ── Presentation maps ───────────────────────────────────────────────────

TERMINAL_TEST_STATUSES: frozenset[str] = frozenset(
    {
        "validated",
        "cancelled",
        "superseded",
        "removed",
    }
)

ORDER_STATUS_TO_PRIMARY: dict[str, str] = {
    "ordered": "pending",
    "running": "in_progress",
    "completed": "completed",
    "cancelled": "cancelled",
}

TEST_STATUS_TO_PRIMARY: dict[str, str] = {
    "pending": "pending",
    "sample-collected": "in_progress",
    "resulted": "in_progress",
    "validated": "completed",
    "cancelled": "cancelled",
    "escalated": "escalated",
    "superseded": "superseded",
    "removed": "removed",
}

SAMPLE_STATUS_TO_PRIMARY: dict[str, str] = {
    "pending": "pending",
    "collected": "in_progress",
    "rejected": "rejected",
}

BLOCKED_OVERLAY_TEST_EXCLUDE_TERMINAL: bool = True
BLOCKED_OVERLAY_SAMPLE_WHEN_STATUS: str = "pending"

TEST_ESCALATED_SECONDARY_FROM_ATTENTION: bool = True

# ── Reporting inactive test statuses ────────────────────────────────────

INACTIVE_TEST_STATUSES_FOR_REPORTS: frozenset[str] = frozenset(
    {
        "removed",
        "superseded",
    }
)

INACTIVE_TEST_STATUSES_FOR_ROLLUP: frozenset[str] = frozenset(
    {
        "removed",
        "superseded",
        "cancelled",
    }
)

# ── Priority sort helpers ───────────────────────────────────────────────

PRIORITY_RANK: dict[str, int] = {
    "urgent": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
}

PRIORITY_WEIGHT: dict[str, int] = {
    "urgent": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}

# ── Quality workflow (remedy policy) ───────────────────────────────────

VALIDATION_REMEDIES: tuple[str, ...] = (
    "retry_same_sample",
    "request_recollection",
    "cancel",
)

SAMPLE_UNFINISHED_REMEDIES: tuple[str, ...] = (
    "request_recollection",
    "cancel",
)

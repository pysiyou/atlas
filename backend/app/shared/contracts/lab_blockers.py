"""
Lab blocker vocabulary — GENERATED from contracts/lab-blockers.json. DO NOT EDIT.
"""
from __future__ import annotations

BLOCKED_REASON_KEYS: frozenset[str] = frozenset(
    {
        "payment_unpaid",
        "specimen_recollection",
        "sample_rejected",
        "retest_pending",
        "critical_value",
        "amendment_pending",
        "retry_limit",
        "recollection_limit",
        "supervisor_review",
        "recollection_approval",
    }
)

BLOCKED_LABELS: dict[str, str] = {
    "payment_unpaid": "Payment required",
    "specimen_recollection": "Recollection required",
    "sample_rejected": "Sample rejected",
    "retest_pending": "Re-test in progress",
    "critical_value": "Critical value — supervisor review",
    "amendment_pending": "Amendment pending",
    "retry_limit": "Re-test limit reached",
    "recollection_limit": "Recollection limit reached",
    "supervisor_review": "Supervisor approval required",
    "recollection_approval": "Recollection awaiting supervisor approval",
}

BLOCKED_ATTENTION_TYPE: dict[str, str] = {
    "payment_unpaid": "payment_blocked",
    "specimen_recollection": "recollection_waiting",
    "sample_rejected": "sample_rejected",
    "retest_pending": "retest_in_progress",
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
    "recollection_waiting": 70,
    "retest_in_progress": 80,
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

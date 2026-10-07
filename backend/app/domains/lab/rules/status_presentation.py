"""
Map stored entity status + lab blockers to canonical presentation for UI.
"""
from __future__ import annotations

from app.shared.contracts.enums import OrderStatus, SampleStatus, TestStatus
from app.shared.contracts.lab_blockers import BLOCKED_LABELS
from app.shared.contracts.status_presentation_contract import (
    BADGE_VARIANTS,
    TERMINAL_TEST_STATUSES,
)
from app.shared.schemas.status_presentation import StatusPresentation


def _variant(primary: str) -> str:
    return BADGE_VARIANTS.get(primary, "neutral")


def _label_for_reason(reason: str | None) -> str | None:
    if not reason:
        return None
    return BLOCKED_LABELS.get(reason)


def _test_status_value(status: TestStatus | str) -> str:
    if hasattr(status, "value"):
        return status.value
    return str(status)


def _test_lifecycle_primary(status: str) -> str:
    if status == TestStatus.PENDING.value:
        return "pending"
    if status in (TestStatus.SAMPLE_COLLECTED.value, TestStatus.RESULTED.value):
        return "in_progress"
    if status == TestStatus.VALIDATED.value:
        return "completed"
    if status == TestStatus.CANCELLED.value:
        return "cancelled"
    if status == TestStatus.ESCALATED.value:
        return "escalated"
    if status == TestStatus.SUPERSEDED.value:
        return "superseded"
    if status == TestStatus.REMOVED.value:
        return "removed"
    return "pending"


def resolve_test_presentation(
    *,
    status: TestStatus | str,
    blocked_reason: str | None = None,
    blocked_label: str | None = None,
) -> StatusPresentation:
    """Presentation for an order test row."""
    status_str = _test_status_value(status)
    secondary_label = blocked_label or _label_for_reason(blocked_reason)

    if status_str not in TERMINAL_TEST_STATUSES and blocked_reason:
        return StatusPresentation(
            primary="blocked",
            secondary=secondary_label,
            variant=_variant("blocked"),
        )

    primary = _test_lifecycle_primary(status_str)
    secondary: str | None = None
    if status_str == TestStatus.ESCALATED.value and secondary_label:
        secondary = secondary_label

    return StatusPresentation(primary=primary, secondary=secondary, variant=_variant(primary))


def resolve_sample_presentation(
    *,
    status: SampleStatus | str,
    blocked_reason: str | None = None,
    blocked_label: str | None = None,
    rejection_secondary: str | None = None,
) -> StatusPresentation:
    """Presentation for a sample (collection queue)."""
    status_str = status.value if hasattr(status, "value") else str(status)
    secondary_label = blocked_label or _label_for_reason(blocked_reason)

    if status_str == SampleStatus.PENDING.value and blocked_reason:
        return StatusPresentation(
            primary="blocked",
            secondary=secondary_label,
            variant=_variant("blocked"),
        )

    if status_str == SampleStatus.PENDING.value:
        return StatusPresentation(primary="pending", secondary=None, variant=_variant("pending"))
    if status_str == SampleStatus.COLLECTED.value:
        return StatusPresentation(
            primary="in_progress", secondary=None, variant=_variant("in_progress")
        )
    if status_str == SampleStatus.REJECTED.value:
        return StatusPresentation(
            primary="rejected",
            secondary=rejection_secondary,
            variant=_variant("rejected"),
        )

    return StatusPresentation(primary="pending", secondary=None, variant=_variant("pending"))


def resolve_order_presentation(overall_status: OrderStatus | str) -> StatusPresentation:
    """Presentation for order rollup status."""
    status_str = overall_status.value if hasattr(overall_status, "value") else str(overall_status)
    if status_str == OrderStatus.ORDERED.value:
        primary = "pending"
    elif status_str == OrderStatus.RUNNING.value:
        primary = "in_progress"
    elif status_str == OrderStatus.COMPLETED.value:
        primary = "completed"
    elif status_str == OrderStatus.CANCELLED.value:
        primary = "cancelled"
    else:
        primary = "pending"

    return StatusPresentation(primary=primary, secondary=None, variant=_variant(primary))

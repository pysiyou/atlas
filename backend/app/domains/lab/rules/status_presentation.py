"""
Map stored entity status + lab attention reasons to canonical presentation for UI.
"""
from __future__ import annotations

from app.shared.contracts.enums import (
    PRESENTATION_PRIMARY_BADGE_VARIANTS,
    PresentationPrimary,
)
from app.shared.contracts.lab_contract import (
    ATTENTION_LABELS,
    ORDER_STATUS_TO_PRIMARY,
    SAMPLE_STATUS_TO_PRIMARY,
    TERMINAL_TEST_STATUSES,
    TEST_STATUS_TO_PRIMARY,
    reason_blocks_progress,
)
from app.shared.schemas.status_presentation import StatusPresentation


def _variant(primary: str) -> str:
    return PRESENTATION_PRIMARY_BADGE_VARIANTS.get(primary, "neutral")


def _label_for_reason(reason: str | None) -> str | None:
    if not reason:
        return None
    return ATTENTION_LABELS.get(reason)


def _test_status_value(status) -> str:
    if hasattr(status, "value"):
        return status.value
    return str(status)


def _primary_for_status(status_str: str, mapping: dict[str, str]) -> str:
    return mapping.get(status_str, PresentationPrimary.PENDING.value)


def resolve_test_presentation(
    *,
    status,
    attention_reason: str | None = None,
    attention_label: str | None = None,
) -> StatusPresentation:
    """Presentation for an order test row."""
    status_str = _test_status_value(status)
    secondary_label = attention_label or _label_for_reason(attention_reason)

    if (
        status_str not in TERMINAL_TEST_STATUSES
        and attention_reason
        and reason_blocks_progress(attention_reason)
    ):
        blocked = PresentationPrimary.BLOCKED.value
        return StatusPresentation(
            primary=blocked,
            secondary=secondary_label,
            variant=_variant(blocked),
        )

    primary = _primary_for_status(status_str, TEST_STATUS_TO_PRIMARY)
    secondary: str | None = None
    if status_str == "escalated" and secondary_label:
        secondary = secondary_label

    return StatusPresentation(primary=primary, secondary=secondary, variant=_variant(primary))


def resolve_sample_presentation(
    *,
    status,
    attention_reason: str | None = None,
    attention_label: str | None = None,
    rejection_secondary: str | None = None,
) -> StatusPresentation:
    """Presentation for a sample (collection queue)."""
    status_str = status.value if hasattr(status, "value") else str(status)
    secondary_label = attention_label or _label_for_reason(attention_reason)

    if status_str == "pending" and attention_reason and reason_blocks_progress(attention_reason):
        blocked = PresentationPrimary.BLOCKED.value
        return StatusPresentation(
            primary=blocked,
            secondary=secondary_label,
            variant=_variant(blocked),
        )

    primary = _primary_for_status(status_str, SAMPLE_STATUS_TO_PRIMARY)
    secondary = rejection_secondary if primary == PresentationPrimary.REJECTED.value else None

    return StatusPresentation(primary=primary, secondary=secondary, variant=_variant(primary))


def resolve_order_presentation(overall_status) -> StatusPresentation:
    """Presentation for order rollup status."""
    status_str = overall_status.value if hasattr(overall_status, "value") else str(overall_status)
    primary = _primary_for_status(status_str, ORDER_STATUS_TO_PRIMARY)
    return StatusPresentation(primary=primary, secondary=None, variant=_variant(primary))

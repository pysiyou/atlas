"""
Detect specimen-related rejection reasons from catalog strings or slug enums.
"""
from app.schemas.enums import RejectionReason

# Slug enums used internally for routing.
SPECIMEN_CRITERIA = frozenset({
    RejectionReason.HEMOLYZED.value,
    RejectionReason.CLOTTED.value,
    RejectionReason.QNS.value,
    RejectionReason.WRONG_CONTAINER.value,
    RejectionReason.LABELING_ERROR.value,
    RejectionReason.TRANSPORT_DELAY.value,
    RejectionReason.CONTAMINATED.value,
    RejectionReason.LIPEMIC.value,
    RejectionReason.ICTERIC.value,
})

# Catalog rejection strings map to specimen slugs via keyword matching.
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


def is_specimen_rejection_reason(reason: str) -> bool:
    """Return True when a catalog string or slug indicates a specimen problem."""
    if reason in SPECIMEN_CRITERIA:
        return True

    lower = reason.lower()
    return any(
        any(keyword in lower for keyword in keywords)
        for keywords in _SPECIMEN_KEYWORDS.values()
    )

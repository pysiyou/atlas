"""Event log kinds → event_type SQL LIKE prefixes.

Kinds are the six eventType roots (patient, order, laboratory, billing,
reporting, system). Laboratory subdomains are row labels, not query keys.
"""
from __future__ import annotations

_KIND_KEYS = frozenset(
    {
        "patient",
        "order",
        "laboratory",
        "billing",
        "reporting",
        "system",
    }
)

# Read-only events hidden on stream/patient unless includeAccess=true.
ACCESS_EVENT_TYPES = frozenset({"patient.view", "reporting.download"})


def parse_kinds_param(raw: str | None) -> list[str]:
    """Split comma-separated kind keys from a single query param."""
    if not raw or not raw.strip():
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]


def kind_to_event_type_prefix(kind: str) -> str | None:
    """Return a dot-terminated prefix for event_type LIKE matching (caller adds '%')."""
    if kind in _KIND_KEYS:
        return f"{kind}."
    return None


def kinds_to_prefixes(kinds: list[str]) -> list[str]:
    """Map kind keys to unique event_type prefixes; unknown keys are skipped."""
    seen: set[str] = set()
    out: list[str] = []
    for key in kinds:
        prefix = kind_to_event_type_prefix(key)
        if prefix is None or prefix in seen:
            continue
        seen.add(prefix)
        out.append(prefix)
    return out

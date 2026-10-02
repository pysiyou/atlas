"""Event log kinds → event_type SQL LIKE prefixes.

Kinds are the six eventType roots (patient, order, laboratory, billing,
reporting, system) plus optional laboratory subcategory keys
(``laboratory:sample``, Quality, Analyzer, …).
"""
from __future__ import annotations

from app.shared.contracts.enums import UserRole

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

# Nested laboratory filter tree → event_type LIKE prefixes (caller adds '%').
_LABORATORY_SUBKIND_PREFIXES: dict[str, str] = {
    "laboratory:sample": "laboratory.sample.",
    "laboratory:result": "laboratory.result.",
    "laboratory:validation": "laboratory.validation.",
    "laboratory:escalation": "laboratory.escalation.",
    "laboratory:quality": "laboratory.quality.",
    "laboratory:analyzer": "laboratory.analyzer.",
}

# Read-only events hidden on stream/patient unless includeAccess=true.
ACCESS_EVENT_TYPES = frozenset({"patient.view", "reporting.download"})

# Stored containment lens derived from eventType (not the query `scope` param).
STORED_EVENT_SCOPES = frozenset({"order", "lab", "patient", "system"})


def stored_event_scope_for_type(event_type: str) -> str:
    """Map an eventType string to the stored event_scope column value."""
    if event_type.startswith("patient."):
        return "patient"
    if event_type.startswith("system."):
        return "system"
    if event_type.startswith("laboratory."):
        return "lab"
    return "order"


def parse_kinds_param(raw: str | None) -> list[str]:
    """Split comma-separated kind keys from a single query param."""
    if not raw or not raw.strip():
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]


_VALID_ACTOR_ROLE_VALUES = frozenset(role.value for role in UserRole)


def parse_actor_roles_param(raw: str | None) -> list[str]:
    """Split comma-separated UserRole values from actorRoles query param."""
    return parse_kinds_param(raw)


def validate_actor_roles(roles: list[str]) -> None:
    """Raise ValueError when any role is not a known UserRole value."""
    invalid = [role for role in roles if role not in _VALID_ACTOR_ROLE_VALUES]
    if invalid:
        raise ValueError(f"Unknown actor role(s): {', '.join(invalid)}")


def kind_to_event_type_prefix(kind: str) -> str | None:
    """Return a dot-terminated prefix for event_type LIKE matching (caller adds '%')."""
    if kind in _KIND_KEYS:
        return f"{kind}."
    if kind in _LABORATORY_SUBKIND_PREFIXES:
        return _LABORATORY_SUBKIND_PREFIXES[kind]
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

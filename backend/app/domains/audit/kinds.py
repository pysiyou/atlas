"""Event log kinds → event_type SQL LIKE prefixes.

Kinds are domain roots plus laboratory subcategory keys (see contracts/audit-events.json query).
"""
from __future__ import annotations

from app.shared.contracts.audit_taxonomy import (
    ACCESS_EVENT_TYPES,
    DEFAULT_STORED_EVENT_SCOPE,
    DOMAIN_KIND_IDS,
    LABORATORY_SUBKIND_PREFIXES,
    STORED_EVENT_SCOPES,
    STORED_SCOPE_BY_PREFIX,
)
from app.shared.contracts.enums import UserRole

__all__ = [
    "ACCESS_EVENT_TYPES",
    "STORED_EVENT_SCOPES",
    "parse_kinds_param",
    "parse_actor_roles_param",
    "validate_actor_roles",
    "kind_to_event_type_prefix",
    "kinds_to_prefixes",
    "stored_event_scope_for_type",
]


def stored_event_scope_for_type(event_type: str) -> str:
    """Map an eventType string to the stored event_scope column value."""
    for prefix, scope in STORED_SCOPE_BY_PREFIX:
        if event_type.startswith(prefix):
            return scope
    return DEFAULT_STORED_EVENT_SCOPE


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
    if kind in DOMAIN_KIND_IDS:
        return f"{kind}."
    if kind in LABORATORY_SUBKIND_PREFIXES:
        return LABORATORY_SUBKIND_PREFIXES[kind]
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

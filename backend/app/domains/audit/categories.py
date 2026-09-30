"""Event log category keys → event_type SQL LIKE prefixes."""
from __future__ import annotations

# Keys match frontend EventLogCategoryKey
_DOMAIN_KEYS = frozenset(
    {
        "patient",
        "order",
        "laboratory",
        "billing",
        "reporting",
        "system",
    }
)

_LAB_SUBDOMAIN_KEYS = frozenset(
    {
        "sample",
        "result",
        "validation",
        "escalation",
        "quality",
        "analyzer",
    }
)


def parse_categories_param(raw: str | None) -> list[str]:
    """Split comma-separated category keys from a single query param."""
    if not raw or not raw.strip():
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]


def category_to_event_type_prefix(category: str) -> str | None:
    """
    Return a dot-terminated prefix for event_type LIKE matching (caller adds '%').
    e.g. 'patient' → 'patient.' ; 'laboratory:sample' → 'laboratory.sample.'
    """
    if category in _DOMAIN_KEYS:
        return f"{category}."
    if ":" in category:
        domain, subdomain = category.split(":", 1)
        if domain == "laboratory" and subdomain in _LAB_SUBDOMAIN_KEYS:
            return f"laboratory.{subdomain}."
    return None


def categories_to_prefixes(categories: list[str]) -> list[str]:
    """Map category keys to unique event_type prefixes; unknown keys are skipped."""
    seen: set[str] = set()
    out: list[str] = []
    for key in categories:
        prefix = category_to_event_type_prefix(key)
        if prefix is None or prefix in seen:
            continue
        seen.add(prefix)
        out.append(prefix)
    return out

"""
Audit event log query taxonomy — GENERATED from contracts/audit-events.json. DO NOT EDIT.
"""
from __future__ import annotations

DOMAIN_KIND_IDS: frozenset[str] = frozenset(
    {
        "patient",
        "order",
        "laboratory",
        "billing",
        "reporting",
        "system",
    }
)

LABORATORY_SUBKIND_PREFIXES: dict[str, str] = {
    "laboratory:sample": "laboratory.sample.",
    "laboratory:result": "laboratory.result.",
    "laboratory:validation": "laboratory.validation.",
    "laboratory:escalation": "laboratory.escalation.",
    "laboratory:quality": "laboratory.quality.",
    "laboratory:analyzer": "laboratory.analyzer.",
}

ACCESS_EVENT_TYPES: frozenset[str] = frozenset(
    {
        "patient.view",
        "reporting.download",
    }
)

STORED_EVENT_SCOPES: frozenset[str] = frozenset(
    {
        "order",
        "lab",
        "patient",
        "system",
    }
)

STORED_SCOPE_BY_PREFIX: tuple[tuple[str, str], ...] = (
    ("patient.", "patient"),
    ("system.", "system"),
    ("laboratory.", "lab"),
)

DEFAULT_STORED_EVENT_SCOPE: str = "order"

ALL_KIND_IDS: frozenset[str] = frozenset(
    {
        "patient",
        "order",
        "laboratory",
        "billing",
        "reporting",
        "system",
        "laboratory:sample",
        "laboratory:result",
        "laboratory:validation",
        "laboratory:escalation",
        "laboratory:quality",
        "laboratory:analyzer",
    }
)

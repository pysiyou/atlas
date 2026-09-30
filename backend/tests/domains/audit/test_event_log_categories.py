"""Unit tests for audit event log category → event_type prefix mapping."""
from app.domains.audit.categories import (
    categories_to_prefixes,
    category_to_event_type_prefix,
    parse_categories_param,
)


def test_category_to_prefix_domain() -> None:
    assert category_to_event_type_prefix("patient") == "patient."
    assert category_to_event_type_prefix("laboratory") == "laboratory."


def test_category_to_prefix_lab_subdomain() -> None:
    assert category_to_event_type_prefix("laboratory:sample") == "laboratory.sample."
    assert category_to_event_type_prefix("laboratory:analyzer") == "laboratory.analyzer."


def test_category_to_prefix_invalid() -> None:
    assert category_to_event_type_prefix("unknown") is None
    assert category_to_event_type_prefix("laboratory:invalid") is None


def test_parse_categories_param() -> None:
    assert parse_categories_param(None) == []
    assert parse_categories_param("patient, order ,laboratory:result") == [
        "patient",
        "order",
        "laboratory:result",
    ]


def test_categories_to_prefixes_dedupes() -> None:
    prefixes = categories_to_prefixes(["patient", "patient", "order"])
    assert prefixes == ["patient.", "order."]

"""Unit tests for slim catalog list and by-codes helpers (stdlib unittest)."""
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest import TestCase

from fastapi import HTTPException

from app.domains.catalog.api.tests import parse_by_codes_param
from app.domains.catalog.test_catalog_service import (
    BY_CODES_MAX,
    order_found_tests,
    serialize_test,
    serialize_test_summary,
)


def _catalog_row(**overrides: object) -> SimpleNamespace:
    now = datetime(2026, 1, 1, tzinfo=UTC)
    values = {
        "code": "CBC",
        "name": "Complete Blood Count",
        "displayName": "CBC",
        "category": "hematology",
        "price": 10.0,
        "turnaroundTimeHours": 4,
        "sampleType": "blood",
        "containerTypes": ["tube"],
        "containerTopColors": ["lavender"],
        "isActive": True,
        "synonyms": ["hemogram"],
        "panels": ["CBC"],
        "loincCodes": ["58410-2"],
        "fastingRequired": False,
        "createdAt": now,
        "updatedAt": now,
        "resultItems": [{"item_code": "WBC", "item_name": "WBC", "value_type": "NUMERIC", "unit": ""}],
        "referenceRanges": [],
        "methodology": "impedance",
        "notes": "secret",
        "sampleVolume": "3ml",
        "rejectionCriteria": None,
        "validationRejectionCriteria": None,
        "collectionNotes": None,
        "specialRequirements": None,
        "minimumVolume": None,
        "optimalVolume": None,
        "numberOfContainers": None,
        "containerDescription": None,
        "confidence": None,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class CatalogListSerializeTest(TestCase):
    def test_summary_omits_result_items_and_keeps_search_fields(self) -> None:
        payload = serialize_test_summary(_catalog_row())
        self.assertNotIn("resultItems", payload)
        self.assertNotIn("referenceRanges", payload)
        self.assertNotIn("methodology", payload)
        self.assertNotIn("notes", payload)
        self.assertNotIn("sampleVolume", payload)
        self.assertEqual(payload["code"], "CBC")
        self.assertEqual(payload["synonyms"], ["hemogram"])
        self.assertEqual(payload["loincCodes"], ["58410-2"])
        self.assertEqual(payload["panels"], ["CBC"])

    def test_full_serialize_keeps_result_items(self) -> None:
        payload = serialize_test(_catalog_row())
        self.assertIsNotNone(payload.get("resultItems"))
        self.assertEqual(payload["resultItems"][0]["item_code"], "WBC")


class CatalogByCodesTest(TestCase):
    def test_order_found_tests_preserves_request_order_and_skips_missing(self) -> None:
        cbc = _catalog_row(code="CBC")
        cmp = _catalog_row(code="CMP")
        ordered = order_found_tests([cmp, cbc], ["CBC", "MISSING", "CMP"])
        self.assertEqual([row.code for row in ordered], ["CBC", "CMP"])

    def test_parse_by_codes_rejects_empty(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            parse_by_codes_param("")
        self.assertEqual(raised.exception.status_code, 400)

    def test_parse_by_codes_rejects_over_cap(self) -> None:
        raw = ",".join(f"T{i}" for i in range(BY_CODES_MAX + 1))
        with self.assertRaises(HTTPException) as raised:
            parse_by_codes_param(raw)
        self.assertEqual(raised.exception.status_code, 400)

    def test_parse_by_codes_dedupes_preserving_order(self) -> None:
        self.assertEqual(parse_by_codes_param("CBC, CMP, CBC"), ["CBC", "CMP"])


if __name__ == "__main__":
    from unittest import main

    main()

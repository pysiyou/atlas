"""CatalogTest catalog business logic."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.catalog.schemas.test import (
    TestResponse,
    TestSummaryResponse,
)
from app.platform.cache import (
    CacheKeys,
    cache_get,
    cache_set,
    generate_cache_key,
    invalidate_tests_cache,
)
from app.platform.config import settings
from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

logger = logging.getLogger(__name__)

BY_CODES_MAX = 100


def _repo_root() -> Path:
    """Atlas repo root (parent of backend/)."""
    return Path(__file__).resolve().parents[4]


def _loinc_code_from_item(item: dict[str, Any]) -> str | None:
    """Return a trimmed observation LOINC from a contract result item, if present."""
    raw = item.get("loinc_code")
    if not isinstance(raw, str):
        return None
    code = raw.strip()
    return code or None


def _normalize_loinc_list(value: object) -> list[str]:
    """Keep first-seen non-empty LOINC strings."""
    if not isinstance(value, list):
        return []
    unique: list[str] = []
    seen: set[str] = set()
    for raw in value:
        if not isinstance(raw, str):
            continue
        code = raw.strip()
        if not code or code in seen:
            continue
        seen.add(code)
        unique.append(code)
    return unique


def _merge_result_item_loinc(
    current_items: list[Any], loinc_by_item_code: dict[str, str]
) -> tuple[list[Any], bool]:
    """Copy observation LOINC onto matching result items without replacing other fields."""
    if not current_items or not loinc_by_item_code:
        return current_items, False
    merged: list[Any] = []
    changed = False
    for item in current_items:
        if not isinstance(item, dict):
            merged.append(item)
            continue
        item_code = item.get("item_code")
        loinc = loinc_by_item_code.get(item_code) if isinstance(item_code, str) else None
        if loinc and item.get("loinc_code") != loinc:
            merged.append({**item, "loinc_code": loinc})
            changed = True
        else:
            merged.append(item)
    return merged, changed


def serialize_test(test: CatalogTest) -> dict:
    return TestResponse.model_validate(test).model_dump(mode="json")


def serialize_test_summary(test: CatalogTest) -> dict:
    return TestSummaryResponse.model_validate(test).model_dump(mode="json")


def order_found_tests(found: list[CatalogTest], codes: list[str]) -> list[CatalogTest]:
    """Return found tests in request order, skipping codes that are not in the catalog."""
    by_code = {test.code: test for test in found}
    return [by_code[code] for code in codes if code in by_code]


class TestCatalogService:
    def __init__(self, db: Session):
        self.db = db

    def list_tests(
        self,
        response: Response,
        category: str | None = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 10000,
    ) -> list[dict]:
        response.headers["Cache-Control"] = "private, no-store"
        cache_key = generate_cache_key(
            CacheKeys.TESTS_CATALOG,
            shape="summary",
            category=category,
            activeOnly=active_only,
            skip=skip,
            limit=limit,
        )
        cached_data = cache_get(cache_key)
        if cached_data is not None:
            return cached_data

        query = self.db.query(CatalogTest)
        if active_only:
            query = query.filter(CatalogTest.isActive.is_(True))
        if category:
            query = query.filter(CatalogTest.category == category)
        tests = query.order_by(CatalogTest.updatedAt.desc()).offset(skip).limit(limit).all()
        result = [serialize_test_summary(t) for t in tests]
        cache_set(cache_key, result, settings.CACHE_TTL_STATIC)
        return result

    def list_tests_by_codes(self, codes: list[str]) -> list[dict]:
        """Full TestResponse rows for the given codes. Does not filter activeOnly."""
        if not codes:
            return []
        found = self.db.query(CatalogTest).filter(CatalogTest.code.in_(codes)).all()
        return [serialize_test(test) for test in order_found_tests(found, codes)]

    def get_by_code(self, test_code: str) -> CatalogTest:
        test = self.db.query(CatalogTest).filter(CatalogTest.code == test_code).first()
        if not test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"CatalogTest {test_code} not found",
            )
        return test

    def sync_parameter_loinc_from_contract(self) -> int:
        """
        Copy observation LOINC from test-catalog.json onto DB result items.

        Rows are keyed by sequential lab codes (CHEM001); contract tests use
        clinical mnemonics (GLU). Match on result ``item_code``, which is unique.
        """
        catalog_path = _repo_root() / "contracts" / "catalog" / "test-catalog.json"
        if not catalog_path.is_file():
            return 0

        payload = json.loads(catalog_path.read_text(encoding="utf-8"))
        loinc_by_item_code: dict[str, str] = {}
        loinc_list_by_item_set: dict[frozenset[str], list[str]] = {}
        for entry in payload.get("tests") or []:
            if not isinstance(entry, dict):
                continue
            item_codes: list[str] = []
            for item in entry.get("result_items") or []:
                if not isinstance(item, dict):
                    continue
                item_code = item.get("item_code")
                loinc = _loinc_code_from_item(item)
                if not isinstance(item_code, str) or not item_code.strip() or not loinc:
                    continue
                loinc_by_item_code[item_code] = loinc
                item_codes.append(item_code)
            if item_codes:
                loinc_list_by_item_set[frozenset(item_codes)] = _normalize_loinc_list(
                    entry.get("loinc_codes")
                ) or [loinc_by_item_code[code] for code in item_codes]

        if not loinc_by_item_code:
            return 0

        updated = 0
        for row in self.db.query(CatalogTest).all():
            current_items = row.resultItems if isinstance(row.resultItems, list) else []
            merged_items, items_changed = _merge_result_item_loinc(
                current_items, loinc_by_item_code
            )
            row_item_codes = [
                item.get("item_code")
                for item in merged_items
                if isinstance(item, dict) and isinstance(item.get("item_code"), str)
            ]
            desired_codes = loinc_list_by_item_set.get(frozenset(row_item_codes))
            if desired_codes is None:
                desired_codes = [
                    loinc_by_item_code[code]
                    for code in row_item_codes
                    if code in loinc_by_item_code
                ]
            changed = items_changed
            if items_changed:
                row.resultItems = merged_items
                flag_modified(row, "resultItems")
            current_codes = _normalize_loinc_list(row.loincCodes)
            if desired_codes and current_codes != desired_codes:
                row.loincCodes = desired_codes
                changed = True
            if changed:
                updated += 1

        if updated:
            self.db.commit()
            invalidate_tests_cache()
            logger.info("Synced parameter LOINC onto %s catalog tests from contract", updated)
        return updated

    def search(self, q: str, limit: int = 50) -> list[CatalogTest]:
        search_term = f"%{q.lower()}%"
        return (
            self.db.query(CatalogTest)
            .filter(
                (CatalogTest.name.ilike(search_term))
                | (CatalogTest.displayName.ilike(search_term))
                | (CatalogTest.code.ilike(search_term))
            )
            .order_by(CatalogTest.updatedAt.desc())
            .limit(limit)
            .all()
        )

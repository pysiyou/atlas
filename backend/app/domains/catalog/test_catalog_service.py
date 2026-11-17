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
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

logger = logging.getLogger(__name__)

BY_CODES_MAX = 100


def _repo_root() -> Path:
    """Atlas repo root (parent of backend/)."""
    return Path(__file__).resolve().parents[4]


def _loinc_code_from_value(value: object) -> str | None:
    """Return a trimmed LOINC string, or None when missing/blank."""
    if not isinstance(value, str):
        return None
    code = value.strip()
    return code or None


def _loinc_code_from_item(item: dict[str, Any]) -> str | None:
    """Return a trimmed observation LOINC from a contract result item, if present."""
    return _loinc_code_from_value(item.get("loinc_code"))


def _singleton_legacy_loinc(value: object) -> str | None:
    """
    Pull a single LOINC out of the legacy ``loinc_codes`` JSON column.

    Only a one-element array (or an already-scalar string) is copied; multi-item
    batteries stay empty until the contract sync writes ``None``.
    """
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith("["):
            try:
                parsed = json.loads(stripped)
            except json.JSONDecodeError:
                return None
            return _singleton_legacy_loinc(parsed)
        return _loinc_code_from_value(stripped)
    if isinstance(value, list) and len(value) == 1:
        return _loinc_code_from_value(value[0])
    return None


def ensure_loinc_code_column(db: Session) -> None:
    """
    Add ``tests.loinc_code`` when missing and copy singleton legacy arrays.

    ``create_all`` does not rename the existing JSON ``loinc_codes`` column.
    Leave that column in place so a failed deploy cannot wipe data.
    """
    bind = db.get_bind()
    inspector = inspect(bind)
    if "tests" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("tests")}
    if "loinc_code" not in columns:
        db.execute(text("ALTER TABLE tests ADD COLUMN loinc_code VARCHAR"))
        db.commit()
        inspector = inspect(bind)
        columns = {col["name"] for col in inspector.get_columns("tests")}
    if "loinc_codes" not in columns:
        return
    rows = db.execute(
        text("SELECT code, loinc_codes FROM tests WHERE loinc_code IS NULL")
    ).fetchall()
    copied = 0
    for code, legacy in rows:
        singleton = _singleton_legacy_loinc(legacy)
        if not singleton:
            continue
        db.execute(
            text("UPDATE tests SET loinc_code = :loinc WHERE code = :code"),
            {"loinc": singleton, "code": code},
        )
        copied += 1
    if copied:
        db.commit()
        logger.info("Copied %s singleton loinc_codes arrays onto tests.loinc_code", copied)


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
        Copy observation LOINC from test-catalog.json onto DB rows.

        Rows are keyed by sequential lab codes (CHEM001); contract tests use
        clinical mnemonics (GLU). Match on result ``item_code``, which is unique.
        Test-level ``loinc_code`` is a single string (or None for multi-parameter tests).
        """
        ensure_loinc_code_column(self.db)
        catalog_path = _repo_root() / "contracts" / "catalog" / "test-catalog.json"
        if not catalog_path.is_file():
            return 0

        payload = json.loads(catalog_path.read_text(encoding="utf-8"))
        loinc_by_item_code: dict[str, str] = {}
        loinc_by_item_set: dict[frozenset[str], str | None] = {}
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
                loinc_by_item_set[frozenset(item_codes)] = _loinc_code_from_value(
                    entry.get("loinc_code")
                )

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
            item_key = frozenset(row_item_codes)
            if item_key in loinc_by_item_set:
                desired_code = loinc_by_item_set[item_key]
            elif len(row_item_codes) == 1 and row_item_codes[0] in loinc_by_item_code:
                desired_code = loinc_by_item_code[row_item_codes[0]]
            else:
                desired_code = None
            changed = items_changed
            if items_changed:
                row.resultItems = merged_items
                flag_modified(row, "resultItems")
            current_code = _loinc_code_from_value(row.loincCode)
            if current_code != desired_code:
                row.loincCode = desired_code
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

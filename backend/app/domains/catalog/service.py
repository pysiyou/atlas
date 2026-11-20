"""Catalog business logic — contracts, orderable tests, workups, analytes, seed."""
from __future__ import annotations

import json
import logging
from collections import defaultdict
from pathlib import Path
from typing import Any

from app.domains.catalog.models import (
    AffiliationPricing,
    CatalogAnalyte,
    OrderableTest,
    OrderableTestAnalyte,
    Workup,
    WorkupTest,
)
from app.domains.catalog.schemas import (
    AffiliationPricingResponse,
    OrderableTestResponse,
    OrderableTestSummaryResponse,
    WorkupResponse,
)
from app.domains.catalog.seed import copy_test_fields, validation_rejection_criteria
from app.domains.lab.specimen.models import Sample
from app.domains.lab.specimen.volume import (
    aggregate_required_min_ml,
    aggregate_target_optimal_ml,
)
from app.shared.generated.enums import SampleStatus
from app.domains.orders.models import OrderTest
from app.platform.cache import CacheKeys, cache_get, cache_set, generate_cache_key
from app.platform.config import settings
from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session, selectinload

logger = logging.getLogger(__name__)

BY_CODES_MAX = 100

ANALYTE_IDENTITY_KEYS = frozenset({"analyte_code", "name", "loinc_code", "unit", "specimen"})


# ---------------------------------------------------------------------------
# Contract JSON (snake_case wire shape)
# ---------------------------------------------------------------------------


def _merge_validation_rejection(entry: dict[str, Any], rejection: list[Any] | None) -> None:
    if not rejection:
        return
    validation = entry.get("validation")
    if not isinstance(validation, dict):
        entry["validation"] = {"rejection_criteria": rejection}
        return
    validation.setdefault("rejection_criteria", rejection)


def analyte_wire_entry(row: CatalogAnalyte) -> dict[str, Any]:
    """Wire-shaped analyte row for API and HL7 (from ``analytes.json`` fields)."""
    entry: dict[str, Any] = dict(row.definition) if isinstance(row.definition, dict) else {}
    entry["analyte_code"] = row.code
    entry["name"] = row.name
    if row.loincCode is not None:
        entry["loinc_code"] = row.loincCode
    if row.unit is not None:
        entry["unit"] = row.unit
    if row.specimen is not None:
        entry["specimen"] = row.specimen
    _merge_validation_rejection(entry, row.validationRejectionCriteria)
    return entry


def analyte_definition_payload(row: CatalogAnalyte) -> dict[str, Any]:
    """Lab/HL7 payload with snake_case catalog keys."""
    entry = analyte_wire_entry(row)
    payload = {k: v for k, v in entry.items() if k not in ANALYTE_IDENTITY_KEYS}
    payload["analyte_code"] = row.code
    payload["name"] = row.name
    if row.loincCode is not None:
        payload["loinc_code"] = row.loincCode
    if row.unit is not None:
        payload["unit"] = row.unit
    if row.specimen is not None:
        payload["specimen"] = row.specimen
    return payload


def analyte_definitions_for_test(db: Session, test_code: str) -> list[dict[str, Any]]:
    """Analyte definition dicts for validation/HL7 (keys use ``analyte_code``)."""
    rows = (
        db.query(OrderableTestAnalyte, CatalogAnalyte)
        .join(CatalogAnalyte, CatalogAnalyte.code == OrderableTestAnalyte.analyteCode)
        .filter(OrderableTestAnalyte.testCode == test_code)
        .order_by(OrderableTestAnalyte.sortOrder.asc())
        .all()
    )
    return [analyte_definition_payload(analyte) for _link, analyte in rows]


def _workup_ids_by_test_code(db: Session) -> dict[str, list[str]]:
    rows = db.query(WorkupTest).all()
    grouped: dict[str, list[str]] = defaultdict(list)
    for link in rows:
        grouped[link.testCode].append(link.workupCode)
    return {code: sorted(ids) for code, ids in grouped.items()}


def _analyte_codes_for_test(test: OrderableTest) -> list[str]:
    return [
        link.analyteCode
        for link in sorted(test.analyteLinks or [], key=lambda row: row.sortOrder)
        if link.analyteCode
    ]


def _analyte_entries_for_test(test: OrderableTest) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for link in sorted(test.analyteLinks or [], key=lambda row: row.sortOrder):
        analyte = link.analyte
        if analyte is None:
            continue
        entries.append(analyte_wire_entry(analyte))
    return entries


def serialize_orderable_test(test: OrderableTest, *, workup_ids: list[str] | None = None) -> dict:
    payload = OrderableTestResponse.model_validate(test).model_dump(mode="json")
    payload["analytes"] = _analyte_entries_for_test(test)
    payload["workups"] = workup_ids or []
    return payload


def serialize_orderable_test_summary(test: OrderableTest, *, workup_ids: list[str] | None = None) -> dict:
    payload = OrderableTestSummaryResponse.model_validate(test).model_dump(mode="json")
    payload["workups"] = workup_ids or []
    return payload


# ---------------------------------------------------------------------------
# Orderable tests
# ---------------------------------------------------------------------------


class OrderableTestService:
    def __init__(self, db: Session):
        self.db = db

    def _query_full(self):
        return self.db.query(OrderableTest).options(
            selectinload(OrderableTest.analyteLinks).selectinload(OrderableTestAnalyte.analyte)
        )

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
        cached = cache_get(cache_key)
        if cached is not None:
            return cached

        query = self.db.query(OrderableTest)
        if active_only:
            query = query.filter(OrderableTest.isActive.is_(True))
        if category:
            query = query.filter(OrderableTest.category == category)
        rows = query.order_by(OrderableTest.updatedAt.desc()).offset(skip).limit(limit).all()
        workup_map = _workup_ids_by_test_code(self.db)
        result = [
            serialize_orderable_test_summary(t, workup_ids=workup_map.get(t.code, [])) for t in rows
        ]
        cache_set(cache_key, result, settings.CACHE_TTL_STATIC)
        return result

    def list_tests_by_codes(self, codes: list[str]) -> list[dict]:
        if not codes:
            return []
        found = self._query_full().filter(OrderableTest.code.in_(codes)).all()
        by_code = {row.code: row for row in found}
        ordered = [by_code[c] for c in codes if c in by_code]
        workup_map = _workup_ids_by_test_code(self.db)
        return [serialize_orderable_test(t, workup_ids=workup_map.get(t.code, [])) for t in ordered]

    def get_by_code(self, test_code: str) -> dict:
        row = self._query_full().filter(OrderableTest.code == test_code).first()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Orderable test {test_code} not found",
            )
        workup_map = _workup_ids_by_test_code(self.db)
        return serialize_orderable_test(row, workup_ids=workup_map.get(row.code, []))

    def search(self, q: str, limit: int = 50) -> list[dict]:
        term = f"%{q.lower()}%"
        rows = (
            self.db.query(OrderableTest)
            .filter(
                (OrderableTest.name.ilike(term))
                | (OrderableTest.displayName.ilike(term))
                | (OrderableTest.code.ilike(term))
            )
            .order_by(OrderableTest.updatedAt.desc())
            .limit(limit)
            .all()
        )
        return [serialize_orderable_test_summary(t) for t in rows]


# ---------------------------------------------------------------------------
# Catalog analytes (HL7 / analyzer resolution)
# ---------------------------------------------------------------------------


class CatalogAnalyteService:
    """Lookup analytes for an orderable test and map external codes to ``analyte_code``."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def analyte_rows_for_test(self, test_code: str) -> list[CatalogAnalyte]:
        return [
            analyte
            for _link, analyte in (
                self.db.query(OrderableTestAnalyte, CatalogAnalyte)
                .join(CatalogAnalyte, CatalogAnalyte.code == OrderableTestAnalyte.analyteCode)
                .filter(OrderableTestAnalyte.testCode == test_code)
                .order_by(OrderableTestAnalyte.sortOrder.asc())
                .all()
            )
        ]

    def expected_analyte_codes(self, test_code: str) -> set[str]:
        return {a.code for a in self.analyte_rows_for_test(test_code)}

    def _lookup_index(self, test_code: str) -> dict[str, str]:
        index: dict[str, str] = {}
        for analyte in self.analyte_rows_for_test(test_code):
            code = analyte.code
            for key in (code, code.upper(), code.lower()):
                index[key] = code
            loinc = (analyte.loincCode or "").strip()
            if loinc:
                for key in (loinc, loinc.upper(), loinc.lower()):
                    index[key] = code
        return index

    def resolve_to_analyte_code(
        self,
        test_code: str,
        observation_code: str,
        *,
        loinc_code: str | None = None,
    ) -> str | None:
        if not observation_code and not loinc_code:
            return None
        index = self._lookup_index(test_code)
        if loinc_code:
            loinc = loinc_code.strip()
            if loinc in index:
                return index[loinc]
        obs = (observation_code or "").strip()
        if not obs:
            return None
        if obs in index:
            return index[obs]
        return index.get(obs.upper()) or index.get(obs.lower())


# ---------------------------------------------------------------------------
# Clinical workups
# ---------------------------------------------------------------------------


class WorkupService:
    def __init__(self, db: Session):
        self.db = db

    def list_workups(self, *, active_only: bool = True) -> list[dict]:
        query = self.db.query(Workup).options(selectinload(Workup.testLinks))
        if active_only:
            query = query.filter(Workup.isActive.is_(True))
        rows = query.order_by(Workup.name.asc()).all()
        return [self._serialize(row) for row in rows]

    def _serialize(self, row: Workup) -> dict:
        test_codes = [link.testCode for link in sorted(row.testLinks or [], key=lambda link: link.testCode)]
        payload = WorkupResponse.model_validate(row).model_dump(mode="json")
        payload["testCodes"] = test_codes
        return payload


# ---------------------------------------------------------------------------
# Affiliation pricing
# ---------------------------------------------------------------------------


class AffiliationPricingService:
    def __init__(self, db: Session):
        self.db = db

    def list_pricing(self, response: Response) -> list[dict]:
        response.headers["Cache-Control"] = "private, no-store"
        cache_key = CacheKeys.AFFILIATIONS_PRICING
        cached_data = cache_get(cache_key)
        if cached_data is not None:
            return cached_data

        pricing_list = (
            self.db.query(AffiliationPricing)
            .filter(AffiliationPricing.isActive.is_(True))
            .order_by(AffiliationPricing.duration)
            .all()
        )
        result = [AffiliationPricingResponse.model_validate(p).model_dump() for p in pricing_list]
        cache_set(cache_key, result, settings.CACHE_TTL_STATIC)
        return result


# ---------------------------------------------------------------------------
# Seed from contract JSON
# ---------------------------------------------------------------------------


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _contracts_dir() -> Path:
    return _repo_root() / "contracts"


def _load_json(name: str) -> dict[str, Any]:
    path = _contracts_dir() / name
    return json.loads(path.read_text(encoding="utf-8"))


class CatalogSeedService:
    def __init__(self, db: Session):
        self.db = db

    def seed_from_contracts(self) -> dict[str, int]:
        analyte_doc = _load_json("analytes.json")
        orderable_tests_doc = _load_json("orderable-tests.json")
        workups_doc = _load_json("workups.json")

        counts = {"analytes": 0, "orderable_tests": 0, "workups": 0}

        desired_analyte_codes: set[str] = set()
        for raw in analyte_doc.get("analytes") or []:
            if not isinstance(raw, dict):
                continue
            code = raw.get("analyte_code")
            if not isinstance(code, str) or not code.strip():
                continue
            code = code.strip()
            desired_analyte_codes.add(code)
            definition = {
                k: v
                for k, v in raw.items()
                if k not in {"analyte_code", "name", "loinc_code", "unit", "specimen"}
            }
            payload = {
                "name": raw.get("name") or code,
                "loincCode": raw.get("loinc_code"),
                "unit": raw.get("unit"),
                "specimen": raw.get("specimen"),
                "definition": definition,
                "validationRejectionCriteria": validation_rejection_criteria(raw),
            }
            row = self.db.get(CatalogAnalyte, code)
            if row is None:
                self.db.add(CatalogAnalyte(code=code, **payload))
                counts["analytes"] += 1
            else:
                for key, val in payload.items():
                    setattr(row, key, val)
        self._delete_stale_rows(CatalogAnalyte, desired_analyte_codes)

        desired_test_codes: set[str] = set()
        for raw in orderable_tests_doc.get("tests") or []:
            if not isinstance(raw, dict) or not raw.get("test_code"):
                continue
            fields = copy_test_fields(raw)
            code = fields["code"]
            desired_test_codes.add(code)
            row = self.db.get(OrderableTest, code)
            if row is None:
                self.db.add(OrderableTest(**fields))
                counts["orderable_tests"] += 1
            else:
                for key, val in fields.items():
                    if key != "code":
                        setattr(row, key, val)
            self._replace_test_analytes(code, raw.get("analytes") or [])
        self._delete_stale_rows(OrderableTest, desired_test_codes)

        desired_workup_codes: set[str] = set()
        for raw in workups_doc.get("workups") or []:
            if not isinstance(raw, dict) or not raw.get("id"):
                continue
            code = str(raw["id"]).strip()
            desired_workup_codes.add(code)
            payload = {
                "name": raw.get("name") or code,
                "description": raw.get("description") or None,
                "isActive": True,
            }
            row = self.db.get(Workup, code)
            if row is None:
                self.db.add(Workup(code=code, **payload))
                counts["workups"] += 1
            else:
                for key, val in payload.items():
                    setattr(row, key, val)
            self._replace_workup_tests(code, raw.get("test_codes") or [])
        self._delete_stale_rows(Workup, desired_workup_codes)

        counts["pending_samples_volume_resync"] = self._resync_pending_sample_volumes()

        self.db.commit()
        logger.info("Catalog seed complete: %s", counts)
        return counts

    def _resync_pending_sample_volumes(self) -> int:
        """Refresh required/optimal volumes on pending samples from current catalog."""
        pending = (
            self.db.query(Sample)
            .filter(
                Sample.status == SampleStatus.PENDING,
                Sample.collectedAt.is_(None),
            )
            .all()
        )
        if not pending:
            return 0

        all_codes: set[str] = set()
        for sample in pending:
            for code in sample.testCodes or []:
                if isinstance(code, str) and code.strip():
                    all_codes.add(code.strip())

        tests_by_code: dict[str, OrderableTest] = {}
        if all_codes:
            for row in self.db.query(OrderableTest).filter(OrderableTest.code.in_(all_codes)).all():
                tests_by_code[row.code] = row

        updated = 0
        for sample in pending:
            codes = [c for c in (sample.testCodes or []) if isinstance(c, str) and c.strip()]
            if not codes:
                continue
            test_defs = [tests_by_code[c] for c in codes if c in tests_by_code]
            if not test_defs:
                continue
            required = aggregate_required_min_ml(test_defs)
            optimal = aggregate_target_optimal_ml(test_defs)
            prev_required = float(sample.requiredVolume or 0)
            prev_optimal = float(sample.optimalVolume or 0)
            if required == prev_required and optimal == prev_optimal:
                continue
            sample.requiredVolume = required
            sample.optimalVolume = optimal
            updated += 1
        return updated

    def _replace_test_analytes(self, test_code: str, analyte_codes: list[Any]) -> None:
        self.db.query(OrderableTestAnalyte).filter(OrderableTestAnalyte.testCode == test_code).delete(
            synchronize_session=False
        )
        for index, raw in enumerate(analyte_codes):
            if not isinstance(raw, str) or not raw.strip():
                continue
            self.db.add(
                OrderableTestAnalyte(
                    testCode=test_code,
                    analyteCode=raw.strip(),
                    sortOrder=index,
                )
            )

    def _replace_workup_tests(self, workup_code: str, test_codes: list[Any]) -> None:
        self.db.query(WorkupTest).filter(WorkupTest.workupCode == workup_code).delete(
            synchronize_session=False
        )
        for raw in test_codes:
            if not isinstance(raw, str) or not raw.strip():
                continue
            self.db.add(WorkupTest(workupCode=workup_code, testCode=raw.strip()))

    def _delete_stale_rows(self, model, desired_codes: set[str]) -> None:
        if not desired_codes:
            return
        stale = self.db.query(model).filter(model.code.notin_(desired_codes)).all()
        for row in stale:
            code = getattr(row, "code", None)
            if model is OrderableTest and code:
                in_use = (
                    self.db.query(OrderTest.id).filter(OrderTest.testCode == code).limit(1).first()
                )
                if in_use:
                    logger.warning(
                        "Keeping orderable test %s (referenced by order history; not in contracts)",
                        code,
                    )
                    continue
            if model is CatalogAnalyte and code:
                linked = (
                    self.db.query(OrderableTestAnalyte.id)
                    .filter(OrderableTestAnalyte.analyteCode == code)
                    .limit(1)
                    .first()
                )
                if linked:
                    logger.warning(
                        "Keeping analyte %s (linked to an orderable test; not in contracts)",
                        code,
                    )
                    continue
            self.db.delete(row)
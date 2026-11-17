"""Catalog business logic — contracts, orderable tests, workups, analytes, seed."""
from __future__ import annotations

import copy
import json
import logging
from pathlib import Path
from typing import Any

from app.domains.catalog.models import (
    AffiliationPricing,
    CatalogAnalyte,
    ClinicalWorkup,
    ClinicalWorkupTest,
    OrderableTest,
    OrderableTestAnalyte,
)
from app.domains.catalog.schemas import (
    AffiliationPricingResponse,
    AnalyteSummaryResponse,
    ClinicalWorkupResponse,
    OrderableTestResponse,
    OrderableTestSummaryResponse,
)
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


def analyte_contract_entry(row: CatalogAnalyte) -> dict[str, Any]:
    """Full ``analyte-catalog.json`` entry for one analyte."""
    stored = row.contractEntry
    if isinstance(stored, dict) and stored.get("analyte_code"):
        return copy.deepcopy(stored)

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
    entry = analyte_contract_entry(row)
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


def orderable_test_contract_entry(
    test: OrderableTest,
    *,
    analyte_codes: list[str] | None = None,
) -> dict[str, Any]:
    """Full ``orderable-tests.json`` test entry (snake_case keys)."""
    stored = test.contractEntry
    if isinstance(stored, dict) and stored.get("test_code"):
        entry = copy.deepcopy(stored)
        if analyte_codes is not None:
            entry["analytes"] = list(analyte_codes)
        return entry

    sample: dict[str, Any] = {"sample_type": test.sampleType}
    if test.containerDescription:
        sample["container"] = test.containerDescription
    if test.minimumVolume is not None:
        sample["minimum_volume_ml"] = test.minimumVolume
    if test.fastingRequired is not None:
        sample["fasting_required"] = test.fastingRequired
    if test.collectionNotes:
        sample["collection_notes"] = test.collectionNotes
    if test.rejectionCriteria:
        sample["rejection_criteria"] = test.rejectionCriteria

    entry = {
        "test_code": test.code,
        "name": test.name,
        "test_category": test.category,
        "sample_type": test.sampleType,
        "price": test.price,
        "turnaround_time_hours": test.turnaroundTimeHours,
        "container_types": test.containerTypes or [],
        "container_top_colors": test.containerTopColors or [],
        "sample": sample,
        "analytes": analyte_codes or [],
    }
    if test.synonyms:
        entry["synonyms"] = test.synonyms
    if test.sampleVolume:
        entry["sample_volume_description"] = test.sampleVolume
    if test.loincCode:
        entry["loinc_code"] = test.loincCode
    if test.methodology:
        entry["method_common"] = test.methodology
    if test.confidence:
        entry["confidence"] = test.confidence
    if test.notes:
        entry["notes"] = test.notes
    if test.validationRejectionCriteria:
        entry["validation"] = {"rejection_criteria": test.validationRejectionCriteria}
    return entry


def _analyte_codes_for_test(test: OrderableTest) -> list[str]:
    return [
        link.analyteCode
        for link in sorted(test.analyteLinks or [], key=lambda row: row.sortOrder)
        if link.analyteCode
    ]


def _analyte_summaries_for_test(test: OrderableTest) -> list[AnalyteSummaryResponse]:
    summaries: list[AnalyteSummaryResponse] = []
    for link in sorted(test.analyteLinks or [], key=lambda row: row.sortOrder):
        analyte = link.analyte
        if analyte is None:
            continue
        summaries.append(
            AnalyteSummaryResponse(
                analyteCode=analyte.code,
                name=analyte.name,
                loincCode=analyte.loincCode,
                unit=analyte.unit,
                specimen=analyte.specimen,
                contract=analyte_contract_entry(analyte),
            )
        )
    return summaries


def serialize_orderable_test(test: OrderableTest) -> dict:
    analyte_codes = _analyte_codes_for_test(test)
    payload = OrderableTestResponse.model_validate(test).model_dump(mode="json")
    payload["analytes"] = [a.model_dump(mode="json") for a in _analyte_summaries_for_test(test)]
    payload["contract"] = orderable_test_contract_entry(test, analyte_codes=analyte_codes)
    return payload


def serialize_orderable_test_summary(test: OrderableTest) -> dict:
    return OrderableTestSummaryResponse.model_validate(test).model_dump(mode="json")


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
        result = [serialize_orderable_test_summary(t) for t in rows]
        cache_set(cache_key, result, settings.CACHE_TTL_STATIC)
        return result

    def list_tests_by_codes(self, codes: list[str]) -> list[dict]:
        if not codes:
            return []
        found = self._query_full().filter(OrderableTest.code.in_(codes)).all()
        by_code = {row.code: row for row in found}
        ordered = [by_code[c] for c in codes if c in by_code]
        return [serialize_orderable_test(t) for t in ordered]

    def get_by_code(self, test_code: str) -> dict:
        row = self._query_full().filter(OrderableTest.code == test_code).first()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Orderable test {test_code} not found",
            )
        return serialize_orderable_test(row)

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


class ClinicalWorkupService:
    def __init__(self, db: Session):
        self.db = db

    def list_workups(self, *, active_only: bool = True) -> list[dict]:
        query = self.db.query(ClinicalWorkup).options(selectinload(ClinicalWorkup.testLinks))
        if active_only:
            query = query.filter(ClinicalWorkup.isActive.is_(True))
        rows = query.order_by(ClinicalWorkup.name.asc()).all()
        return [self._serialize(row) for row in rows]

    def _serialize(self, row: ClinicalWorkup) -> dict:
        test_codes = [link.testCode for link in sorted(row.testLinks or [], key=lambda link: link.testCode)]
        payload = ClinicalWorkupResponse.model_validate(row).model_dump(mode="json")
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


def _catalog_dir() -> Path:
    return _repo_root() / "contracts" / "catalog"


def _load_json(name: str) -> dict[str, Any]:
    path = _catalog_dir() / name
    return json.loads(path.read_text(encoding="utf-8"))


def _validation_rejection_criteria(entry: dict[str, Any]) -> list[Any] | None:
    validation = entry.get("validation")
    if isinstance(validation, dict):
        raw = validation.get("rejection_criteria")
        if raw is not None:
            return raw
    return None


def _copy_test_fields(entry: dict[str, Any]) -> dict[str, Any]:
    sample = entry.get("sample") if isinstance(entry.get("sample"), dict) else {}
    return {
        "code": entry["test_code"],
        "name": entry.get("name") or entry["test_code"],
        "displayName": entry.get("name") or entry["test_code"],
        "synonyms": entry.get("synonyms"),
        "category": entry.get("test_category") or entry.get("category") or "General",
        "price": float(entry.get("price") or 0),
        "turnaroundTimeHours": int(entry.get("turnaround_time_hours") or 0),
        "sampleType": entry.get("sample_type") or sample.get("sample_type") or "other",
        "sampleVolume": entry.get("sample_volume_description") or sample.get("container"),
        "minimumVolume": sample.get("minimum_volume_ml"),
        "optimalVolume": None,
        "containerTypes": entry.get("container_types") or [],
        "containerTopColors": entry.get("container_top_colors") or [],
        "numberOfContainers": None,
        "containerDescription": sample.get("container"),
        "specialRequirements": None,
        "fastingRequired": bool(sample.get("fasting_required")),
        "collectionNotes": sample.get("collection_notes"),
        "rejectionCriteria": sample.get("rejection_criteria") if sample else None,
        "validationRejectionCriteria": _validation_rejection_criteria(entry),
        "loincCode": entry.get("loinc_code"),
        "methodology": entry.get("method_common"),
        "confidence": entry.get("confidence"),
        "notes": entry.get("notes"),
        "isActive": True,
    }


class CatalogSeedService:
    def __init__(self, db: Session):
        self.db = db

    def seed_from_contracts(self) -> dict[str, int]:
        analyte_doc = _load_json("analyte-catalog.json")
        orderable_tests_doc = _load_json("orderable-tests.json")
        workups_doc = _load_json("clinical-workups.json")

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
                "contractEntry": copy.deepcopy(raw),
                "validationRejectionCriteria": _validation_rejection_criteria(raw),
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
            fields = _copy_test_fields(raw)
            fields["contractEntry"] = copy.deepcopy(raw)
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
            row = self.db.get(ClinicalWorkup, code)
            if row is None:
                self.db.add(ClinicalWorkup(code=code, **payload))
                counts["workups"] += 1
            else:
                for key, val in payload.items():
                    setattr(row, key, val)
            self._replace_workup_tests(code, raw.get("test_codes") or [])
        self._delete_stale_rows(ClinicalWorkup, desired_workup_codes)

        self.db.commit()
        logger.info("Catalog seed complete: %s", counts)
        return counts

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
        self.db.query(ClinicalWorkupTest).filter(ClinicalWorkupTest.workupCode == workup_code).delete(
            synchronize_session=False
        )
        for raw in test_codes:
            if not isinstance(raw, str) or not raw.strip():
                continue
            self.db.add(ClinicalWorkupTest(workupCode=workup_code, testCode=raw.strip()))

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
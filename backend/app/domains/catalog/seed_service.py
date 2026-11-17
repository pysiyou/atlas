"""Seed catalog tables from contract JSON (idempotent, junction-safe)."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from app.domains.catalog.models.catalog_analyte import CatalogAnalyte
from app.domains.catalog.models.clinical_workup import ClinicalWorkup
from app.domains.catalog.models.clinical_workup_test import ClinicalWorkupTest
from app.domains.catalog.models.orderable_test import OrderableTest
from app.domains.catalog.models.orderable_test_analyte import OrderableTestAnalyte
from app.domains.orders.models import OrderTest
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _catalog_dir() -> Path:
    return _repo_root() / "contracts" / "catalog"


def _load_json(name: str) -> dict[str, Any]:
    path = _catalog_dir() / name
    return json.loads(path.read_text(encoding="utf-8"))


def _copy_test_fields(entry: dict[str, Any]) -> dict[str, Any]:
    sample = entry.get("sample") if isinstance(entry.get("sample"), dict) else {}
    return {
        "code": entry["test_code"],
        "name": entry.get("name") or entry["test_code"],
        "displayName": entry.get("name") or entry["test_code"],
        "synonyms": entry.get("synonyms"),
        "category": entry.get("category") or "General",
        "price": float(entry.get("price") or 0),
        "turnaroundTimeHours": int(entry.get("turnaround_time_hours") or 0),
        "sampleType": sample.get("sample_type") or "Unknown",
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
        "validationRejectionCriteria": entry.get("validation_rejection_criteria"),
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
        """
        Upsert analytes, orderable tests, and clinical workups from JSON contracts.
        Removes stale junction rows and catalog rows absent from contracts.
        """
        analyte_doc = _load_json("analyte-catalog.json")
        tests_doc = _load_json("orderable-tests.json")
        workups_doc = _load_json("clinical-workups.json")

        counts = {"analytes": 0, "tests": 0, "workups": 0}

        desired_analyte_codes: set[str] = set()
        for raw in analyte_doc.get("analytes") or []:
            if not isinstance(raw, dict):
                continue
            code = raw.get("analyte_code")
            if not isinstance(code, str) or not code.strip():
                continue
            code = code.strip()
            desired_analyte_codes.add(code)
            definition = {k: v for k, v in raw.items() if k not in {"analyte_code", "name", "loinc_code", "unit", "specimen"}}
            payload = {
                "name": raw.get("name") or code,
                "loincCode": raw.get("loinc_code"),
                "unit": raw.get("unit"),
                "specimen": raw.get("specimen"),
                "definition": definition,
                "validationRejectionCriteria": raw.get("validation_rejection_criteria"),
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
        for raw in tests_doc.get("tests") or []:
            if not isinstance(raw, dict) or not raw.get("test_code"):
                continue
            fields = _copy_test_fields(raw)
            code = fields["code"]
            desired_test_codes.add(code)
            row = self.db.get(OrderableTest, code)
            if row is None:
                self.db.add(OrderableTest(**fields))
                counts["tests"] += 1
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
                    self.db.query(OrderTest.id)
                    .filter(OrderTest.testCode == code)
                    .limit(1)
                    .first()
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
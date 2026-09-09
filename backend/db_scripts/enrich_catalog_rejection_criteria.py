"""
Split catalog rejection criteria into collection (specimen) vs validation (result review).

- sample.rejection_criteria — specimen issues at accession/collection only
- validation_rejection_criteria — result review (analytical + specimen quality found during testing)

Usage:
  cd backend && python -m db_scripts.enrich_catalog_rejection_criteria
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.utils.specimen_reasons import infer_criterion_domain

CATALOG_PATH = BACKEND_ROOT / "app" / "data" / "test-catalog.json"

# Accession / collection-time specimen issues (not offered when rejecting entered results).
COLLECTION_ONLY_REASONS = {
    "Unlabeled sample",
    "Mislabeled / Patient ID mismatch",
    "Incorrect container / wrong tube",
    "Transport delay",
    "Leaked or broken container",
    "Not protected from light",
    "Overfilled tube",
}

BASE_COLLECTION_SPECIMEN = [
    {"reason": "Unlabeled sample", "domain": "specimen"},
    {"reason": "Mislabeled / Patient ID mismatch", "domain": "specimen"},
    {"reason": "Incorrect container / wrong tube", "domain": "specimen"},
    {"reason": "Hemolyzed - Severe", "domain": "specimen"},
    {"reason": "Lipemic sample", "domain": "specimen"},
    {"reason": "Icteric sample", "domain": "specimen"},
    {"reason": "Insufficient quantity (QNS)", "domain": "specimen"},
]

VALIDATION_SPECIMEN_AT_REVIEW = [
    {"reason": "Hemolyzed - Severe", "domain": "specimen"},
    {"reason": "Lipemic sample", "domain": "specimen"},
    {"reason": "Icteric sample", "domain": "specimen"},
    {"reason": "Insufficient quantity (QNS)", "domain": "specimen"},
    {"reason": "Contaminated sample", "domain": "specimen"},
]

UNIVERSAL_ANALYTICAL = [
    {"reason": "QC / control failure", "domain": "analytical"},
    {"reason": "Instrument error — repeat run", "domain": "analytical"},
    {"reason": "Procedural error during analysis", "domain": "analytical"},
]

CATEGORY_ANALYTICAL: dict[str, list[dict[str, str]]] = {
    "biochemistry": [
        {"reason": "Delta check failure — repeat run", "domain": "analytical"},
        {"reason": "Critical value — repeat for verification", "domain": "analytical"},
        {"reason": "Fasting requirements not met", "domain": "analytical"},
    ],
    "serology": [
        {"reason": "Indeterminate result — repeat run", "domain": "analytical"},
        {"reason": "Invalid or expired reagent — repeat run", "domain": "analytical"},
    ],
    "hematology": [
        {"reason": "Clotted sample", "domain": "specimen"},
        {"reason": "Analyzer flag — repeat run on same sample", "domain": "analytical"},
        {"reason": "Platelet clumps / aggregation flags — repeat count", "domain": "analytical"},
    ],
    "microbiology": [
        {"reason": "Insufficient growth — repeat incubation", "domain": "analytical"},
        {"reason": "Ambiguous identification — repeat workup", "domain": "analytical"},
    ],
    "coagulation": [
        {"reason": "Aberrant clotting curve — repeat run", "domain": "analytical"},
        {"reason": "Invalid coagulation control — repeat run", "domain": "analytical"},
    ],
    "urinalysis": [
        {"reason": "Invalid device / expired cartridge", "domain": "analytical"},
        {"reason": "Equivocal result — repeat run", "domain": "analytical"},
    ],
}


def _normalize_item(item: object) -> dict[str, str]:
    if isinstance(item, dict):
        reason = str(item.get("reason") or item.get("label") or "").strip()
        domain = str(item.get("domain") or infer_criterion_domain(reason)).lower()
        if domain not in {"specimen", "analytical"}:
            domain = infer_criterion_domain(reason)
        return {"reason": reason, "domain": domain}
    reason = str(item).strip()
    return {"reason": reason, "domain": infer_criterion_domain(reason)}


def _merge_criteria(*groups: list[dict[str, str]]) -> list[dict[str, str]]:
    merged: dict[str, dict[str, str]] = {}
    for group in groups:
        for item in group:
            reason = item["reason"]
            if reason:
                merged[reason] = item
    specimen = [merged[k] for k in sorted(merged) if merged[k]["domain"] == "specimen"]
    analytical = [merged[k] for k in sorted(merged) if merged[k]["domain"] == "analytical"]
    return specimen + analytical


def enrich_catalog() -> None:
    data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    updated = 0

    for test in data.get("tests", []):
        category = str(test.get("mapped_category") or "").lower()
        sample = test.setdefault("sample", {})

        legacy_items = [
            _normalize_item(item)
            for item in (sample.get("rejection_criteria") or [])
        ]
        legacy_items.extend(
            _normalize_item(item) for item in (test.get("validation_rejection_criteria") or [])
        )

        legacy_specimen = [item for item in legacy_items if item["domain"] == "specimen"]
        legacy_analytical = [item for item in legacy_items if item["domain"] == "analytical"]

        collection_specimen = [
            item for item in legacy_specimen if item["reason"] in COLLECTION_ONLY_REASONS
        ]
        collection_specimen.extend(
            item for item in BASE_COLLECTION_SPECIMEN if item["reason"] not in COLLECTION_ONLY_REASONS
        )

        validation_specimen = list(VALIDATION_SPECIMEN_AT_REVIEW)
        validation_specimen.extend(
            item
            for item in legacy_specimen
            if item["reason"] not in COLLECTION_ONLY_REASONS
            and item["reason"] not in {x["reason"] for x in VALIDATION_SPECIMEN_AT_REVIEW}
        )

        category_items = CATEGORY_ANALYTICAL.get(category, [])
        hematology_clot = [
            item for item in category_items if item["reason"] == "Clotted sample"
        ]
        if hematology_clot and category != "hematology":
            hematology_clot = []

        sample["rejection_criteria"] = _merge_criteria(
            BASE_COLLECTION_SPECIMEN,
            collection_specimen,
            hematology_clot,
        )
        test["validation_rejection_criteria"] = _merge_criteria(
            validation_specimen,
            legacy_analytical,
            UNIVERSAL_ANALYTICAL,
            category_items,
        )
        updated += 1

    CATALOG_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Split rejection criteria for {updated} tests in {CATALOG_PATH}")


if __name__ == "__main__":
    enrich_catalog()

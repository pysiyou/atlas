#!/usr/bin/env python3
"""Compare JSON contracts to catalog database row counts and junction FK coverage."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "contracts" / "catalog"
REG = ROOT / "contracts" / "registries"


def load_counts() -> dict[str, int]:
    analytes = json.loads((CATALOG / "analyte-catalog.json").read_text(encoding="utf-8"))
    tests = json.loads((CATALOG / "orderable-tests.json").read_text(encoding="utf-8"))
    workups = json.loads((CATALOG / "clinical-workups.json").read_text(encoding="utf-8"))
    sample_rr = json.loads((REG / "sample-rejection-reasons.json").read_text(encoding="utf-8"))
    result_rr = json.loads((REG / "result-rejection-reasons.json").read_text(encoding="utf-8"))
    return {
        "contract_analytes": len(analytes.get("analytes") or []),
        "contract_tests": len(tests.get("tests") or []),
        "contract_workups": len(workups.get("workups") or []),
        "contract_sample_rejection": len(sample_rr.get("reasons") or []),
        "contract_result_rejection": len(result_rr.get("reasons") or []),
        "junction_test_analytes": sum(
            len(t.get("analytes") or []) for t in (tests.get("tests") or []) if isinstance(t, dict)
        ),
        "junction_workup_tests": sum(
            len(w.get("test_codes") or [])
            for w in (workups.get("workups") or [])
            if isinstance(w, dict)
        ),
    }


def db_counts() -> dict[str, int] | None:
    sys.path.insert(0, str(ROOT / "backend"))
    try:
        import app.domains.registry  # noqa: F401
        from app.domains.catalog.models.catalog_analyte import CatalogAnalyte
        from app.domains.catalog.models.clinical_workup import ClinicalWorkup
        from app.domains.catalog.models.clinical_workup_test import ClinicalWorkupTest
        from app.domains.catalog.models.orderable_test import OrderableTest
        from app.domains.catalog.models.orderable_test_analyte import OrderableTestAnalyte
        from app.domains.catalog.seed_service import CatalogSeedService
        from app.platform.database import SessionLocal
    except Exception as exc:
        print(f"DB import skipped: {exc}")
        return None

    db = SessionLocal()
    try:
        CatalogSeedService(db).seed_from_contracts()
        return {
            "db_analytes": db.query(CatalogAnalyte).count(),
            "db_tests": db.query(OrderableTest).count(),
            "db_workups": db.query(ClinicalWorkup).count(),
            "db_orderable_test_analytes": db.query(OrderableTestAnalyte).count(),
            "db_clinical_workup_tests": db.query(ClinicalWorkupTest).count(),
        }
    finally:
        db.close()


def main() -> int:
    contract = load_counts()
    db = db_counts()
    print("=== Contract counts ===")
    for key, val in sorted(contract.items()):
        print(f"  {key}: {val}")

    if db is None:
        print("\nDATABASE: unavailable (seed not run)")
        return 0

    print("\n=== Database counts (post-seed) ===")
    for key, val in sorted(db.items()):
        print(f"  {key}: {val}")

    errors = 0
    pairs = [
        ("contract_analytes", "db_analytes"),
        ("contract_tests", "db_tests"),
        ("contract_workups", "db_workups"),
        ("junction_test_analytes", "db_orderable_test_analytes"),
        ("junction_workup_tests", "db_clinical_workup_tests"),
    ]
    for left, right in pairs:
        if contract[left] != db[right]:
            print(f"MISMATCH {left} ({contract[left]}) vs {right} ({db[right]})", file=sys.stderr)
            errors += 1

    if errors == 0:
        print("\nDB sync OK: catalog tables match JSON contracts 1:1")
    return errors


if __name__ == "__main__":
    sys.exit(main())
"""Load catalog analyte observation definitions for an orderable test."""
from __future__ import annotations

from typing import Any

from app.domains.catalog.models.catalog_analyte import CatalogAnalyte
from app.domains.catalog.models.orderable_test_analyte import OrderableTestAnalyte
from sqlalchemy.orm import Session


def analyte_definitions_for_test(db: Session, test_code: str) -> list[dict[str, Any]]:
    """
    Return analyte definition dicts for validation/HL7 (keys use ``analyte_code``).
    """
    rows = (
        db.query(OrderableTestAnalyte, CatalogAnalyte)
        .join(CatalogAnalyte, CatalogAnalyte.code == OrderableTestAnalyte.analyteCode)
        .filter(OrderableTestAnalyte.testCode == test_code)
        .order_by(OrderableTestAnalyte.sortOrder.asc())
        .all()
    )
    defs: list[dict[str, Any]] = []
    for _link, analyte in rows:
        base = {
            "analyte_code": analyte.code,
            "name": analyte.name,
            "loinc_code": analyte.loincCode,
            "unit": analyte.unit,
        }
        extra = analyte.definition if isinstance(analyte.definition, dict) else {}
        merged = {**extra, **base}
        defs.append(merged)
    return defs
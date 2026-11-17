"""Resolve analyzer/HL7 observations to canonical ``analyte_code`` values."""
from __future__ import annotations

from app.domains.catalog.models.catalog_analyte import CatalogAnalyte
from app.domains.catalog.models.orderable_test_analyte import OrderableTestAnalyte
from sqlalchemy.orm import Session


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
        """Map observation identifiers (mnemonic, LOINC, case variants) → ``analyte_code``."""
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
        """
        Resolve an incoming observation to a catalog ``analyte_code``.

        Matches ``analyte_code`` mnemonic and/or ``loinc_code`` on the test's analytes.
        """
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
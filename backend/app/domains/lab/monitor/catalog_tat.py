"""Catalog turnaround-time lookup with per-request memoization."""

from __future__ import annotations

from collections.abc import Iterable

from app.domains.catalog.models.catalog_test import CatalogTest
from sqlalchemy.orm import Session


class CatalogTatResolver:
    """Resolve catalog TAT hours with optional batch warm-up."""

    DEFAULT_HOURS = 24

    def __init__(self, db: Session):
        self.db = db
        self._cache: dict[str, int] = {}

    def warmup(self, test_codes: Iterable[str]) -> None:
        missing = [code for code in set(test_codes) if code not in self._cache]
        if not missing:
            return
        rows = (
            self.db.query(CatalogTest.code, CatalogTest.turnaroundTimeHours)
            .filter(CatalogTest.code.in_(missing))
            .all()
        )
        found = {code: hours for code, hours in rows}
        for code in missing:
            self._cache[code] = found.get(code) or self.DEFAULT_HOURS

    def hours_for_code(self, test_code: str) -> int:
        if test_code in self._cache:
            return self._cache[test_code]
        row = (
            self.db.query(CatalogTest.turnaroundTimeHours)
            .filter(CatalogTest.code == test_code)
            .first()
        )
        hours = row[0] if row else self.DEFAULT_HOURS
        self._cache[test_code] = hours
        return hours

    def max_hours_for_codes(self, codes: list[str] | None) -> int:
        if not codes:
            return self.DEFAULT_HOURS
        return max(self.hours_for_code(code) for code in codes)

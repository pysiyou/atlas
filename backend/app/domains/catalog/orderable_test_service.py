"""Orderable test catalog business logic."""
from __future__ import annotations

from app.domains.catalog.models.catalog_analyte import CatalogAnalyte
from app.domains.catalog.models.orderable_test import OrderableTest
from app.domains.catalog.models.orderable_test_analyte import OrderableTestAnalyte
from app.domains.catalog.schemas.analyte import AnalyteSummaryResponse
from app.domains.catalog.schemas.orderable_test import (
    OrderableTestResponse,
    OrderableTestSummaryResponse,
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
from sqlalchemy.orm import Session, selectinload

BY_CODES_MAX = 100


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
            )
        )
    return summaries


def serialize_orderable_test(test: OrderableTest) -> dict:
    payload = OrderableTestResponse.model_validate(test).model_dump(mode="json")
    payload["analytes"] = [a.model_dump(mode="json") for a in _analyte_summaries_for_test(test)]
    return payload


def serialize_orderable_test_summary(test: OrderableTest) -> dict:
    return OrderableTestSummaryResponse.model_validate(test).model_dump(mode="json")


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
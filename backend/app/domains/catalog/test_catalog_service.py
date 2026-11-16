"""CatalogTest catalog business logic."""
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
)
from app.platform.config import settings
from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session

BY_CODES_MAX = 100


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

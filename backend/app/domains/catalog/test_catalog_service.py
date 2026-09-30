"""CatalogTest catalog business logic."""
import logging

from app.domains.audit.service import AuditEmitter
from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.catalog.schemas.test import TestCreate, TestResponse, TestUpdate
from app.platform.cache import (
    CacheKeys,
    cache_delete,
    cache_get,
    cache_set,
    generate_cache_key,
    invalidate_tests_cache,
)
from app.platform.config import settings
from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def serialize_test(test: CatalogTest) -> dict:
    return TestResponse.model_validate(test).model_dump(mode="json")


class TestCatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)

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
        result = [serialize_test(t) for t in tests]
        cache_set(cache_key, result, settings.CACHE_TTL_STATIC)
        return result

    def get_by_code(self, test_code: str) -> CatalogTest:
        test = self.db.query(CatalogTest).filter(CatalogTest.code == test_code).first()
        if not test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"CatalogTest {test_code} not found",
            )
        return test

    def search(self, q: str) -> list[CatalogTest]:
        search_term = f"%{q.lower()}%"
        return (
            self.db.query(CatalogTest)
            .filter(
                (CatalogTest.name.ilike(search_term))
                | (CatalogTest.displayName.ilike(search_term))
                | (CatalogTest.code.ilike(search_term))
            )
            .order_by(CatalogTest.updatedAt.desc())
            .all()
        )

    def create(self, test_data: TestCreate, actor_user_id: int) -> CatalogTest:
        existing = self.db.query(CatalogTest).filter(CatalogTest.code == test_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CatalogTest with code {test_data.code} already exists",
            )
        test = CatalogTest(**test_data.model_dump())
        try:
            self.db.add(test)
            self.db.flush()
            self.emitter.catalog_test_created(test.id, test.code, actor_user_id)
            self.db.commit()
            self.db.refresh(test)
        except Exception:
            self.db.rollback()
            logger.exception("Failed to create test %s", test_data.code)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create test",
            )
        invalidate_tests_cache()
        return test

    def update(self, test_code: str, test_data: TestUpdate, actor_user_id: int) -> CatalogTest:
        test = self.get_by_code(test_code)
        update_data = test_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(test, field, value)
        try:
            self.emitter.catalog_test_updated(test.id, test.code, actor_user_id)
            self.db.commit()
            self.db.refresh(test)
        except Exception:
            self.db.rollback()
            logger.exception("Failed to update test %s", test_code)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update test",
            )
        invalidate_tests_cache()
        cache_delete(CacheKeys.TESTS_BY_CODE.format(code=test_code))
        return test

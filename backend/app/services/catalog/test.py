"""Test catalog business logic."""
import hashlib
import json
import logging
from typing import List, Optional

from fastapi import HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.cache import (
    CacheKeys,
    cache_delete,
    cache_get,
    cache_set,
    generate_cache_key,
    invalidate_tests_cache,
)
from app.models.test import Test
from app.schemas.test import TestCreate, TestResponse, TestUpdate

logger = logging.getLogger(__name__)


def serialize_test(test: Test) -> dict:
    return TestResponse.model_validate(test).model_dump(mode="json")


class TestService:
    def __init__(self, db: Session):
        self.db = db

    def list_tests(
        self,
        request: Request,
        response: Response,
        category: Optional[str] = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 10000,
    ) -> List[dict]:
        cache_key = generate_cache_key(
            CacheKeys.TESTS_CATALOG,
            category=category,
            activeOnly=active_only,
            skip=skip,
            limit=limit,
        )
        cached_data = cache_get(cache_key)
        if cached_data is not None:
            etag = hashlib.md5(json.dumps(cached_data, sort_keys=True).encode()).hexdigest()
            response.headers["ETag"] = f'"{etag}"'
            response.headers["Cache-Control"] = "public, max-age=3600"
            if_none_match = request.headers.get("if-none-match")
            if if_none_match and if_none_match.strip('"') == etag:
                response.status_code = 304
                return []
            return cached_data

        query = self.db.query(Test)
        if active_only:
            query = query.filter(Test.isActive.is_(True))
        if category:
            query = query.filter(Test.category == category)
        tests = query.order_by(Test.updatedAt.desc()).offset(skip).limit(limit).all()
        result = [serialize_test(t) for t in tests]
        cache_set(cache_key, result, settings.CACHE_TTL_STATIC)
        etag = hashlib.md5(json.dumps(result, sort_keys=True).encode()).hexdigest()
        response.headers["ETag"] = f'"{etag}"'
        response.headers["Cache-Control"] = "public, max-age=3600"
        return result

    def get_by_code(self, test_code: str) -> Test:
        test = self.db.query(Test).filter(Test.code == test_code).first()
        if not test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test {test_code} not found",
            )
        return test

    def search(self, q: str) -> List[Test]:
        search_term = f"%{q.lower()}%"
        return (
            self.db.query(Test)
            .filter(
                (Test.name.ilike(search_term))
                | (Test.displayName.ilike(search_term))
                | (Test.code.ilike(search_term))
            )
            .order_by(Test.updatedAt.desc())
            .all()
        )

    def create(self, test_data: TestCreate) -> Test:
        existing = self.db.query(Test).filter(Test.code == test_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Test with code {test_data.code} already exists",
            )
        test = Test(**test_data.model_dump())
        try:
            self.db.add(test)
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

    def update(self, test_code: str, test_data: TestUpdate) -> Test:
        test = self.get_by_code(test_code)
        update_data = test_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(test, field, value)
        try:
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

"""
Test Catalog API Routes
"""
import logging
import hashlib
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response, Request
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db

logger = logging.getLogger(__name__)
from app.core.dependencies import get_current_user
from app.core.cache import (
    cache_get,
    cache_set,
    cache_delete,
    generate_cache_key,
    invalidate_tests_cache,
    CacheKeys,
)
from app.config import settings
from app.models.user import User
from app.models.test import Test
from app.schemas.test import TestCreate, TestUpdate, TestResponse

router = APIRouter()


def _serialize_test(test: Test) -> dict:
    """Serialize test model to dict for caching."""
    return TestResponse.model_validate(test).model_dump(mode="json")


@router.get("/tests", response_model=List[TestResponse])
def get_tests(
    request: Request,
    response: Response,
    category: str | None = None,
    activeOnly: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all tests with optional category filter.
    Results are cached for 1 hour (static data).
    """
    # Generate cache key based on query parameters
    cache_key = generate_cache_key(
        CacheKeys.TESTS_CATALOG,
        category=category,
        activeOnly=activeOnly,
        skip=skip,
        limit=limit
    )

    # Try cache first
    cached_data = cache_get(cache_key)
    if cached_data is not None:
        # Generate ETag from cached data
        etag = hashlib.md5(json.dumps(cached_data, sort_keys=True).encode()).hexdigest()
        response.headers["ETag"] = f'"{etag}"'
        response.headers["Cache-Control"] = "public, max-age=3600"

        # Check If-None-Match header
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match.strip('"') == etag:
            response.status_code = 304
            return []

        return cached_data

    # Query database
    query = db.query(Test)

    if activeOnly:
        query = query.filter(Test.isActive == True)

    if category:
        query = query.filter(Test.category == category)

    tests = query.offset(skip).limit(limit).all()

    # Serialize and cache
    result = [_serialize_test(t) for t in tests]
    cache_set(cache_key, result, settings.CACHE_TTL_STATIC)

    # Set cache headers
    etag = hashlib.md5(json.dumps(result, sort_keys=True).encode()).hexdigest()
    response.headers["ETag"] = f'"{etag}"'
    response.headers["Cache-Control"] = "public, max-age=3600"

    return result


@router.get("/tests/{testCode}", response_model=TestResponse)
def get_test(
    testCode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get test by code
    """
    test = db.query(Test).filter(Test.code == testCode).first()
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {testCode} not found"
        )
    return test


@router.get("/tests/search", response_model=List[TestResponse])
def search_tests(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search tests by name or synonym
    """
    search_term = f"%{q.lower()}%"
    tests = db.query(Test).filter(
        (Test.name.ilike(search_term)) |
        (Test.displayName.ilike(search_term)) |
        (Test.code.ilike(search_term))
    ).all()
    return tests


@router.post("/tests", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
def create_test(
    test_data: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new test.
    Invalidates test catalog cache.
    """
    # Check if test code already exists
    existing = db.query(Test).filter(Test.code == test_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Test with code {test_data.code} already exists"
        )

    create_dict = test_data.model_dump()
    for key in ("createdAt", "updatedAt"):
        if create_dict.get(key) is None:
            create_dict.pop(key, None)
    test = Test(**create_dict)
    if test_data.createdAt is not None:
        test.createdAt = test_data.createdAt
    if test_data.updatedAt is not None:
        test.updatedAt = test_data.updatedAt

    try:
        db.add(test)
        db.commit()
        db.refresh(test)
    except Exception:
        db.rollback()
        logger.exception(f"Failed to create test {test_data.code}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create test"
        )

    # Invalidate cache
    invalidate_tests_cache()

    return test


@router.put("/tests/{testCode}", response_model=TestResponse)
def update_test(
    testCode: str,
    test_data: TestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update test (price, active status).
    Invalidates test catalog cache.
    """
    test = db.query(Test).filter(Test.code == testCode).first()
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {testCode} not found"
        )

    update_data = test_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(test, field, value)
    if test_data.updatedAt is not None:
        test.updatedAt = test_data.updatedAt

    try:
        db.commit()
        db.refresh(test)
    except Exception:
        db.rollback()
        logger.exception(f"Failed to update test {testCode}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update test"
        )

    # Invalidate cache
    invalidate_tests_cache()
    cache_delete(CacheKeys.TESTS_BY_CODE.format(code=testCode))

    return test

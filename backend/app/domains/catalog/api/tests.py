"""Test Catalog API Routes"""

from app.domains.catalog.schemas.test import TestCreate, TestResponse, TestSummaryResponse, TestUpdate
from app.domains.catalog.test_catalog_service import BY_CODES_MAX, TestCatalogService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from app.platform.utils.common import parse_csv_values
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

router = APIRouter()


def parse_by_codes_param(raw: str | None) -> list[str]:
    """Parse `codes=` into a de-duplicated list, preserving first-seen order."""
    parsed = parse_csv_values(raw)
    if not parsed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="codes must be a non-empty comma-separated list",
        )
    unique: list[str] = []
    seen: set[str] = set()
    for code in parsed:
        if code in seen:
            continue
        seen.add(code)
        unique.append(code)
    if len(unique) > BY_CODES_MAX:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"codes cannot exceed {BY_CODES_MAX} items",
        )
    return unique


@router.get("/tests", response_model=list[TestSummaryResponse])
def get_tests(
    response: Response,
    category: str | None = None,
    activeOnly: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestCatalogService(db).list_tests(response, category, activeOnly, skip, limit)


@router.get("/tests/search", response_model=list[TestResponse])
def search_tests(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestCatalogService(db).search(q)


@router.get("/tests/by-codes", response_model=list[TestResponse])
def get_tests_by_codes(
    codes: str = Query(..., description="Comma-separated test codes (max 100)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestCatalogService(db).list_tests_by_codes(parse_by_codes_param(codes))


@router.get("/tests/{testCode}", response_model=TestResponse)
def get_test(
    testCode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestCatalogService(db).get_by_code(testCode)


@router.post("/tests", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
def create_test(
    test_data: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestCatalogService(db).create(test_data, current_user.id)


@router.put("/tests/{testCode}", response_model=TestResponse)
def update_test(
    testCode: str,
    test_data: TestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestCatalogService(db).update(testCode, test_data, current_user.id)

"""Test Catalog API Routes"""

from app.domains.catalog.schemas.test import TestCreate, TestResponse, TestUpdate
from app.domains.catalog.test_catalog_service import TestCatalogService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/tests", response_model=list[TestResponse])
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

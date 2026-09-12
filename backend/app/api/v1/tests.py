"""Test Catalog API Routes"""
from typing import List

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.test import TestCreate, TestResponse, TestUpdate
from app.services.catalog.test import TestService

router = APIRouter()


@router.get("/tests", response_model=List[TestResponse])
def get_tests(
    request: Request,
    response: Response,
    category: str | None = None,
    activeOnly: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestService(db).list_tests(request, response, category, activeOnly, skip, limit)


@router.get("/tests/search", response_model=List[TestResponse])
def search_tests(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestService(db).search(q)


@router.get("/tests/{testCode}", response_model=TestResponse)
def get_test(
    testCode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestService(db).get_by_code(testCode)


@router.post("/tests", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
def create_test(
    test_data: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestService(db).create(test_data)


@router.put("/tests/{testCode}", response_model=TestResponse)
def update_test(
    testCode: str,
    test_data: TestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TestService(db).update(testCode, test_data)

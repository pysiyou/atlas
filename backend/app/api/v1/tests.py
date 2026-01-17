"""
Test Catalog API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.test import Test
from app.schemas.test import TestCreate, TestUpdate, TestResponse

router = APIRouter()


@router.get("/tests", response_model=List[TestResponse])
def get_tests(
    category: str | None = None,
    active_only: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all tests with optional category filter
    """
    query = db.query(Test)
    
    if active_only:
        query = query.filter(Test.is_active == True)
    
    if category:
        query = query.filter(Test.category == category)
    
    tests = query.offset(skip).limit(limit).all()
    return tests


@router.get("/tests/{test_code}", response_model=TestResponse)
def get_test(
    test_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get test by code
    """
    test = db.query(Test).filter(Test.code == test_code).first()
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {test_code} not found"
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
        (Test.display_name.ilike(search_term)) |
        (Test.code.ilike(search_term))
    ).all()
    return tests


@router.post("/tests", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
def create_test(
    test_data: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new test (admin only)
    """
    # Check if test code already exists
    existing = db.query(Test).filter(Test.code == test_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Test with code {test_data.code} already exists"
        )
    
    test = Test(**test_data.model_dump())
    db.add(test)
    db.commit()
    db.refresh(test)
    
    return test


@router.put("/tests/{test_code}", response_model=TestResponse)
def update_test(
    test_code: str,
    test_data: TestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update test (price, active status)
    """
    test = db.query(Test).filter(Test.code == test_code).first()
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {test_code} not found"
        )
    
    update_data = test_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(test, field, value)
    
    db.commit()
    db.refresh(test)
    
    return test

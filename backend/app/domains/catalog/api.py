"""Catalog API routes — orderable tests, workups, affiliation pricing."""
from app.domains.catalog.schemas import (
    WorkupResponse,
    OrderableTestResponse,
    OrderableTestSummaryResponse,
)
from app.domains.catalog.service import BY_CODES_MAX, AffiliationPricingService, OrderableTestService, WorkupService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http import get_current_user
from app.platform.utils import parse_csv_values
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

router = APIRouter()


def parse_by_codes_param(raw: str | None) -> list[str]:
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


@router.get("/orderable-tests", response_model=list[OrderableTestSummaryResponse])
def list_orderable_tests(
    response: Response,
    category: str | None = None,
    activeOnly: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderableTestService(db).list_tests(response, category, activeOnly, skip, limit)


@router.get("/orderable-tests/search", response_model=list[OrderableTestSummaryResponse])
def search_orderable_tests(
    q: str,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderableTestService(db).search(q, limit=limit)


@router.get("/orderable-tests/by-codes", response_model=list[OrderableTestResponse])
def get_orderable_tests_by_codes(
    codes: str = Query(..., description="Comma-separated test codes (max 100)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderableTestService(db).list_tests_by_codes(parse_by_codes_param(codes))


@router.get("/orderable-tests/{testCode}", response_model=OrderableTestResponse)
def get_orderable_test(
    testCode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return OrderableTestService(db).get_by_code(testCode)


@router.get("/workups", response_model=list[WorkupResponse])
def list_workups(
    activeOnly: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return WorkupService(db).list_workups(active_only=activeOnly)


@router.get("/affiliations/pricing")
def get_affiliation_pricing(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AffiliationPricingService(db).list_pricing(response)
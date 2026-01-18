"""
Results API Routes - for result entry and validation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.dependencies import get_current_user, require_lab_tech, require_validator
from app.models.user import User
from app.models.order import OrderTest
from app.schemas.enums import TestStatus, ValidationDecision
from pydantic import BaseModel

router = APIRouter()


class ResultEntryRequest(BaseModel):
    results: dict  # Record<string, TestResult>
    technicianNotes: str | None = None


class ResultValidationRequest(BaseModel):
    decision: ValidationDecision
    validationNotes: str | None = None


@router.get("/results/pending-entry")
def get_pending_entry(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Get tests awaiting result entry
    """
    tests = db.query(OrderTest).filter(
        OrderTest.status == TestStatus.SAMPLE_COLLECTED
    ).all()
    return tests


@router.get("/results/pending-validation")
def get_pending_validation(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """
    Get tests awaiting validation
    """
    tests = db.query(OrderTest).filter(
        OrderTest.status == TestStatus.COMPLETED
    ).all()
    return tests


@router.post("/results/{orderId}/tests/{testCode}")
def enter_results(
    orderId: str,
    testCode: str,
    result_data: ResultEntryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Enter results for a test
    """
    order_test = db.query(OrderTest).filter(
        OrderTest.orderId == orderId,
        OrderTest.testCode == testCode
    ).first()

    if not order_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {testCode} not found in order {orderId}"
        )

    # Update results
    order_test.results = result_data.results
    order_test.resultEnteredAt = datetime.utcnow()
    order_test.enteredBy = current_user.id
    order_test.technicianNotes = result_data.technicianNotes
    order_test.status = TestStatus.COMPLETED

    db.commit()
    db.refresh(order_test)

    return order_test


@router.post("/results/{orderId}/tests/{testCode}/validate")
def validate_results(
    orderId: str,
    testCode: str,
    validation_data: ResultValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """
    Validate test results
    """
    order_test = db.query(OrderTest).filter(
        OrderTest.orderId == orderId,
        OrderTest.testCode == testCode
    ).first()

    if not order_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {testCode} not found in order {orderId}"
        )

    if order_test.status != TestStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Test must be completed before validation"
        )

    # Update validation
    order_test.resultValidatedAt = datetime.utcnow()
    order_test.validatedBy = current_user.id
    order_test.validationNotes = validation_data.validationNotes

    if validation_data.decision == ValidationDecision.APPROVED:
        order_test.status = TestStatus.VALIDATED
    elif validation_data.decision == ValidationDecision.REJECTED:
        order_test.status = TestStatus.REJECTED

    db.commit()
    db.refresh(order_test)

    return order_test

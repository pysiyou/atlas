"""
Results API Routes - for result entry and validation

Uses the unified LabOperationsService for all operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from app.database import get_db
from app.core.dependencies import get_current_user, require_lab_tech, require_validator
from app.models.user import User
from app.models.order import OrderTest
from app.schemas.enums import TestStatus, ValidationDecision, RejectionAction
from app.services.lab_operations import (
    LabOperationsService,
    LabOperationError,
    RejectionOptions,
    RejectionResult
)
from app.services.order_status_updater import update_order_status

router = APIRouter()


class ResultEntryRequest(BaseModel):
    """Request body for entering test results"""
    results: dict  # Record<string, TestResult>
    technicianNotes: Optional[str] = None


class ResultValidationRequest(BaseModel):
    """Request body for validating (approving) test results"""
    decision: ValidationDecision
    validationNotes: Optional[str] = None


class ResultRejectionRequest(BaseModel):
    """
    Request body for rejecting test results during validation.
    Uses the new action-based approach.
    """
    rejectionReason: str = Field(..., min_length=1, max_length=1000, description="Reason for rejection")
    rejectionType: str = Field(
        ...,
        description="'re-test' = re-run with same sample, 're-collect' = new sample needed"
    )


class RejectionOptionsResponse(BaseModel):
    """Response for rejection options query"""
    canRetest: bool
    retestAttemptsRemaining: int
    canRecollect: bool
    recollectionAttemptsRemaining: int
    availableActions: list
    escalationRequired: bool = False

    class Config:
        from_attributes = True


class RejectionResultResponse(BaseModel):
    """Response for rejection operation"""
    success: bool
    action: str
    message: str
    originalTestId: str
    newTestId: Optional[str] = None
    newSampleId: Optional[str] = None
    escalationRequired: bool = False

    class Config:
        from_attributes = True


@router.get("/results/pending-entry")
def get_pending_entry(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Get tests awaiting result entry.
    Returns tests with status SAMPLE_COLLECTED (not SUPERSEDED).
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
    Get tests awaiting validation.
    Returns tests with status COMPLETED (not SUPERSEDED).
    """
    tests = db.query(OrderTest).filter(
        OrderTest.status == TestStatus.RESULTED
    ).all()
    return tests


@router.get("/results/{orderId}/tests/{testCode}/rejection-options", response_model=RejectionOptionsResponse)
def get_rejection_options(
    orderId: str,
    testCode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """
    Get available rejection actions for a test.

    Returns information about what rejection actions are available,
    remaining attempt counts, and whether escalation is required.
    """
    try:
        service = LabOperationsService(db)
        options = service.get_rejection_options(orderId, testCode)

        return RejectionOptionsResponse(
            canRetest=options.canRetest,
            retestAttemptsRemaining=options.retestAttemptsRemaining,
            canRecollect=options.canRecollect,
            recollectionAttemptsRemaining=options.recollectionAttemptsRemaining,
            availableActions=[
                {
                    "action": a.action.value,
                    "enabled": a.enabled,
                    "disabledReason": a.disabledReason,
                    "label": a.label,
                    "description": a.description
                }
                for a in options.availableActions
            ],
            escalationRequired=options.escalationRequired
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/results/{orderId}/tests/{testCode}")
def enter_results(
    orderId: str,
    testCode: str,
    result_data: ResultEntryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Enter results for a test.
    For retests, finds the active (non-superseded) test entry.
    """
    try:
        service = LabOperationsService(db)
        order_test = service.enter_results(
            order_id=orderId,
            test_code=testCode,
            user_id=current_user.id,
            results=result_data.results,
            technician_notes=result_data.technicianNotes
        )
        return order_test
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/results/{orderId}/tests/{testCode}/validate")
def validate_results(
    orderId: str,
    testCode: str,
    validation_data: ResultValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """
    Validate test results - APPROVAL ONLY.
    For rejections, use the /reject endpoint instead.
    """
    if validation_data.decision != ValidationDecision.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For rejections, use the /reject endpoint. This endpoint only handles approvals."
        )

    try:
        service = LabOperationsService(db)
        order_test = service.validate_results(
            order_id=orderId,
            test_code=testCode,
            user_id=current_user.id,
            validation_notes=validation_data.validationNotes
        )
        return order_test
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/results/{orderId}/tests/{testCode}/reject", response_model=RejectionResultResponse)
def reject_results(
    orderId: str,
    testCode: str,
    rejection_data: ResultRejectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """
    Reject test results during validation with proper tracking.

    Two rejection paths:
    - 're-test': Create a NEW OrderTest linked to original, existing sample remains valid.
                 Original test is marked as SUPERSEDED.
    - 're-collect': Reject the sample and trigger sample recollection flow.
                    Original test gets a new sample when recollection is complete.

    Both paths maintain rejection history for audit trail.

    Before calling this endpoint, use GET /rejection-options to check what actions
    are available and whether any limits have been reached.
    """
    # Map rejection type string to RejectionAction enum
    action_map = {
        're-test': RejectionAction.RETEST_SAME_SAMPLE,
        're-collect': RejectionAction.RECOLLECT_NEW_SAMPLE,
        'retest_same_sample': RejectionAction.RETEST_SAME_SAMPLE,
        'recollect_new_sample': RejectionAction.RECOLLECT_NEW_SAMPLE,
        'escalate': RejectionAction.ESCALATE_TO_SUPERVISOR
    }

    action = action_map.get(rejection_data.rejectionType)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rejection type: {rejection_data.rejectionType}. Valid options: 're-test', 're-collect'"
        )

    try:
        service = LabOperationsService(db)
        result = service.reject_results(
            order_id=orderId,
            test_code=testCode,
            user_id=current_user.id,
            action=action,
            rejection_reason=rejection_data.rejectionReason
        )

        return RejectionResultResponse(
            success=result.success,
            action=result.action.value,
            message=result.message,
            originalTestId=result.originalTestId,
            newTestId=result.newTestId,
            newSampleId=result.newSampleId,
            escalationRequired=result.escalationRequired
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

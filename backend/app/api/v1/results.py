"""
Results API Routes - for result entry and validation

Uses the unified LabOperationsService for all operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from app.database import get_db
from app.core.dependencies import get_current_user
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
        description="'re-test' = re-run with same sample, 're-collect' = new sample needed, 'escalate' = escalate to supervisor when limits exceeded"
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
    originalTestId: int
    newTestId: Optional[int] = None
    newSampleId: Optional[int] = None
    escalationRequired: bool = False

    class Config:
        from_attributes = True


class BulkValidationItem(BaseModel):
    """Single item in bulk validation request"""
    orderId: int
    testCode: str


class BulkValidationRequest(BaseModel):
    """Request body for bulk validation"""
    items: List[BulkValidationItem] = Field(..., min_items=1, description="List of tests to validate")
    validationNotes: Optional[str] = None


class BulkValidationResult(BaseModel):
    """Result for a single validation in bulk operation"""
    orderId: int
    testCode: str
    success: bool
    error: Optional[str] = None
    testId: Optional[int] = None


class BulkValidationResponse(BaseModel):
    """Response for bulk validation operation"""
    results: List[BulkValidationResult]
    successCount: int
    failureCount: int


@router.get("/results/pending-entry")
def get_pending_entry(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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
    orderId: int,
    testCode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    orderId: int,
    testCode: str,
    result_data: ResultEntryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    orderId: int,
    testCode: str,
    validation_data: ResultValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    orderId: int,
    testCode: str,
    rejection_data: ResultRejectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
            detail=f"Invalid rejection type: {rejection_data.rejectionType}. Valid options: 're-test', 're-collect', 'escalate'"
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


@router.post("/results/validate-bulk", response_model=BulkValidationResponse)
def validate_bulk(
    request: BulkValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validate multiple test results in a single transaction.
    
    Processes all validations in a single database transaction for consistency.
    Partial failures are reported but do not roll back successful validations.
    
    Note: Tests with critical values should be excluded from bulk validation
    and handled individually to ensure proper notification workflow.
    """
    service = LabOperationsService(db)
    results = []
    success_count = 0
    failure_count = 0

    # Process all validations in a single transaction
    for item in request.items:
        try:
            order_test = service.validate_results(
                order_id=item.orderId,
                test_code=item.testCode,
                user_id=current_user.id,
                validation_notes=request.validationNotes
            )
            results.append(BulkValidationResult(
                orderId=item.orderId,
                testCode=item.testCode,
                success=True,
                testId=order_test.id
            ))
            success_count += 1
        except LabOperationError as e:
            results.append(BulkValidationResult(
                orderId=item.orderId,
                testCode=item.testCode,
                success=False,
                error=e.message
            ))
            failure_count += 1
        except Exception as e:
            # Catch any unexpected errors
            results.append(BulkValidationResult(
                orderId=item.orderId,
                testCode=item.testCode,
                success=False,
                error=f"Unexpected error: {str(e)}"
            ))
            failure_count += 1

    # Commit all successful validations
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to commit bulk validation: {str(e)}"
        )

    return BulkValidationResponse(
        results=results,
        successCount=success_count,
        failureCount=failure_count
    )

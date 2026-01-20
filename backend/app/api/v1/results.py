"""
Results API Routes - for result entry and validation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Literal
from datetime import datetime, timezone
from app.database import get_db
from app.core.dependencies import get_current_user, require_lab_tech, require_validator
from app.models.user import User
from app.models.order import OrderTest
from app.models.sample import Sample
from app.schemas.enums import TestStatus, ValidationDecision, SampleStatus
from app.schemas.order import ResultRejectionRequest
from pydantic import BaseModel
from app.services.order_status_updater import update_order_status
from app.services.sample_recollection import (
    reject_and_request_recollection,
    RecollectionError
)

router = APIRouter()

# Maximum retest attempts before requiring supervisor escalation
MAX_RETEST_ATTEMPTS = 3


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
    Enter results for a test.
    For retests, finds the active (non-superseded) test entry.
    """
    # Find the active test entry (not superseded)
    # For retests, multiple entries may exist with the same testCode
    order_test = db.query(OrderTest).filter(
        OrderTest.orderId == orderId,
        OrderTest.testCode == testCode,
        OrderTest.status == TestStatus.SAMPLE_COLLECTED  # Only tests ready for result entry
    ).first()

    if not order_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {testCode} not found in order {orderId} or not ready for result entry"
        )

    # Update results
    order_test.results = result_data.results
    order_test.resultEnteredAt = datetime.now(timezone.utc)
    order_test.enteredBy = current_user.id
    order_test.technicianNotes = result_data.technicianNotes
    order_test.status = TestStatus.COMPLETED

    db.commit()
    db.refresh(order_test)
    
    # Update order status
    update_order_status(db, orderId)

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
    Validate test results - APPROVAL ONLY
    For rejections, use the /reject endpoint instead.
    
    - APPROVED: Mark as validated
    """
    # Find the active test entry (in completed state, not superseded)
    # For retests, multiple entries may exist with the same testCode
    order_test = db.query(OrderTest).filter(
        OrderTest.orderId == orderId,
        OrderTest.testCode == testCode,
        OrderTest.status == TestStatus.COMPLETED  # Only completed tests can be validated
    ).first()

    if not order_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Completed test {testCode} not found in order {orderId}"
        )

    # Update validation metadata
    order_test.resultValidatedAt = datetime.now(timezone.utc)
    order_test.validatedBy = current_user.id
    order_test.validationNotes = validation_data.validationNotes

    if validation_data.decision == ValidationDecision.APPROVED:
        # Approve results
        order_test.status = TestStatus.VALIDATED
    else:
        # For backwards compatibility, handle rejection decisions
        # But recommend using the /reject endpoint for proper tracking
        if validation_data.decision == ValidationDecision.REJECTED:
            order_test.status = TestStatus.SAMPLE_COLLECTED
            order_test.results = None
            order_test.resultEnteredAt = None
            order_test.enteredBy = None
            order_test.technicianNotes = f"Re-test required: {validation_data.validationNotes or 'Results rejected by validator'}"
        elif validation_data.decision == ValidationDecision.REPEAT_REQUIRED:
            order_test.status = TestStatus.PENDING
            order_test.sampleId = None
            order_test.results = None
            order_test.resultEnteredAt = None
            order_test.enteredBy = None
            order_test.technicianNotes = f"Re-collection required: {validation_data.validationNotes or 'Sample rejected by validator'}"

    db.commit()
    db.refresh(order_test)
    
    # Update order status
    update_order_status(db, orderId)

    return order_test


@router.post("/results/{orderId}/tests/{testCode}/reject")
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
    """
    # Find the original order test
    original_test = db.query(OrderTest).filter(
        OrderTest.orderId == orderId,
        OrderTest.testCode == testCode,
        OrderTest.status == TestStatus.COMPLETED  # Must be in completed state
    ).first()

    if not original_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Completed test {testCode} not found in order {orderId}"
        )

    # Check retest limit
    current_retest_number = original_test.retestNumber or 0
    if current_retest_number >= MAX_RETEST_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum retest attempts ({MAX_RETEST_ATTEMPTS}) reached. Please escalate to supervisor."
        )

    # Create rejection record for history
    rejection_record = {
        "rejectedAt": datetime.now(timezone.utc).isoformat(),
        "rejectedBy": current_user.id,
        "rejectionReason": rejection_data.rejectionReason,
        "rejectionType": rejection_data.rejectionType,
    }

    # Initialize rejection history if needed
    if original_test.resultRejectionHistory is None:
        original_test.resultRejectionHistory = []
    original_test.resultRejectionHistory.append(rejection_record)
    flag_modified(original_test, 'resultRejectionHistory')

    # Update validation metadata on original test
    original_test.resultValidatedAt = datetime.now(timezone.utc)
    original_test.validatedBy = current_user.id
    original_test.validationNotes = rejection_data.rejectionReason

    if rejection_data.rejectionType == 're-test':
        # RE-TEST PATH: Create a new OrderTest, keep the same sample
        new_test_id = f"{orderId}_{testCode}_RT{current_retest_number + 1}"
        
        # Create new OrderTest entry for the retest
        new_order_test = OrderTest(
            id=new_test_id,
            orderId=orderId,
            testCode=testCode,
            status=TestStatus.SAMPLE_COLLECTED,  # Ready for result entry
            priceAtOrder=original_test.priceAtOrder,
            sampleId=original_test.sampleId,  # Keep the same sample
            
            # Retest tracking
            isRetest=True,
            retestOfTestId=original_test.id,
            retestNumber=current_retest_number + 1,
            
            # Copy rejection history from original
            resultRejectionHistory=original_test.resultRejectionHistory,
            
            # Technician notes explaining this is a retest
            technicianNotes=f"Re-test #{current_retest_number + 1}: {rejection_data.rejectionReason}",
            
            # Copy flags if any
            flags=original_test.flags,
            
            # Copy reflex/repeat info
            isReflexTest=original_test.isReflexTest,
            triggeredBy=original_test.triggeredBy,
            reflexRule=original_test.reflexRule,
        )
        
        # Link original test to the new retest
        original_test.retestOrderTestId = new_test_id
        original_test.status = TestStatus.SUPERSEDED
        
        # Add new test to database
        db.add(new_order_test)
        db.commit()
        db.refresh(new_order_test)
        
        # Update order status
        update_order_status(db, orderId)
        
        return new_order_test
        
    elif rejection_data.rejectionType == 're-collect':
        # RE-COLLECT PATH: Reject the sample and create a new recollection sample
        # Uses the shared sample_recollection service
        if not original_test.sampleId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot request recollection - no sample linked to this test"
            )
        
        # Find the sample
        sample = db.query(Sample).filter(Sample.sampleId == original_test.sampleId).first()
        if not sample:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample {original_test.sampleId} not found"
            )
        
        # Allow rejection from any valid post-collection state (not pending, rejected, or disposed)
        valid_statuses = [
            SampleStatus.COLLECTED, 
            SampleStatus.RECEIVED, 
            SampleStatus.ACCESSIONED, 
            SampleStatus.IN_PROGRESS,
            SampleStatus.COMPLETED,
            SampleStatus.STORED
        ]
        if sample.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample cannot be rejected from status '{sample.status.value}'. Must be collected/received/accessioned/in-progress/completed/stored."
            )
        
        # Use the shared recollection service to reject sample and create recollection
        try:
            rejection_reason = f"Rejected during result validation: {rejection_data.rejectionReason}"
            new_sample = reject_and_request_recollection(
                db=db,
                sample=sample,
                rejection_reason=rejection_reason,
                user_id=current_user.id,
                rejection_reasons=["other"],  # Generic reason for validation rejection
                update_order_tests=True  # This will update the order test status and sampleId
            )
            
            # Refresh the original test to get updated values
            db.refresh(original_test)
            
            return original_test
            
        except RecollectionError as e:
            raise HTTPException(
                status_code=e.status_code,
                detail=e.message
            )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rejection type: {rejection_data.rejectionType}"
        )

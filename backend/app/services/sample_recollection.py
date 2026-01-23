"""
Sample Recollection Service
Handles creation of recollection samples - reusable from both sample rejection and result validation flows.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from app.models.sample import Sample
from app.models.order import OrderTest
from app.schemas.enums import SampleStatus, TestStatus, PriorityLevel
from app.services.order_status_updater import update_order_status

# Maximum recollection attempts before requiring supervisor escalation
MAX_RECOLLECTION_ATTEMPTS = 3


class RecollectionError(Exception):
    """Custom exception for recollection errors"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def reject_sample_for_recollection(
    db: Session,
    sample: Sample,
    rejection_reason: str,
    rejected_by: int,
    rejection_reasons: list[str] | None = None
) -> None:
    """
    Reject a sample and mark it for recollection.
    
    Args:
        db: Database session
        sample: The sample to reject
        rejection_reason: Text description of rejection reason
        rejected_by: User ID who is rejecting
        rejection_reasons: List of rejection reason codes (defaults to ["other"])
    """
    if rejection_reasons is None:
        rejection_reasons = ["other"]
    
    # Create sample rejection record
    sample_rejection_record = {
        "rejectedAt": datetime.now(timezone.utc).isoformat(),
        "rejectedBy": str(rejected_by),  # Convert to string as per schema requirement
        "rejectionReasons": rejection_reasons,
        "rejectionNotes": rejection_reason,
        "recollectionRequired": True
    }
    
    # Initialize rejection history if needed
    if sample.rejectionHistory is None:
        sample.rejectionHistory = []
    sample.rejectionHistory.append(sample_rejection_record)
    flag_modified(sample, 'rejectionHistory')
    
    # Update sample status to rejected
    sample.status = SampleStatus.REJECTED
    sample.rejectedAt = datetime.now(timezone.utc)
    sample.rejectedBy = str(rejected_by)  # Convert to string as per schema requirement
    sample.rejectionReasons = rejection_reasons
    sample.rejectionNotes = rejection_reason
    sample.recollectionRequired = True
    sample.updatedBy = str(rejected_by)  # Convert to string as per model requirement


def create_recollection_sample(
    db: Session,
    original_sample: Sample,
    recollection_reason: str,
    created_by: int,
    update_order_tests: bool = True
) -> Sample:
    """
    Create a new recollection sample from a rejected sample.
    
    Args:
        db: Database session
        original_sample: The rejected sample to create recollection for
        recollection_reason: Reason for recollection
        created_by: User ID creating the recollection
        update_order_tests: Whether to update order tests to point to new sample
        
    Returns:
        The newly created recollection sample
        
    Raises:
        RecollectionError: If sample cannot be recollected
    """
    # Validate sample state
    if original_sample.status != SampleStatus.REJECTED:
        raise RecollectionError("Only rejected samples can be recollected")
    
    if original_sample.recollectionSampleId:
        raise RecollectionError(
            f"Recollection already requested. New sample: {original_sample.recollectionSampleId}"
        )
    
    # Check recollection limit
    rejection_count = len(original_sample.rejectionHistory or [])
    if rejection_count >= MAX_RECOLLECTION_ATTEMPTS:
        raise RecollectionError(
            f"Maximum recollection attempts ({MAX_RECOLLECTION_ATTEMPTS}) reached. Please escalate to supervisor."
        )
    
    # Calculate recollection attempt number
    recollection_attempt = len(original_sample.rejectionHistory or []) + 1

    # Create new sample inheriting from original (ID is auto-generated)
    new_sample = Sample(
        orderId=original_sample.orderId,
        sampleType=original_sample.sampleType,
        status=SampleStatus.PENDING,
        testCodes=original_sample.testCodes,
        requiredVolume=original_sample.requiredVolume,
        priority=PriorityLevel.URGENT,  # Escalate priority for recollections
        requiredContainerTypes=original_sample.requiredContainerTypes,
        requiredContainerColors=original_sample.requiredContainerColors,
        
        # Recollection tracking
        isRecollection=True,
        originalSampleId=original_sample.sampleId,
        recollectionReason=recollection_reason,
        recollectionAttempt=recollection_attempt,
        
        # Copy rejection history from original sample
        rejectionHistory=original_sample.rejectionHistory or [],
        
        # Metadata
        createdAt=datetime.now(timezone.utc),
        createdBy=str(created_by),  # Convert to string as per model requirement
        updatedBy=str(created_by)  # Convert to string as per model requirement
    )
    
    # Add new sample to database
    db.add(new_sample)
    db.flush()  # Get auto-generated sampleId

    # Link original sample to new recollection sample
    original_sample.recollectionSampleId = new_sample.sampleId
    original_sample.updatedBy = str(created_by)  # Convert to string as per model requirement

    # Update order tests to point to new sample if requested
    # IMPORTANT: Exclude SUPERSEDED tests - these were replaced by retests and should
    # not be revived. Only update active tests that need the new sample.
    if update_order_tests:
        order_tests = db.query(OrderTest).filter(
            OrderTest.orderId == original_sample.orderId,
            OrderTest.testCode.in_(original_sample.testCodes),
            OrderTest.status != TestStatus.SUPERSEDED  # Don't revive superseded tests
        ).all()
        
        for test in order_tests:
            test.status = TestStatus.PENDING
            test.sampleId = new_sample.sampleId
            test.results = None  # Clear previous results for re-testing
            test.resultEnteredAt = None
            test.enteredBy = None
            test.technicianNotes = None
            # Clear validation metadata so test can be validated again after new results
            test.resultValidatedAt = None
            test.validatedBy = None
            test.validationNotes = None
    
    return new_sample


def reject_and_request_recollection(
    db: Session,
    sample: Sample,
    rejection_reason: str,
    user_id: int,
    rejection_reasons: list[str] | None = None,
    update_order_tests: bool = True
) -> Sample:
    """
    Combined operation: Reject a sample and immediately create a recollection sample.
    
    This is the main entry point for the "re-collect" flow from result validation.
    
    Args:
        db: Database session
        sample: The sample to reject
        rejection_reason: Text description of rejection reason
        user_id: User ID performing the operation
        rejection_reasons: List of rejection reason codes (defaults to ["other"])
        update_order_tests: Whether to update order tests to point to new sample
        
    Returns:
        The newly created recollection sample
    """
    # Step 1: Reject the sample
    reject_sample_for_recollection(
        db=db,
        sample=sample,
        rejection_reason=rejection_reason,
        rejected_by=user_id,
        rejection_reasons=rejection_reasons
    )
    
    # Step 2: Create recollection sample
    new_sample = create_recollection_sample(
        db=db,
        original_sample=sample,
        recollection_reason=rejection_reason,
        created_by=user_id,
        update_order_tests=update_order_tests
    )
    
    # Step 3: Commit and refresh
    db.commit()
    db.refresh(new_sample)
    
    # Step 4: Update order status
    update_order_status(db, sample.orderId)
    
    return new_sample

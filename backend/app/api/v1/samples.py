"""
Sample API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.core.dependencies import get_current_user, require_lab_tech
from app.models.user import User
from app.models.sample import Sample
from app.models.order import Order, OrderTest
from app.schemas.sample import SampleResponse, SampleCollectRequest, SampleRejectRequest, RecollectionRequest
from app.schemas.enums import SampleStatus, TestStatus, UserRole
from app.services.order_status_updater import update_order_status
from app.services.sample_recollection import (
    create_recollection_sample,
    RecollectionError,
    MAX_RECOLLECTION_ATTEMPTS
)

router = APIRouter()


@router.get("/samples", response_model=List[SampleResponse])
def get_samples(
    orderId: str | None = None,
    sampleStatus: SampleStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all samples with optional filters.
    
    Role-based filtering:
    - Admin/Receptionist: All samples
    - Lab Tech: Only samples they need to process (pending/collected)
    - Validator: Only samples with completed results to validate
    """
    query = db.query(Sample)

    # Role-based filtering
    if current_user.role == UserRole.LAB_TECH:
        # Lab techs only see pending/collected samples
        query = query.filter(
            Sample.status.in_([SampleStatus.PENDING, SampleStatus.COLLECTED])
        )
    elif current_user.role == UserRole.VALIDATOR:
        # Validators only see samples with completed tests
        query = query.join(Order).join(OrderTest).filter(
            OrderTest.status == TestStatus.COMPLETED
        ).distinct()
    # Admin and Receptionist see all samples

    if orderId:
        query = query.filter(Sample.orderId == orderId)

    if sampleStatus:
        query = query.filter(Sample.status == sampleStatus)

    query = query.order_by(Sample.createdAt.desc())
    samples = query.offset(skip).limit(limit).all()
    return samples


@router.get("/samples/pending", response_model=List[SampleResponse])
def get_pending_samples(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Get all pending sample collections
    """
    samples = db.query(Sample).filter(Sample.status == SampleStatus.PENDING).all()
    return samples


@router.get("/samples/{sampleId}", response_model=SampleResponse)
def get_sample(
    sampleId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get sample by ID
    """
    sample = db.query(Sample).filter(Sample.sampleId == sampleId).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sampleId} not found"
        )
    return sample


@router.patch("/samples/{sampleId}/collect", response_model=SampleResponse)
def collect_sample(
    sampleId: str,
    collect_data: SampleCollectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Mark sample as collected
    """
    sample = db.query(Sample).filter(Sample.sampleId == sampleId).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sampleId} not found"
        )

    if sample.status != SampleStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sample {sampleId} is not pending collection"
        )

    # Update sample
    sample.status = SampleStatus.COLLECTED
    sample.collectedAt = datetime.now(timezone.utc)
    sample.collectedBy = current_user.id
    sample.collectedVolume = collect_data.collectedVolume
    sample.actualContainerType = collect_data.actualContainerType
    sample.actualContainerColor = collect_data.actualContainerColor
    sample.collectionNotes = collect_data.collectionNotes
    sample.remainingVolume = collect_data.collectedVolume
    sample.updatedBy = current_user.id

    # Update associated order tests
    order_tests = db.query(OrderTest).filter(
        OrderTest.orderId == sample.orderId,
        OrderTest.testCode.in_(sample.testCodes)
    ).all()

    for order_test in order_tests:
        order_test.status = TestStatus.SAMPLE_COLLECTED
        order_test.sampleId = sampleId

    db.commit()
    db.refresh(sample)
    
    # Update order status
    update_order_status(db, sample.orderId)

    return sample


@router.patch("/samples/{sampleId}/reject", response_model=SampleResponse)
def reject_sample(
    sampleId: str,
    reject_data: SampleRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Reject a sample and append to rejection history
    """
    sample = db.query(Sample).filter(Sample.sampleId == sampleId).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sampleId} not found"
        )

    if sample.status != SampleStatus.COLLECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sample {sampleId} must be collected before rejection"
        )

    # Create rejection record for history
    rejection_record = {
        "rejectedAt": datetime.now(timezone.utc).isoformat(),
        "rejectedBy": current_user.id,
        "rejectionReasons": [r.value for r in reject_data.rejectionReasons],
        "rejectionNotes": reject_data.rejectionNotes,
        "recollectionRequired": reject_data.recollectionRequired
    }
    
    # Append to rejection history
    if sample.rejectionHistory is None:
        sample.rejectionHistory = []
    sample.rejectionHistory.append(rejection_record)
    
    # Mark the field as modified so SQLAlchemy persists the change
    flag_modified(sample, 'rejectionHistory')
    
    # Update single rejection fields (most recent)
    sample.status = SampleStatus.REJECTED
    sample.rejectedAt = datetime.now(timezone.utc)
    sample.rejectedBy = current_user.id
    sample.rejectionReasons = [r.value for r in reject_data.rejectionReasons]
    sample.rejectionNotes = reject_data.rejectionNotes
    sample.recollectionRequired = reject_data.recollectionRequired
    sample.updatedBy = current_user.id

    # Update associated order tests
    order_tests = db.query(OrderTest).filter(
        OrderTest.orderId == sample.orderId,
        OrderTest.testCode.in_(sample.testCodes)
    ).all()

    for order_test in order_tests:
        order_test.status = TestStatus.REJECTED

    db.commit()
    db.refresh(sample)
    
    # Update order status
    update_order_status(db, sample.orderId)

    return sample


@router.post("/samples/{sampleId}/request-recollection", response_model=SampleResponse)
def request_recollection(
    sampleId: str,
    recollection_data: RecollectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Request recollection for a rejected sample.
    Uses the shared sample_recollection service.
    
    - Creates a NEW sample with a new ID
    - Links new sample to original via originalSampleId
    - Sets recollectionSampleId on the rejected sample
    - Preserves rejection history in the new sample
    - Escalates priority to URGENT
    """
    original_sample = db.query(Sample).filter(Sample.sampleId == sampleId).first()
    if not original_sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sampleId} not found"
        )
    
    try:
        # Use the shared recollection service
        new_sample = create_recollection_sample(
            db=db,
            original_sample=original_sample,
            recollection_reason=recollection_data.reason,
            created_by=current_user.id,
            update_order_tests=True
        )
        
        db.commit()
        db.refresh(new_sample)
        
        # Update order status
        update_order_status(db, original_sample.orderId)
        
        return new_sample
        
    except RecollectionError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

"""
Sample API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.dependencies import get_current_user, require_lab_tech
from app.models.user import User
from app.models.sample import Sample
from app.models.order import OrderTest
from app.schemas.sample import SampleResponse, SampleCollectRequest, SampleRejectRequest, RecollectionRequest
from app.schemas.enums import SampleStatus, TestStatus, PriorityLevel
from app.services.id_generator import generate_id
from app.services.order_status_updater import update_order_status

router = APIRouter()


@router.get("/samples", response_model=List[SampleResponse])
def get_samples(
    orderId: str | None = None,
    status: SampleStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all samples with optional filters
    """
    query = db.query(Sample)

    if orderId:
        query = query.filter(Sample.orderId == orderId)

    if status:
        query = query.filter(Sample.status == status)

    samples = query.offset(skip).limit(limit).all()
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
    sample.collectedAt = datetime.utcnow()
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
    Reject a sample
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

    # Update sample
    sample.status = SampleStatus.REJECTED
    sample.rejectedAt = datetime.utcnow()
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
    Request recollection for a rejected sample
    - Creates new PENDING sample
    - Links to original rejected sample
    - Resets order tests to PENDING
    - Escalates priority to URGENT
    """
    original = db.query(Sample).filter(Sample.sampleId == sampleId).first()
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sampleId} not found"
        )
    
    if original.status != SampleStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only rejected samples can be recollected"
        )
    
    # Create new sample (clone of original)
    new_sample = Sample(
        sampleId=generate_id("sample", db),
        orderId=original.orderId,
        sampleType=original.sampleType,
        status=SampleStatus.PENDING,
        testCodes=original.testCodes,
        requiredVolume=original.requiredVolume,
        priority=PriorityLevel.URGENT,  # Escalate priority
        requiredContainerTypes=original.requiredContainerTypes,
        requiredContainerColors=original.requiredContainerColors,
        isRecollection=True,
        originalSampleId=sampleId,
        recollectionReason=recollection_data.reason,
        recollectionAttempt=(original.recollectionAttempt or 1) + 1,
        createdBy=current_user.id,
        updatedBy=current_user.id,
    )
    
    # Update original
    original.recollectionSampleId = new_sample.sampleId
    
    # Reset order tests
    order_tests = db.query(OrderTest).filter(
        OrderTest.orderId == original.orderId,
        OrderTest.testCode.in_(original.testCodes)
    ).all()
    
    for test in order_tests:
        test.status = TestStatus.PENDING
        test.sampleId = None
    
    db.add(new_sample)
    db.commit()
    db.refresh(new_sample)
    
    # Update order status
    update_order_status(db, original.orderId)
    
    return new_sample

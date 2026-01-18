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
from app.schemas.sample import SampleResponse, SampleCollectRequest, SampleRejectRequest
from app.schemas.enums import SampleStatus, TestStatus

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

    return sample

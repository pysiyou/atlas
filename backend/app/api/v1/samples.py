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
    order_id: str | None = None,
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
    
    if order_id:
        query = query.filter(Sample.order_id == order_id)
    
    if status:
        query = query.filter(Sample.status == status)
    
    samples = query.offset(skip).limit(limit).all()
    return samples


@router.get("/samples/{sample_id}", response_model=SampleResponse)
def get_sample(
    sample_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get sample by ID
    """
    sample = db.query(Sample).filter(Sample.sample_id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
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


@router.patch("/samples/{sample_id}/collect", response_model=SampleResponse)
def collect_sample(
    sample_id: str,
    collect_data: SampleCollectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Mark sample as collected
    """
    sample = db.query(Sample).filter(Sample.sample_id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )
    
    if sample.status != SampleStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sample {sample_id} is not pending collection"
        )
    
    # Update sample
    sample.status = SampleStatus.COLLECTED
    sample.collected_at = datetime.utcnow()
    sample.collected_by = current_user.id
    sample.collected_volume = collect_data.collectedVolume
    sample.actual_container_type = collect_data.actualContainerType
    sample.actual_container_color = collect_data.actualContainerColor
    sample.collection_notes = collect_data.collectionNotes
    sample.remaining_volume = collect_data.collectedVolume
    sample.updated_by = current_user.id
    
    # Update associated order tests
    order_tests = db.query(OrderTest).filter(
        OrderTest.order_id == sample.order_id,
        OrderTest.test_code.in_(sample.test_codes)
    ).all()
    
    for order_test in order_tests:
        order_test.status = TestStatus.SAMPLE_COLLECTED
        order_test.sample_id = sample_id
    
    db.commit()
    db.refresh(sample)
    
    return sample


@router.patch("/samples/{sample_id}/reject", response_model=SampleResponse)
def reject_sample(
    sample_id: str,
    reject_data: SampleRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Reject a sample
    """
    sample = db.query(Sample).filter(Sample.sample_id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )
    
    if sample.status != SampleStatus.COLLECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sample {sample_id} must be collected before rejection"
        )
    
    # Update sample
    sample.status = SampleStatus.REJECTED
    sample.rejected_at = datetime.utcnow()
    sample.rejected_by = current_user.id
    sample.rejection_reasons = [r.value for r in reject_data.rejectionReasons]
    sample.rejection_notes = reject_data.rejectionNotes
    sample.recollection_required = reject_data.recollectionRequired
    sample.updated_by = current_user.id
    
    # Update associated order tests
    order_tests = db.query(OrderTest).filter(
        OrderTest.order_id == sample.order_id,
        OrderTest.test_code.in_(sample.test_codes)
    ).all()
    
    for order_test in order_tests:
        order_test.status = TestStatus.REJECTED
    
    db.commit()
    db.refresh(sample)
    
    return sample

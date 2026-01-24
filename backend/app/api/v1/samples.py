"""
Sample API Routes

Uses the unified LabOperationsService for all operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database import get_db
from app.core.dependencies import get_current_user, require_lab_tech
from app.models.user import User
from app.models.sample import Sample
from app.models.order import Order, OrderTest
from app.schemas.sample import SampleResponse, SampleCollectRequest, SampleRejectRequest, RecollectionRequest
from app.schemas.enums import SampleStatus, TestStatus, UserRole, RejectionReason
from app.schemas.pagination import create_paginated_response, skip_to_page
from app.services.lab_operations import LabOperationsService, LabOperationError

router = APIRouter()


class RejectAndRecollectRequest(BaseModel):
    """Request body for combined reject and recollect operation"""
    rejectionReasons: List[RejectionReason] = Field(..., min_length=1, description="Rejection reasons")
    rejectionNotes: Optional[str] = Field(None, max_length=1000, description="Rejection notes")
    recollectionReason: Optional[str] = Field(None, max_length=1000, description="Reason for recollection")


class RejectAndRecollectResponse(BaseModel):
    """Response for combined reject and recollect operation"""
    rejectedSample: dict
    newSample: dict
    recollectionAttempt: int
    message: str

    class Config:
        from_attributes = True


@router.get("/samples")
def get_samples(
    orderId: Optional[int] = None,
    sampleStatus: Optional[SampleStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    paginated: bool = Query(False, description="Return paginated response with total count"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all samples with optional filters.

    Query params:
    - paginated: If true, returns {data: [...], pagination: {...}} format

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
            OrderTest.status == TestStatus.RESULTED
        ).distinct()
    # Admin and Receptionist see all samples

    if orderId:
        query = query.filter(Sample.orderId == orderId)

    if sampleStatus:
        query = query.filter(Sample.status == sampleStatus)

    query = query.order_by(Sample.createdAt.desc())

    # Get total count for pagination (before offset/limit)
    total = query.count() if paginated else 0

    samples = query.offset(skip).limit(limit).all()

    # Serialize samples using response model
    serialized_samples = [SampleResponse.model_validate(s).model_dump(mode="json") for s in samples]

    if paginated:
        page = skip_to_page(skip, limit)
        return create_paginated_response(serialized_samples, total, page, limit)

    return serialized_samples


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
    sampleId: int,
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
    sampleId: int,
    collect_data: SampleCollectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Mark sample as collected.
    Uses the LabOperationsService for state validation and audit logging.
    """
    try:
        service = LabOperationsService(db)
        sample = service.collect_sample(
            sample_id=sampleId,
            user_id=current_user.id,
            collected_volume=collect_data.collectedVolume,
            container_type=collect_data.actualContainerType.value,
            container_color=collect_data.actualContainerColor.value,
            collection_notes=collect_data.collectionNotes
        )
        return sample
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.patch("/samples/{sampleId}/reject", response_model=SampleResponse)
def reject_sample(
    sampleId: int,
    reject_data: SampleRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Reject a sample and append to rejection history.
    Uses the LabOperationsService for state validation and audit logging.
    """
    try:
        service = LabOperationsService(db)
        sample = service.reject_sample(
            sample_id=sampleId,
            user_id=current_user.id,
            rejection_reasons=[r.value for r in reject_data.rejectionReasons],
            rejection_notes=reject_data.rejectionNotes,
            recollection_required=reject_data.recollectionRequired
        )
        return sample
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/samples/{sampleId}/request-recollection", response_model=SampleResponse)
def request_recollection(
    sampleId: int,
    recollection_data: RecollectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Request recollection for a rejected sample.
    Uses the LabOperationsService for state validation and audit logging.

    - Creates a NEW sample with a new ID
    - Links new sample to original via originalSampleId
    - Sets recollectionSampleId on the rejected sample
    - Preserves rejection history in the new sample
    - Escalates priority to URGENT
    """
    try:
        service = LabOperationsService(db)
        new_sample = service.request_recollection(
            sample_id=sampleId,
            user_id=current_user.id,
            recollection_reason=recollection_data.reason,
            update_order_tests=True
        )
        return new_sample
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/samples/{sampleId}/reject-and-recollect", response_model=RejectAndRecollectResponse)
def reject_and_recollect_sample(
    sampleId: int,
    request_data: RejectAndRecollectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lab_tech)
):
    """
    Atomically reject a sample and request recollection.
    Combines two operations into one transaction.

    This is useful when you know immediately that a sample needs to be rejected
    and a new collection is required.

    - Rejects the current sample with provided reasons
    - Creates a new recollection sample in PENDING status
    - Links the two samples together
    - Updates order tests to point to the new sample
    - Escalates priority to URGENT
    """
    try:
        service = LabOperationsService(db)
        rejected_sample, new_sample = service.reject_and_recollect(
            sample_id=sampleId,
            user_id=current_user.id,
            rejection_reasons=[r.value for r in request_data.rejectionReasons],
            rejection_notes=request_data.rejectionNotes,
            recollection_reason=request_data.recollectionReason
        )

        return RejectAndRecollectResponse(
            rejectedSample={
                "sampleId": rejected_sample.sampleId,
                "status": rejected_sample.status.value,
                "rejectedAt": rejected_sample.rejectedAt.isoformat() if rejected_sample.rejectedAt else None,
                "recollectionSampleId": rejected_sample.recollectionSampleId
            },
            newSample={
                "sampleId": new_sample.sampleId,
                "status": new_sample.status.value,
                "priority": new_sample.priority.value,
                "isRecollection": new_sample.isRecollection,
                "originalSampleId": new_sample.originalSampleId,
                "recollectionAttempt": new_sample.recollectionAttempt
            },
            recollectionAttempt=new_sample.recollectionAttempt,
            message=f"Sample rejected and recollection requested successfully"
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

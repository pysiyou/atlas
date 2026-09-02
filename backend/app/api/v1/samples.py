"""
Sample API Routes
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.core.dependencies import get_current_user, require_sample_collector
from app.models.user import User
from app.models.sample import Sample
from app.schemas.sample import SampleResponse, SampleCollectRequest
from app.schemas.enums import SampleStatus
from app.schemas.pagination import create_paginated_response, skip_to_page
from app.api.deps import PaginationParams
from app.services.lab_operations import LabOperationsService, LabOperationError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/samples")
def get_samples(
    pagination: PaginationParams,
    orderId: Optional[int] = None,
    sampleStatus: Optional[SampleStatus] = None,
    paginated: bool = Query(False, description="Return paginated response with total count"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all samples with optional filters."""
    skip, limit = pagination["skip"], pagination["limit"]
    query = db.query(Sample)

    if orderId:
        query = query.filter(Sample.orderId == orderId)
    if sampleStatus:
        query = query.filter(Sample.status == sampleStatus)

    query = query.order_by(Sample.updatedAt.desc())
    total = query.count() if paginated else 0
    samples = query.offset(skip).limit(limit).all()

    try:
        serialized_samples = [SampleResponse.model_validate(s).model_dump(mode="json") for s in samples]
    except Exception:
        logger.exception("Error serializing samples")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing sample data",
        )

    if paginated:
        page = skip_to_page(skip, limit)
        return create_paginated_response(serialized_samples, total, page, limit)
    return serialized_samples


@router.get("/samples/pending", response_model=List[SampleResponse])
def get_pending_samples(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all pending sample collections."""
    samples = (
        db.query(Sample)
        .filter(Sample.status == SampleStatus.PENDING)
        .order_by(Sample.updatedAt.desc())
        .all()
    )
    return samples


@router.get("/samples/{sampleId}", response_model=SampleResponse)
def get_sample(
    sampleId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get sample by ID."""
    sample = db.query(Sample).filter(Sample.sampleId == sampleId).first()
    if not sample:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Sample {sampleId} not found")
    return sample


@router.patch("/samples/{sampleId}/collect", response_model=SampleResponse)
def collect_sample(
    sampleId: int,
    collect_data: SampleCollectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sample_collector),
):
    """Mark sample as collected."""
    try:
        service = LabOperationsService(db)
        return service.collect_sample(
            sample_id=sampleId,
            user_id=current_user.id,
            collected_volume=collect_data.collectedVolume,
            container_type=collect_data.actualContainerType.value,
            container_color=collect_data.actualContainerColor.value,
            collection_notes=collect_data.collectionNotes,
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

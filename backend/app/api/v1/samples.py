"""Sample API Routes"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import PaginationParams
from app.core.dependencies import get_current_user, require_sample_collector
from app.database import get_db
from app.models.user import User
from app.schemas.enums import SampleStatus
from app.schemas.sample import SampleCollectRequest, SampleResponse
from app.services.lab.samples import SampleService
from app.services.lab.workflow import LabOperationsService, LabOperationError

router = APIRouter()


@router.get("/samples")
def get_samples(
    pagination: PaginationParams,
    orderId: Optional[int] = None,
    sampleStatus: Optional[SampleStatus] = None,
    paginated: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SampleService(db).list_samples(
        pagination["skip"], pagination["limit"], orderId, sampleStatus, paginated
    )


@router.get("/samples/pending", response_model=List[SampleResponse])
def get_pending_samples(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SampleService(db).list_pending()


@router.get("/samples/{sampleId}", response_model=SampleResponse)
def get_sample(
    sampleId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SampleService(db).get_by_id(sampleId)


@router.patch("/samples/{sampleId}/collect", response_model=SampleResponse)
def collect_sample(
    sampleId: int,
    collect_data: SampleCollectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sample_collector),
):
    try:
        return LabOperationsService(db).collect_sample(
            sample_id=sampleId,
            user_id=current_user.id,
            collected_volume=collect_data.collectedVolume,
            container_type=collect_data.actualContainerType.value,
            container_color=collect_data.actualContainerColor.value,
            collection_notes=collect_data.collectionNotes,
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

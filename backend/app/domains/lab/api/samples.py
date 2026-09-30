"""Lab sample routes."""

from app.domains.lab.models.sample import Sample
from app.domains.lab.schemas.sample import SampleCollectRequest, SampleResponse
from app.domains.lab.specimen import SpecimenQueryService
from app.domains.lab.workflow.service import LabOperationsService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import (
    PaginationParams,
    get_current_user,
    require_sample_collector,
)
from app.shared.contracts.enums import SampleStatus
from app.shared.schemas.pagination import PaginatedResponse
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter()


def _sample_response(db: Session, sample: Sample) -> SampleResponse:
    data = SampleResponse.model_validate(sample).model_dump()
    if sample.originalSampleId:
        parent = db.query(Sample).filter(Sample.sampleId == sample.originalSampleId).first()
        if parent and parent.collectedAt:
            data["originalSampleCollectedAt"] = parent.collectedAt
    return SampleResponse(**data)


@router.get(
    "/samples",
    response_model=list[SampleResponse] | PaginatedResponse[SampleResponse],
)
def get_samples(
    pagination: PaginationParams,
    orderId: int | None = None,
    sampleStatus: SampleStatus | None = None,
    paginated: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SpecimenQueryService(db).list_samples(
        pagination["skip"], pagination["limit"], orderId, sampleStatus, paginated
    )


@router.get("/samples/pending", response_model=list[SampleResponse])
def get_pending_samples(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SpecimenQueryService(db).list_pending()


@router.get("/samples/{sampleId}", response_model=SampleResponse)
def get_sample(
    sampleId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sample = SpecimenQueryService(db).get_by_id(sampleId)
    return _sample_response(db, sample)


@router.patch("/samples/{sampleId}/collect", response_model=SampleResponse)
def collect_sample(
    sampleId: int,
    collect_data: SampleCollectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sample_collector),
):
    return LabOperationsService(db).collect_sample(
        sample_id=sampleId,
        user_id=current_user.id,
        collected_volume=collect_data.collectedVolume,
        container_type=collect_data.actualContainerType.value,
        container_color=collect_data.actualContainerColor.value,
        collection_notes=collect_data.collectionNotes,
    )

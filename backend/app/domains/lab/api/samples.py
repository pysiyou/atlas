"""Lab sample routes."""

from app.domains.lab.models.sample import Sample
from app.domains.lab.monitor.worklist_service import LabWorklistService
from app.domains.lab.schemas.sample import SampleCollectRequest, SampleResponse
from app.domains.lab.schemas.worklists import CollectionWorklistItem
from app.domains.lab.deps import (
    get_lab_operations_service,
    get_lab_worklist_service,
    get_specimen_query_service,
)
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
    specimen: SpecimenQueryService = Depends(get_specimen_query_service),
    current_user: User = Depends(get_current_user),
):
    return specimen.list_samples(
        pagination["skip"], pagination["limit"], orderId, sampleStatus, paginated
    )


@router.get("/samples/pending", response_model=list[SampleResponse])
def get_pending_samples(
    specimen: SpecimenQueryService = Depends(get_specimen_query_service),
    current_user: User = Depends(get_current_user),
):
    return specimen.list_pending()


@router.get("/samples/{sampleId}/work-context", response_model=CollectionWorklistItem)
def get_sample_work_context(
    sampleId: int,
    worklist: LabWorklistService = Depends(get_lab_worklist_service),
    current_user: User = Depends(get_current_user),
):
    """Collection eligibility and display fields for a sample deep-link or modal."""
    return worklist.get_sample_work_context(sampleId)


@router.get("/samples/{sampleId}", response_model=SampleResponse)
def get_sample(
    sampleId: int,
    db: Session = Depends(get_db),
    specimen: SpecimenQueryService = Depends(get_specimen_query_service),
    current_user: User = Depends(get_current_user),
):
    sample = specimen.get_by_id(sampleId)
    return _sample_response(db, sample)


@router.patch("/samples/{sampleId}/collect", response_model=SampleResponse)
def collect_sample(
    sampleId: int,
    collect_data: SampleCollectRequest,
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(require_sample_collector),
):
    return service.collect_sample(
        sample_id=sampleId,
        user_id=current_user.id,
        collected_volume=collect_data.collectedVolume,
        container_type=collect_data.actualContainerType.value,
        container_color=collect_data.actualContainerColor.value,
        collection_notes=collect_data.collectionNotes,
    )

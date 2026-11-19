"""Lab sample routes."""

from __future__ import annotations

from app.domains.audit.emitter import AuditEmitter
from app.domains.lab.deps import (
    get_lab_operations_service,
    get_lab_worklist_service,
    get_specimen_query_service,
)
from app.domains.lab.monitor.schemas import CollectionWorklistItem
from app.domains.lab.monitor.worklists import LabWorklistService
from app.domains.lab.specimen.aliquots import create_aliquots
from app.domains.lab.specimen.models import Sample
from app.domains.lab.specimen.queries import SpecimenQueryService
from app.domains.lab.specimen.schemas import (
    SampleAliquotCreateRequest,
    SampleCollectRequest,
    SampleReceiveRequest,
    SampleResponse,
)
from app.domains.lab.workflow.operations import LabOperationsService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http import (
    PaginationParams,
    get_current_user,
    require_sample_collector,
)
from app.shared.generated.enums import SampleStatus
from app.shared.api import OrderIdQuery, PaginatedResponse, SampleIdPath
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter()


def _sample_response(db: Session, sample: Sample) -> SampleResponse:
    """Serialize a sample and attach parent collection time for recollection lineage."""
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
    orderId: OrderIdQuery = None,
    sampleStatus: SampleStatus | None = None,
    paginated: bool = Query(False),
    specimen: SpecimenQueryService = Depends(get_specimen_query_service),
    current_user: User = Depends(get_current_user),
):
    return specimen.list_samples(
        pagination["skip"], pagination["limit"], orderId, sampleStatus, paginated
    )


@router.get("/samples/{sampleId}/work-context", response_model=CollectionWorklistItem)
def get_sample_work_context(
    sampleId: SampleIdPath,
    worklist: LabWorklistService = Depends(get_lab_worklist_service),
    current_user: User = Depends(get_current_user),
):
    """Collection eligibility and display fields for a sample deep-link or modal."""
    return worklist.get_sample_work_context(sampleId)


@router.get("/samples/{sampleId}", response_model=SampleResponse)
def get_sample(
    sampleId: SampleIdPath,
    db: Session = Depends(get_db),
    specimen: SpecimenQueryService = Depends(get_specimen_query_service),
    current_user: User = Depends(get_current_user),
):
    sample = specimen.get_by_id(sampleId)
    return _sample_response(db, sample)


@router.patch("/samples/{sampleId}/collect", response_model=SampleResponse)
def collect_sample(
    sampleId: SampleIdPath,
    collect_data: SampleCollectRequest,
    db: Session = Depends(get_db),
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(require_sample_collector),
):
    sample = service.collect_sample(
        sample_id=sampleId,
        user_id=current_user.id,
        collected_volume=collect_data.collectedVolume,
        container_type=collect_data.actualContainerType.value,
        container_color=collect_data.actualContainerColor.value,
        collection_notes=collect_data.collectionNotes,
    )
    return _sample_response(db, sample)


@router.patch("/samples/{sampleId}/receive", response_model=SampleResponse)
def receive_sample(
    sampleId: SampleIdPath,
    receive_data: SampleReceiveRequest,
    db: Session = Depends(get_db),
    service: LabOperationsService = Depends(get_lab_operations_service),
    current_user: User = Depends(get_current_user),
):
    sample = service.receive_sample(
        sample_id=sampleId,
        user_id=current_user.id,
        received_volume_ml=receive_data.receivedVolumeMl,
        notes=receive_data.notes,
    )
    return _sample_response(db, sample)


@router.post("/samples/{sampleId}/aliquots", response_model=list[SampleResponse])
def create_sample_aliquots(
    sampleId: SampleIdPath,
    payload: SampleAliquotCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sample_collector),
):
    """Create child aliquot tubes from a collected parent sample."""
    children = create_aliquots(
        db,
        parent_id=sampleId,
        count=payload.count,
        aliquot_volume=payload.aliquotVolume,
        test_codes=payload.testCodes,
        user_id=current_user.id,
        emitter=AuditEmitter(db),
    )
    db.commit()
    return [_sample_response(db, child) for child in children]

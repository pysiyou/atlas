"""Audit API Endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.audit import (
    AuditLogsCountResponse,
    EntityTimelineResponse,
    LabOperationLogResponse,
    TimelineEventResponse,
)
from app.schemas.enums import LabOperationType
from app.services.audit.query import AuditQueryService
from app.services.timeline.service import EntityTimelineService
from app.utils.exceptions import LabOperationError

router = APIRouter()


@router.get("/audit/logs", response_model=list[LabOperationLogResponse])
async def get_lab_operation_logs(
    limit: int = Query(default=10000, le=10000, ge=1),
    offset: int = Query(default=0, ge=0),
    operation_type: Optional[LabOperationType] = Query(default=None),
    entity_type: Optional[str] = Query(default=None),
    hours_back: Optional[int] = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
) -> list[LabOperationLogResponse]:
    return AuditQueryService(db).list_logs(limit, offset, operation_type, entity_type, hours_back)


@router.get("/audit/logs/count", response_model=AuditLogsCountResponse)
async def get_lab_operation_logs_count(
    operation_type: Optional[LabOperationType] = Query(default=None),
    entity_type: Optional[str] = Query(default=None),
    hours_back: Optional[int] = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
) -> AuditLogsCountResponse:
    count = AuditQueryService(db).count_logs(operation_type, entity_type, hours_back)
    return AuditLogsCountResponse(count=count)


@router.get(
    "/audit/entities/{entityType}/{entityId}/timeline",
    response_model=EntityTimelineResponse,
)
async def get_entity_timeline(
    entityType: str,
    entityId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EntityTimelineResponse:
    try:
        events, total = EntityTimelineService(db).get_timeline(entityType, entityId)
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return EntityTimelineResponse(
        events=[TimelineEventResponse(**event) for event in events],
        total=total,
    )

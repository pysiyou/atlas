"""
Audit API Endpoints
Provides access to lab operation logs for activity timeline display.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.lab_audit import LabOperationLog
from app.models.user import User
from app.schemas.enums import LabOperationType
from app.services.entity_timeline_service import EntityTimelineService
from app.utils.exceptions import LabOperationError

router = APIRouter()


class LabOperationLogResponse(BaseModel):
    """Response schema for lab operation log entry"""
    id: int
    operationType: str
    entityType: str
    entityId: int
    performedBy: str
    performedByName: Optional[str] = None
    performedAt: datetime
    beforeState: Optional[dict] = None
    afterState: Optional[dict] = None
    operationData: Optional[dict] = None
    comment: Optional[str] = None

    class Config:
        from_attributes = True


def get_user_names(db: Session, user_ids: list[str]) -> dict[str, str]:
    """Fetch user names for a list of user IDs"""
    if not user_ids:
        return {}

    # Convert string IDs to integers, filtering out non-numeric
    int_ids = []
    for uid in user_ids:
        try:
            int_ids.append(int(uid))
        except (ValueError, TypeError):
            pass

    if not int_ids:
        return {}

    users = db.query(User.id, User.name).filter(User.id.in_(int_ids)).all()
    return {str(u.id): u.name for u in users}


@router.get("/audit/logs", response_model=list[LabOperationLogResponse])
async def get_lab_operation_logs(
    limit: int = Query(default=10000, le=10000, ge=1),
    offset: int = Query(default=0, ge=0),
    operation_type: Optional[LabOperationType] = Query(default=None),
    entity_type: Optional[str] = Query(default=None),
    hours_back: Optional[int] = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db)
) -> list[LabOperationLogResponse]:
    """
    Get recent lab operation logs for the activity timeline.

    Args:
        limit: Maximum number of records to return (default 10000, max 10000)
        offset: Number of records to skip for pagination
        operation_type: Filter by specific operation type
        entity_type: Filter by entity type ('sample', 'test', 'order')
        hours_back: How many hours back to fetch logs (default 24, max 168/1 week)

    Returns:
        List of lab operation log entries ordered by performedAt desc
    """
    query = db.query(LabOperationLog)

    # Time filter
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
    query = query.filter(LabOperationLog.performedAt >= cutoff)

    # Optional filters
    if operation_type:
        query = query.filter(LabOperationLog.operationType == operation_type)
    if entity_type:
        query = query.filter(LabOperationLog.entityType == entity_type)

    # Order by most recent first and apply pagination
    logs = query.order_by(desc(LabOperationLog.performedAt)).offset(offset).limit(limit).all()

    # Fetch user names in batch
    user_ids = list(set(log.performedBy for log in logs if log.performedBy))
    user_names = get_user_names(db, user_ids)

    return [
        LabOperationLogResponse(
            id=log.id,
            operationType=log.operationType.value if log.operationType else None,
            entityType=log.entityType,
            entityId=log.entityId,
            performedBy=log.performedBy,
            performedByName=user_names.get(log.performedBy),
            performedAt=log.performedAt,
            beforeState=log.beforeState,
            afterState=log.afterState,
            operationData=log.operationData,
            comment=log.comment
        )
        for log in logs
    ]


class AuditLogsCountResponse(BaseModel):
    """Response for total count of logs in the same filter window (for Load more)."""
    count: int


@router.get("/audit/logs/count", response_model=AuditLogsCountResponse)
async def get_lab_operation_logs_count(
    operation_type: Optional[LabOperationType] = Query(default=None),
    entity_type: Optional[str] = Query(default=None),
    hours_back: Optional[int] = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db)
) -> AuditLogsCountResponse:
    """
    Return total count of lab operation logs in the time window with same filters as GET /audit/logs.
    Used by the client to show "Load more" when total > fetched.
    """
    query = db.query(func.count(LabOperationLog.id)).filter(
        LabOperationLog.performedAt >= (datetime.now(timezone.utc) - timedelta(hours=hours_back))
    )
    if operation_type:
        query = query.filter(LabOperationLog.operationType == operation_type)
    if entity_type:
        query = query.filter(LabOperationLog.entityType == entity_type)
    total = query.scalar() or 0
    return AuditLogsCountResponse(count=total)


class TimelineEventResponse(BaseModel):
    id: int
    type: str
    phase: Optional[str] = None
    tone: Optional[str] = None
    entityType: str
    entityId: int
    timestamp: str
    performedBy: str
    performedByName: Optional[str] = None
    metadata: dict
    beforeState: Optional[dict] = None
    afterState: Optional[dict] = None
    comment: Optional[str] = None


class EntityTimelineResponse(BaseModel):
    events: list[TimelineEventResponse]
    total: int


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
    """
    Full operation timeline for a sample or order test, including related chain objects.
    """
    try:
        service = EntityTimelineService(db)
        events, total = service.get_timeline(entityType, entityId)
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return EntityTimelineResponse(
        events=[TimelineEventResponse(**event) for event in events],
        total=total,
    )

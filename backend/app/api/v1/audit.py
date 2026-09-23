"""Audit API Endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.audit import AuditLogsCountResponse, LabOperationLogResponse
from app.schemas.enums import LabOperationType
from app.services.audit.query import AuditQueryService

router = APIRouter()


@router.get("/audit/logs", response_model=list[LabOperationLogResponse])
async def get_lab_operation_logs(
    limit: int = Query(default=10000, le=10000, ge=1),
    offset: int = Query(default=0, ge=0),
    operation_type: LabOperationType | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    hours_back: int | None = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[LabOperationLogResponse]:
    return AuditQueryService(db).list_logs(limit, offset, operation_type, entity_type, hours_back)


@router.get("/audit/logs/count", response_model=AuditLogsCountResponse)
async def get_lab_operation_logs_count(
    operation_type: LabOperationType | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    hours_back: int | None = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuditLogsCountResponse:
    count = AuditQueryService(db).count_logs(operation_type, entity_type, hours_back)
    return AuditLogsCountResponse(count=count)

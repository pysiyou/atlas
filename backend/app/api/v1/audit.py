"""Audit event log read API."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.audit import AuditEventResponse
from app.services.audit import AuditEventQueryService

router = APIRouter(tags=["audit"])


@router.get("/audit/events", response_model=list[AuditEventResponse])
def list_audit_events(
    order_id: int | None = Query(None, alias="orderId"),
    patient_id: int | None = Query(None, alias="patientId"),
    target_type: str | None = Query(None, alias="targetType", max_length=50),
    target_id: int | None = Query(None, alias="targetId"),
    hours: float | None = Query(
        None,
        gt=0,
        le=24 * 365,
        description="Return events created within the last N hours (UTC)",
    ),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    service = AuditEventQueryService(db)
    if hours is not None:
        return service.list_recent(hours=hours, limit=limit)

    return service.list_events(
        order_id=order_id,
        patient_id=patient_id,
        target_type=target_type,
        target_id=target_id,
        limit=limit,
    )

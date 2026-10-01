"""Audit event log read API."""
from datetime import datetime

from app.domains.audit.categories import parse_categories_param
from app.domains.audit.schemas import AuditEventResponse
from app.domains.audit.service import AuditEventQueryService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(tags=["audit"])


@router.get("/audit/events", response_model=list[AuditEventResponse])
def list_audit_events(
    order_id: int | None = Query(None, alias="orderId"),
    patient_id: int | None = Query(None, alias="patientId"),
    target_type: str | None = Query(None, alias="targetType", max_length=50),
    target_id: int | None = Query(None, alias="targetId"),
    test_id: int | None = Query(None, alias="testId"),
    sample_id: int | None = Query(
        None,
        alias="sampleId",
        description="With targetType=order_test, also include sample-targeted lab events for this sample",
    ),
    hours: float | None = Query(
        None,
        gt=0,
        le=24 * 365,
        description="Return events created within the last N hours (UTC); ignored if createdFrom is set",
    ),
    created_from: datetime | None = Query(None, alias="createdFrom"),
    created_to: datetime | None = Query(None, alias="createdTo"),
    categories: str | None = Query(
        None,
        description="Comma-separated event category keys (domain or laboratory:subdomain)",
    ),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    service = AuditEventQueryService(db)
    category_keys = parse_categories_param(categories)
    return service.list_filtered(
        order_id=order_id,
        patient_id=patient_id,
        target_type=target_type,
        target_id=target_id,
        test_id=test_id,
        sample_id=sample_id,
        hours=hours,
        created_from=created_from,
        created_to=created_to,
        categories=category_keys or None,
        limit=limit,
    )

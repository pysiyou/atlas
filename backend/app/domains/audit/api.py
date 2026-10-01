"""Audit event log read API — fetch by containment scope, not category trees."""
from datetime import datetime
from typing import Literal

from app.domains.audit.kinds import parse_kinds_param
from app.domains.audit.schemas import AuditEventResponse
from app.domains.audit.service import AuditEventQueryService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(tags=["audit"])

EventLogScopeParam = Literal["order", "lab", "patient", "system", "stream"]


@router.get("/audit/events", response_model=list[AuditEventResponse])
def list_audit_events(
    scope: EventLogScopeParam = Query(
        "stream",
        description="Containment lens: order, lab, patient, system, or stream",
    ),
    order_id: int | None = Query(None, alias="orderId"),
    patient_id: int | None = Query(None, alias="patientId"),
    test_id: int | None = Query(None, alias="testId"),
    sample_id: int | None = Query(None, alias="sampleId"),
    hours: float | None = Query(
        None,
        gt=0,
        le=24 * 365,
        description="Return events created within the last N hours (UTC); ignored if createdFrom is set",
    ),
    created_from: datetime | None = Query(None, alias="createdFrom"),
    created_to: datetime | None = Query(None, alias="createdTo"),
    kinds: str | None = Query(
        None,
        description="Comma-separated kind keys: patient, order, laboratory, billing, reporting, system",
    ),
    include_access: bool = Query(
        False,
        alias="includeAccess",
        description="When false, omit read-only events such as patient.view",
    ),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    service = AuditEventQueryService(db)
    kind_keys = parse_kinds_param(kinds)
    return service.list_filtered(
        scope=scope,
        order_id=order_id,
        patient_id=patient_id,
        test_id=test_id,
        sample_id=sample_id,
        hours=hours,
        created_from=created_from,
        created_to=created_to,
        kinds=kind_keys or None,
        include_access=include_access,
        limit=limit,
    )

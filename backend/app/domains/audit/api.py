"""Audit event log read API — fetch by containment scope, not category trees."""
from datetime import datetime
from typing import Literal
from uuid import UUID

from app.domains.audit.kinds import STORED_EVENT_SCOPES, parse_kinds_param
from app.domains.audit.schemas import AuditEventResponse
from app.domains.audit.service import AuditEventQueryService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["audit"])

EventLogScopeParam = Literal["order", "lab", "patient", "system", "stream"]
StoredEventScopeParam = Literal["order", "lab", "patient", "system"]


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
        description=(
            "Comma-separated kind keys: patient, order, laboratory, billing, reporting, "
            "system, plus laboratory:sample|result|validation|escalation|quality|analyzer"
        ),
    ),
    include_access: bool = Query(
        False,
        alias="includeAccess",
        description="When false, omit read-only events such as patient.view",
    ),
    event_scope: StoredEventScopeParam | None = Query(
        None,
        alias="eventScope",
        description="Filter by stored event_scope column (order, lab, patient, system)",
    ),
    cursor_created_at: datetime | None = Query(
        None,
        alias="cursorCreatedAt",
        description="Newest-first cursor: createdAt of the last row from the previous page",
    ),
    cursor_event_id: UUID | None = Query(
        None,
        alias="cursorEventId",
        description="Newest-first cursor: eventId of the last row from the previous page",
    ),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    if event_scope is not None and event_scope not in STORED_EVENT_SCOPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="eventScope must be order, lab, patient, or system",
        )
    if (cursor_created_at is None) != (cursor_event_id is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="cursorCreatedAt and cursorEventId must be provided together",
        )
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
        event_scope=event_scope,
        cursor_created_at=cursor_created_at,
        cursor_event_id=cursor_event_id,
        limit=limit,
    )

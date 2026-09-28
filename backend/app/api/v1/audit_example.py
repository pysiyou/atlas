"""
Example: logging laboratory.sample.reject via EventLogger + BackgroundTasks.

Opt-in registration in main.py:
    from app.api.v1 import audit_example
    app.include_router(
        audit_example.router,
        prefix=settings.API_V1_PREFIX,
        tags=["audit-example"],
    )
"""
from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.audit import AuditEventCreate, EventChanges, EventContext, EventTarget, EventType
from app.services.audit.event_logger import EventLogger

router = APIRouter()


class SampleRejectAuditExampleBody(BaseModel):
    orderId: int
    patientId: int
    rejectionReason: str = Field(..., min_length=1)
    remedyChosen: str = Field(..., min_length=1)


@router.post("/examples/samples/{sample_id}/reject")
def example_log_sample_reject(
    sample_id: int,
    body: SampleRejectAuditExampleBody,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Demonstrates audit logging only — does not mutate sample state.
    """
    event_id = EventLogger(db).log_event(
        AuditEventCreate(
            eventType=EventType.LABORATORY_SAMPLE_REJECT,
            target=EventTarget(entityType="sample", entityId=sample_id),
            context=EventContext(
                patientId=body.patientId,
                orderId=body.orderId,
            ),
            changes=EventChanges(
                oldValues={"status": "collected"},
                newValues={"status": "rejected"},
            ),
            metadata={
                "rejection_reason": body.rejectionReason,
                "remedy_chosen": body.remedyChosen,
            },
        ),
        user=current_user,
        background_tasks=background_tasks,
    )
    return {"logged": True, "eventId": str(event_id)}

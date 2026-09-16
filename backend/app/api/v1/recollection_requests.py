"""
Recollection Requests API — supervisor approval for patient redraw.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.db.database import get_db
from app.models.user import User
from app.schemas.enums import UserRole
from app.services.lab.recollection import (
    RecollectionRequestResult,
    RecollectionRequestSummary,
)
from app.services.lab.workflow import LabOperationsService
from app.utils.exceptions import LabOperationError

router = APIRouter()

require_recollection_reviewer = require_role(UserRole.ADMIN, UserRole.LAB_TECH_PLUS)


class RecollectionReviewRequest(BaseModel):
    reviewNotes: str | None = Field(None, max_length=1000)


@router.get(
    "/lab/recollection-requests/pending",
    response_model=list[RecollectionRequestSummary],
)
def list_pending_recollection_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recollection_reviewer),
):
    """List recollection requests awaiting supervisor approval."""
    service = LabOperationsService(db)
    return service.recollection.list_pending()


@router.post(
    "/lab/recollection-requests/{requestId}/approve",
    response_model=RecollectionRequestResult,
)
def approve_recollection_request(
    requestId: int,
    body: RecollectionReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recollection_reviewer),
):
    """Approve a recollection request and create the pending collection tube."""
    try:
        service = LabOperationsService(db)
        return service.recollection.approve(requestId, current_user.id, body.reviewNotes)
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/lab/recollection-requests/{requestId}/deny",
    response_model=RecollectionRequestResult,
)
def deny_recollection_request(
    requestId: int,
    body: RecollectionReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recollection_reviewer),
):
    """Deny a recollection request and cancel affected tests."""
    try:
        service = LabOperationsService(db)
        return service.recollection.deny(requestId, current_user.id, body.reviewNotes)
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

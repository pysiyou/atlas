"""Lab recollection request routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.db.database import get_db
from app.models.user import User
from app.schemas.enums import UserRole
from app.schemas.lab import (
    RecollectionRequestResult,
    RecollectionRequestSummary,
    RecollectionReviewRequest,
)
from app.services.lab.workflow import LabOperationsService

router = APIRouter()

require_recollection_reviewer = require_role(UserRole.ADMIN, UserRole.LAB_TECH_PLUS)


@router.get(
    "/recollection-requests/pending",
    response_model=list[RecollectionRequestSummary],
)
def list_pending_recollection_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recollection_reviewer),
):
    service = LabOperationsService(db)
    return service.recollection.list_pending()


@router.post(
    "/recollection-requests/{requestId}/approve",
    response_model=RecollectionRequestResult,
)
def approve_recollection_request(
    requestId: int,
    body: RecollectionReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recollection_reviewer),
):
    service = LabOperationsService(db)
    return service.recollection.approve(requestId, current_user.id, body.reviewNotes)


@router.post(
    "/recollection-requests/{requestId}/deny",
    response_model=RecollectionRequestResult,
)
def deny_recollection_request(
    requestId: int,
    body: RecollectionReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recollection_reviewer),
):
    service = LabOperationsService(db)
    return service.recollection.deny(requestId, current_user.id, body.reviewNotes)

"""Clinical workup catalog API."""
from app.domains.catalog.clinical_workup_service import ClinicalWorkupService
from app.domains.catalog.schemas.clinical_workup import ClinicalWorkupResponse
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http import get_current_user
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/clinical-workups", response_model=list[ClinicalWorkupResponse])
def list_clinical_workups(
    activeOnly: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ClinicalWorkupService(db).list_workups(active_only=activeOnly)
"""Referent doctor API routes."""
from app.domains.referent_doctors.schemas import ReferentDoctorCreate, ReferentDoctorResponse
from app.domains.referent_doctors.service import ReferentDoctorService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/referent-doctors", response_model=list[ReferentDoctorResponse])
def list_referent_doctors(
    q: str | None = Query(None, max_length=100),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReferentDoctorService(db).list_active(q=q, limit=limit)


@router.post(
    "/referent-doctors",
    response_model=ReferentDoctorResponse,
    status_code=201,
)
def create_referent_doctor(
    payload: ReferentDoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReferentDoctorService(db).create(payload)

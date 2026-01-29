"""
Patient API Routes. All fields use camelCase. Delegates to PatientService.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from app.schemas.pagination import create_paginated_response, skip_to_page
from app.api.deps import PaginationParams
from app.services.patient_service import PatientService
from app.utils.db_helpers import get_or_404

router = APIRouter()


@router.get("/patients/search")
def search_patients(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search patients by name, id, or phone. Returns list (no pagination)."""
    return PatientService(db).search(q, limit=100)


@router.get("/patients")
def get_patients(
    pagination: PaginationParams,
    search: str | None = Query(None, max_length=100),
    paginated: bool = Query(False, description="Return paginated response with total count"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all patients with pagination and optional search."""
    skip, limit = pagination["skip"], pagination["limit"]
    data, total = PatientService(db).get_list(skip=skip, limit=limit, search=search, paginated=paginated)
    if paginated:
        page = skip_to_page(skip, limit)
        return create_paginated_response(data, total, page, limit)
    return data


@router.get("/patients/{patientId}")
def get_patient(
    patientId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient by ID."""
    return PatientService(db).get_by_id(patientId)


@router.post("/patients", status_code=201)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new patient."""
    return PatientService(db).create(patient_data, current_user.id)


@router.put("/patients/{patientId}")
def update_patient(
    patientId: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update patient information."""
    return PatientService(db).update(patientId, patient_data, current_user.id)


@router.delete("/patients/{patientId}", status_code=204)
def delete_patient(
    patientId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a patient."""
    patient = get_or_404(db, Patient, patientId, "id")
    db.delete(patient)
    db.commit()
    return None

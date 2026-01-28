"""
Patient API Routes
All fields use camelCase - no mapping needed
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.inspection import inspect
from datetime import datetime, timezone
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, MedicalHistory
from app.schemas.enums import SampleStatus, TestStatus, UserRole
from app.schemas.pagination import create_paginated_response, skip_to_page

router = APIRouter()

def _patient_to_response_dict(patient: Patient) -> dict:
    """
    Convert a SQLAlchemy Patient ORM object into a dict suitable for PatientResponse.
    
    This is intentionally stricter than returning the ORM object directly because
    `PatientResponse.model_validate(patient)` can raise a ValidationError if legacy
    data in JSON columns doesn't match the current schema (e.g. affiliation.duration).
    
    We normalize known legacy values here to ensure the endpoint never 500s for
    data that exists in the database.
    """
    # Pull all mapped column attributes (not relationships) into a plain dict.
    data = {attr.key: getattr(patient, attr.key) for attr in inspect(patient).mapper.column_attrs}

    # Backward-compat: some seed/legacy records used a 3-month affiliation duration.
    # Current supported durations are 6, 12, and 24 months.
    affiliation = data.get("affiliation")
    if isinstance(affiliation, dict):
        raw_duration = affiliation.get("duration")
        # Normalize only known bad legacy value(s) to a supported plan.
        if raw_duration == 3:
            affiliation = {**affiliation, "duration": 6}
            data["affiliation"] = affiliation

    return data


@router.get("/patients")
def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None, max_length=100),
    paginated: bool = Query(False, description="Return paginated response with total count"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all patients with pagination and optional search.

    Query params:
    - paginated: If true, returns {data: [...], pagination: {...}} format
    """
    query = db.query(Patient)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Patient.fullName.ilike(search_term),
                Patient.id.ilike(search_term),
                Patient.phone.contains(search)
            )
        )

    query = query.order_by(Patient.createdAt.desc())

    # Get total count for pagination (before offset/limit)
    total = query.count() if paginated else 0

    patients = query.offset(skip).limit(limit).all()

    # Normalize legacy JSON values before validating response schema.
    try:
        data = [PatientResponse.model_validate(_patient_to_response_dict(p)).model_dump(mode="json") for p in patients]
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Error serializing patients: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serializing patient data: {str(e)}"
        )

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
    """
    Get patient by ID
    """
    patient = db.query(Patient).filter(Patient.id == patientId).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patientId} not found"
        )
    # Normalize legacy JSON values before validating response schema.
    return PatientResponse.model_validate(_patient_to_response_dict(patient)).model_dump()


@router.post("/patients", status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new patient
    """
    # Provide default empty medical history if None (DB column is nullable=False)
    medical_history_data = (
        patient_data.medicalHistory.model_dump() 
        if patient_data.medicalHistory 
        else MedicalHistory().model_dump()
    )
    
    patient = Patient(
        fullName=patient_data.fullName,
        dateOfBirth=patient_data.dateOfBirth,
        gender=patient_data.gender,
        phone=patient_data.phone,
        email=patient_data.email,
        height=patient_data.height,
        weight=patient_data.weight,
        address=patient_data.address.model_dump(),
        emergencyContact=patient_data.emergencyContact.model_dump(),
        medicalHistory=medical_history_data,
        affiliation=patient_data.affiliation.model_dump() if patient_data.affiliation else None,
        registrationDate=datetime.now(timezone.utc),
        createdBy=current_user.id,
        updatedBy=current_user.id,
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    # Normalize legacy JSON values before validating response schema.
    return PatientResponse.model_validate(_patient_to_response_dict(patient)).model_dump()


@router.put("/patients/{patientId}")
def update_patient(
    patientId: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update patient information
    """
    patient = db.query(Patient).filter(Patient.id == patientId).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patientId} not found"
        )

    # Update only allowed fields - whitelist for security
    ALLOWED_UPDATE_FIELDS = {
        'fullName', 'dateOfBirth', 'gender', 'phone', 'email',
        'height', 'weight', 'address', 'emergencyContact', 'medicalHistory', 'affiliation',
        'vitalSigns',
    }
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ALLOWED_UPDATE_FIELDS and hasattr(patient, field):
            setattr(patient, field, value)

    patient.updatedBy = current_user.id

    db.commit()
    db.refresh(patient)

    # Normalize legacy JSON values before validating response schema.
    return PatientResponse.model_validate(_patient_to_response_dict(patient)).model_dump()


@router.delete("/patients/{patientId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patientId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a patient
    """
    patient = db.query(Patient).filter(Patient.id == patientId).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patientId} not found"
        )

    db.delete(patient)
    db.commit()

    return None

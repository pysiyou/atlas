"""
Patient API Routes
All fields use camelCase - no mapping needed
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.core.dependencies import get_current_user, require_receptionist
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.services.id_generator import generate_id

router = APIRouter()


@router.get("/patients")
def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all patients with pagination and optional search
    """
    query = db.query(Patient)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (Patient.fullName.ilike(search_term)) |
            (Patient.id.ilike(search_term)) |
            (Patient.phone.contains(search))
        )

    patients = query.offset(skip).limit(limit).all()
    return [PatientResponse.model_validate(p).model_dump() for p in patients]


@router.get("/patients/{patientId}")
def get_patient(
    patientId: str,
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
    return PatientResponse.model_validate(patient).model_dump()


@router.post("/patients", status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    """
    Create a new patient
    """
    patientId = generate_id("patient", db)

    patient = Patient(
        id=patientId,
        fullName=patient_data.fullName,
        dateOfBirth=patient_data.dateOfBirth,
        gender=patient_data.gender,
        phone=patient_data.phone,
        email=patient_data.email,
        address=patient_data.address.model_dump(),
        emergencyContact=patient_data.emergencyContact.model_dump(),
        medicalHistory=patient_data.medicalHistory.model_dump(),
        affiliation=patient_data.affiliation.model_dump() if patient_data.affiliation else None,
        registrationDate=datetime.now(timezone.utc),
        createdBy=current_user.id,
        updatedBy=current_user.id,
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return PatientResponse.model_validate(patient).model_dump()


@router.put("/patients/{patientId}")
def update_patient(
    patientId: str,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
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
        'address', 'emergencyContact', 'medicalHistory', 'affiliation'
    }
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ALLOWED_UPDATE_FIELDS and hasattr(patient, field):
            setattr(patient, field, value)

    patient.updatedBy = current_user.id

    db.commit()
    db.refresh(patient)

    return PatientResponse.model_validate(patient).model_dump()


@router.delete("/patients/{patientId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patientId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
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

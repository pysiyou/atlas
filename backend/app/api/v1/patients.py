"""
Patient API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.dependencies import get_current_user, require_receptionist
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.services.id_generator import generate_id

router = APIRouter()


@router.get("/patients", response_model=List[PatientResponse])
def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = None,
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
            (Patient.full_name.ilike(search_term)) |
            (Patient.id.ilike(search_term)) |
            (Patient.phone.contains(search))
        )
    
    patients = query.offset(skip).limit(limit).all()
    return patients


@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get patient by ID
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found"
        )
    return patient


@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    """
    Create a new patient
    """
    # Generate ID
    patient_id = generate_id("patient", db)
    
    # Create patient
    patient = Patient(
        id=patient_id,
        full_name=patient_data.fullName,
        date_of_birth=patient_data.dateOfBirth,
        gender=patient_data.gender,
        phone=patient_data.phone,
        email=patient_data.email,
        address=patient_data.address.model_dump(),
        emergency_contact=patient_data.emergencyContact.model_dump(),
        medical_history=patient_data.medicalHistory.model_dump(),
        affiliation=patient_data.affiliation.model_dump() if patient_data.affiliation else None,
        registration_date=datetime.utcnow(),
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    return patient


@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    """
    Update patient information
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found"
        )
    
    # Update fields
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(patient, field):
            # Convert nested models to dict
            if isinstance(value, BaseModel):
                value = value.model_dump()
            setattr(patient, field, value)
    
    patient.updated_by = current_user.id
    
    db.commit()
    db.refresh(patient)
    
    return patient


@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    """
    Delete a patient
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found"
        )
    
    db.delete(patient)
    db.commit()
    
    return None

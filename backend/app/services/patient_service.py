"""
Patient business logic. Router delegates list/get/search/create/update to this service.
"""
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from sqlalchemy.inspection import inspect

from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, MedicalHistory


def patient_to_response_dict(patient: Patient) -> dict:
    """
    Convert SQLAlchemy Patient to dict suitable for PatientResponse.
    Normalizes legacy JSON (e.g. affiliation.duration) so validation never 500s.
    """
    data = {attr.key: getattr(patient, attr.key) for attr in inspect(patient).mapper.column_attrs}
    affiliation = data.get("affiliation")
    if isinstance(affiliation, dict) and affiliation.get("duration") == 3:
        data["affiliation"] = {**affiliation, "duration": 6}
    return data


def serialize_patient(patient: Patient) -> dict:
    return PatientResponse.model_validate(patient_to_response_dict(patient)).model_dump(mode="json")


def serialize_patient_full(patient: Patient) -> dict:
    return PatientResponse.model_validate(patient_to_response_dict(patient)).model_dump()


class PatientService:
    def __init__(self, db: Session):
        self.db = db

    def get_list(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        paginated: bool = False,
    ) -> tuple[list[dict], int]:
        query = self.db.query(Patient)
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Patient.fullName.ilike(search_term),
                    Patient.id.ilike(search_term),
                    Patient.phone.contains(search),
                )
            )
        query = query.order_by(Patient.createdAt.desc())
        total = query.count() if paginated else 0
        patients = query.offset(skip).limit(limit).all()
        data = [serialize_patient(p) for p in patients]
        return data, total

    def search(self, q: str, limit: int = 100) -> list[dict]:
        search_term = f"%{q.lower()}%"
        patients = (
            self.db.query(Patient)
            .filter(
                or_(
                    Patient.fullName.ilike(search_term),
                    cast(Patient.id, String).ilike(search_term),
                    Patient.phone.contains(q),
                )
            )
            .order_by(Patient.createdAt.desc())
            .limit(limit)
            .all()
        )
        return [serialize_patient(p) for p in patients]

    def get_by_id(self, patient_id: int) -> dict:
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient {patient_id} not found",
            )
        return serialize_patient_full(patient)

    def create(self, patient_data: PatientCreate, user_id: int) -> dict:
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
            createdBy=user_id,
            updatedBy=user_id,
        )
        self.db.add(patient)
        self.db.commit()
        self.db.refresh(patient)
        return serialize_patient_full(patient)

    def update(self, patient_id: int, patient_data: PatientUpdate, user_id: int) -> dict:
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient {patient_id} not found",
            )
        ALLOWED = {
            "fullName", "dateOfBirth", "gender", "phone", "email",
            "height", "weight", "address", "emergencyContact", "medicalHistory", "affiliation",
            "vitalSigns",
        }
        update_data = patient_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field in ALLOWED and hasattr(patient, field):
                setattr(patient, field, value)
        patient.updatedBy = user_id
        self.db.commit()
        self.db.refresh(patient)
        return serialize_patient_full(patient)

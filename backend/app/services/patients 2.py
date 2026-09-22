"""
Patient business logic. Router delegates list/get/search/create/update to this service.
"""
import re
from datetime import UTC, datetime

from app.models.order import Order
from app.models.patient import Patient
from app.schemas.enums import PaymentStatus
from app.schemas.patient import MedicalHistory, PatientCreate, PatientResponse, PatientUpdate
from app.utils.common import parse_display_id_from_search
from fastapi import HTTPException, status
from sqlalchemy import String, cast, or_
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Session


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


def _patient_search_filter(search_term: str):
    """Collection-style name/id lookup plus phone substring match."""
    term = search_term.strip()
    predicates = [
        Patient.fullName.ilike(f"%{term}%"),
        Patient.phone.contains(term),
    ]
    patient_id = parse_display_id_from_search(term, "PAT")
    if patient_id is not None:
        predicates.append(Patient.id == patient_id)
    compact = re.sub(r"[\s-]", "", term)
    if compact.isdigit():
        predicates.append(cast(Patient.id, String).ilike(f"%{compact}%"))
        if compact != term:
            predicates.append(Patient.phone.contains(compact))
    return or_(*predicates)


def _attach_order_summaries(db: Session, patients_data: list[dict]) -> list[dict]:
    if not patients_data:
        return patients_data
    patient_ids = [p["id"] for p in patients_data]
    orders = db.query(Order).filter(Order.patientId.in_(patient_ids)).all()
    orders_by_patient: dict[int, list[Order]] = {}
    for order in orders:
        orders_by_patient.setdefault(order.patientId, []).append(order)

    for patient in patients_data:
        patient_orders = orders_by_patient.get(patient["id"], [])
        if not patient_orders:
            patient["orderSummary"] = {
                "orderCount": 0,
                "lastOrderDate": None,
                "lastOrderStatus": None,
                "hasUnpaidOrders": False,
            }
            continue
        sorted_orders = sorted(patient_orders, key=lambda o: o.orderDate, reverse=True)
        last_order = sorted_orders[0]
        last_status = last_order.overallStatus
        patient["orderSummary"] = {
            "orderCount": len(patient_orders),
            "lastOrderDate": last_order.orderDate,
            "lastOrderStatus": last_status.value if hasattr(last_status, "value") else last_status,
            "hasUnpaidOrders": any(
                o.paymentStatus == PaymentStatus.UNPAID for o in patient_orders
            ),
        }
    return patients_data


class PatientService:
    def __init__(self, db: Session):
        self.db = db

    def get_list(
        self,
        skip: int = 0,
        limit: int = 10000,
        search: str | None = None,
        paginated: bool = False,
        include_order_summary: bool = False,
    ) -> tuple[list[dict], int]:
        query = self.db.query(Patient)
        if search:
            query = query.filter(_patient_search_filter(search))
        query = query.order_by(Patient.updatedAt.desc())
        total = query.count() if paginated else 0
        patients = query.offset(skip).limit(limit).all()
        data = [serialize_patient(p) for p in patients]
        if include_order_summary:
            data = _attach_order_summaries(self.db, data)
        return data, total

    def search(self, q: str, limit: int = 10000) -> list[dict]:
        patients = (
            self.db.query(Patient)
            .filter(_patient_search_filter(q))
            .order_by(Patient.updatedAt.desc())
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
            vitalSigns=patient_data.vitalSigns.model_dump() if patient_data.vitalSigns else None,
            registrationDate=datetime.now(UTC),
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
            "fullName",
            "dateOfBirth",
            "gender",
            "phone",
            "email",
            "height",
            "weight",
            "address",
            "emergencyContact",
            "medicalHistory",
            "affiliation",
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

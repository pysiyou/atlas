"""
Patient business logic. Router delegates list/get/search/create/update to this service.
"""
from datetime import UTC, datetime

from app.domains.audit.emitter import AuditEmitter
from app.domains.orders.models import Order
from app.domains.patients.models import Patient
from app.domains.patients.schemas import (
    MedicalHistory,
    PatientCreate,
    PatientResponse,
    PatientUpdate,
)
from app.platform.config import client_config
from app.shared.clinical import allocate_patient_id, compact_identifier, looks_like_patient_id
from app.shared.generated.enums import Gender, PaymentStatus
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_
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
    """Match patient id, name, or phone."""
    term = search_term.strip()
    predicates = [
        Patient.fullName.ilike(f"%{term}%"),
        Patient.phone.contains(term),
        Patient.id.ilike(f"%{term}%"),
    ]
    compact = compact_identifier(term)
    if looks_like_patient_id(term):
        predicates.append(Patient.id == compact)
    return or_(*predicates)


def _years_ago_iso(years: int) -> str:
    today = datetime.now(UTC).date()
    try:
        cutoff = today.replace(year=today.year - years)
    except ValueError:
        cutoff = today.replace(year=today.year - years, month=2, day=28)
    return cutoff.isoformat()


def _attach_order_summaries(db: Session, patients_data: list[dict]) -> list[dict]:
    """Attach per-patient order counts from SQL aggregates, not a full order load."""
    if not patients_data:
        return patients_data
    patient_ids = [p["id"] for p in patients_data]
    empty_summary = {
        "orderCount": 0,
        "lastOrderDate": None,
        "lastOrderStatus": None,
        "hasUnpaidOrders": False,
    }
    if not patient_ids:
        for patient in patients_data:
            patient["orderSummary"] = dict(empty_summary)
        return patients_data

    aggregates = (
        db.query(
            Order.patientId,
            func.count(Order.orderId).label("order_count"),
            func.max(Order.orderDate).label("last_order_date"),
            func.bool_or(
                Order.paymentStatus.in_([PaymentStatus.UNPAID, PaymentStatus.PARTIAL])
            ).label("has_unpaid"),
        )
        .filter(Order.patientId.in_(patient_ids))
        .group_by(Order.patientId)
        .all()
    )
    aggregate_by_patient = {row.patientId: row for row in aggregates}

    last_orders = (
        db.query(Order.patientId, Order.overallStatus)
        .filter(Order.patientId.in_(patient_ids))
        .distinct(Order.patientId)
        .order_by(Order.patientId, Order.orderDate.desc())
        .all()
    )
    last_status_by_patient: dict[str, str | None] = {}
    for patient_id, overall_status in last_orders:
        last_status_by_patient[patient_id] = (
            overall_status.value if hasattr(overall_status, "value") else overall_status
        )

    for patient in patients_data:
        row = aggregate_by_patient.get(patient["id"])
        if not row:
            patient["orderSummary"] = dict(empty_summary)
            continue
        patient["orderSummary"] = {
            "orderCount": int(row.order_count),
            "lastOrderDate": row.last_order_date,
            "lastOrderStatus": last_status_by_patient.get(patient["id"]),
            "hasUnpaidOrders": bool(row.has_unpaid),
        }
    return patients_data


class PatientService:
    def __init__(self, db: Session):
        self.db = db
        self.emitter = AuditEmitter(db)

    def get_list(
        self,
        skip: int = 0,
        limit: int = 10000,
        search: str | None = None,
        paginated: bool = False,
        include_order_summary: bool = False,
        patient_id: str | None = None,
        genders: list[Gender] | None = None,
        affiliation_statuses: list[str] | None = None,
        age_min: int | None = None,
        age_max: int | None = None,
    ) -> tuple[list[dict], int]:
        query = self.db.query(Patient)
        if patient_id:
            query = query.filter(Patient.id == patient_id)
        if search:
            query = query.filter(_patient_search_filter(search))
        if genders:
            query = query.filter(Patient.gender.in_(genders))
        if age_min is not None:
            query = query.filter(Patient.dateOfBirth <= _years_ago_iso(age_min))
        if age_max is not None:
            query = query.filter(Patient.dateOfBirth > _years_ago_iso(age_max + 1))
        statuses = {
            status for status in (affiliation_statuses or []) if status in {"active", "inactive"}
        }
        if statuses and statuses != {"active", "inactive"}:
            today = datetime.now(UTC).date().isoformat()
            end_date = Patient.affiliation.op("->>")("endDate")
            is_active = and_(Patient.affiliation.isnot(None), end_date >= today)
            is_inactive = or_(Patient.affiliation.is_(None), end_date < today)
            if statuses == {"active"}:
                query = query.filter(is_active)
            else:
                query = query.filter(is_inactive)
        query = query.order_by(Patient.updatedAt.desc())
        total = query.count() if paginated else 0
        patients = query.offset(skip).limit(limit).all()
        data = [serialize_patient(p) for p in patients]
        if include_order_summary:
            data = _attach_order_summaries(self.db, data)
        return data, total

    def search(self, q: str, limit: int = 20) -> list[dict]:
        patients = (
            self.db.query(Patient)
            .filter(_patient_search_filter(q))
            .order_by(Patient.updatedAt.desc())
            .limit(limit)
            .all()
        )
        return [serialize_patient(p) for p in patients]

    def get_by_id(self, patient_id: str, viewer_user_id: str | None = None) -> dict:
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient {patient_id} not found",
            )
        if viewer_user_id is not None:
            self.emitter.patient_viewed(patient_id, viewer_user_id)
            self.db.commit()
        return serialize_patient_full(patient)

    def _find_duplicate_matches(self, patient_data: PatientCreate) -> list[Patient]:
        """Exact name+DOB matches, plus same-phone matches, de-duplicated."""
        name_dob = (
            self.db.query(Patient)
            .filter(
                func.lower(Patient.fullName) == patient_data.fullName.strip().lower(),
                Patient.dateOfBirth == patient_data.dateOfBirth,
            )
            .all()
        )
        phone = self.db.query(Patient).filter(Patient.phone == patient_data.phone.strip()).all()
        seen: set[int] = set()
        matches: list[Patient] = []
        for row in name_dob + phone:
            if row.id in seen:
                continue
            seen.add(row.id)
            matches.append(row)
        return matches

    def create(
        self, patient_data: PatientCreate, user_id: str, *, force_create: bool = False
    ) -> dict:
        # Check workflow: requireEmergencyContact
        require_emergency = client_config.workflows.get("requireEmergencyContact", True)
        if require_emergency:
            emergency = patient_data.emergencyContact
            if not emergency or not emergency.fullName or not emergency.phone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Emergency contact information is required (name and phone).",
                )

        duplicates = self._find_duplicate_matches(patient_data)
        if duplicates and not force_create:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error_code": "DUPLICATE_PATIENT",
                    "message": "Possible existing patient records match this identity.",
                    "matches": [serialize_patient(row) for row in duplicates],
                },
            )

        medical_history_data = (
            patient_data.medicalHistory.model_dump()
            if patient_data.medicalHistory
            else MedicalHistory().model_dump()
        )
        patient = Patient(
            id=allocate_patient_id(self.db),
            fullName=patient_data.fullName,
            dateOfBirth=patient_data.dateOfBirth,
            gender=patient_data.gender,
            phone=patient_data.phone.strip(),
            email=patient_data.email,
            height=patient_data.height,
            weight=patient_data.weight,
            address=patient_data.address.model_dump(),
            emergencyContact=patient_data.emergencyContact.model_dump(),
            medicalHistory=medical_history_data,
            affiliation=patient_data.affiliation.model_dump() if patient_data.affiliation else None,
            registrationDate=datetime.now(UTC),
            createdBy=user_id,
            updatedBy=user_id,
        )
        self.db.add(patient)
        self.db.flush()
        if force_create and duplicates:
            self.emitter.patient_created_forced(
                patient.id,
                user_id,
                metadata={"matched_ids": [row.id for row in duplicates]},
            )
        else:
            self.emitter.patient_created(patient.id, user_id)
        self.db.commit()
        self.db.refresh(patient)
        return serialize_patient_full(patient)

    def update(self, patient_id: str, patient_data: PatientUpdate, user_id: str) -> dict:
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
        }
        update_data = patient_data.model_dump(exclude_unset=True, mode="json")
        for field, value in update_data.items():
            if field in ALLOWED and hasattr(patient, field):
                if field == "phone" and isinstance(value, str):
                    value = value.strip()
                setattr(patient, field, value)
        patient.updatedBy = user_id
        self.emitter.patient_updated(patient_id, user_id, changes=update_data)
        self.db.commit()
        self.db.refresh(patient)
        return serialize_patient_full(patient)

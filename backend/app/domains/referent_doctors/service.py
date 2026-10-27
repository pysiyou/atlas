"""Referent doctor directory service."""
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domains.referent_doctors.models import ReferentDoctor
from app.domains.referent_doctors.schemas import ReferentDoctorCreate, ReferentDoctorResponse
from fastapi import HTTPException, status


def normalize_full_name(full_name: str) -> str:
    return " ".join(full_name.split())


class ReferentDoctorService:
    def __init__(self, db: Session):
        self.db = db

    def list_active(self, q: str | None = None, limit: int = 50) -> list[ReferentDoctorResponse]:
        query = self.db.query(ReferentDoctor).filter(ReferentDoctor.isActive.is_(True))
        if q:
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    ReferentDoctor.fullName.ilike(term),
                    ReferentDoctor.hospitalName.ilike(term),
                    ReferentDoctor.email.ilike(term),
                    ReferentDoctor.phone.ilike(term),
                    ReferentDoctor.username.ilike(term),
                )
            )
        rows = (
            query.order_by(ReferentDoctor.fullName.asc()).limit(min(limit, 100)).all()
        )
        return [ReferentDoctorResponse.model_validate(row) for row in rows]

    def get_by_id(self, referent_doctor_id: int) -> ReferentDoctor | None:
        return (
            self.db.query(ReferentDoctor)
            .filter(
                ReferentDoctor.referentDoctorId == referent_doctor_id,
                ReferentDoctor.isActive.is_(True),
            )
            .first()
        )

    def create(self, payload: ReferentDoctorCreate) -> ReferentDoctorResponse:
        full_name = normalize_full_name(payload.fullName)
        if not full_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="fullName is required",
            )
        existing = (
            self.db.query(ReferentDoctor)
            .filter(func.lower(func.btrim(ReferentDoctor.fullName)) == full_name.lower())
            .first()
        )
        if existing:
            return ReferentDoctorResponse.model_validate(existing)
        row = ReferentDoctor(
            fullName=full_name,
            username=payload.username,
            email=payload.email,
            phone=payload.phone,
            hospitalName=payload.hospitalName,
            isActive=True,
        )
        self.db.add(row)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            existing = (
                self.db.query(ReferentDoctor)
                .filter(func.lower(func.btrim(ReferentDoctor.fullName)) == full_name.lower())
                .first()
            )
            if existing:
                return ReferentDoctorResponse.model_validate(existing)
            raise
        self.db.refresh(row)
        return ReferentDoctorResponse.model_validate(row)

"""Referent doctor directory — external clinicians who order lab work."""
from app.platform.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class ReferentDoctor(Base):
    __tablename__ = "referent_doctors"

    referentDoctorId = Column(
        "referent_doctor_id", Integer, primary_key=True, autoincrement=True, index=True
    )
    fullName = Column("full_name", String(200), nullable=False)
    username = Column(String(100), nullable=True, unique=True, index=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    hospitalName = Column("hospital_name", String(200), nullable=True)
    isActive = Column("is_active", Boolean, nullable=False, default=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    orders = relationship("Order", back_populates="referentDoctor")

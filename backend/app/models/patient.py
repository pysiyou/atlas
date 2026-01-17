"""
Patient Model
"""
from sqlalchemy import Column, String, DateTime, JSON, Enum
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import Gender


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, index=True)  # PAT-YYYYMMDD-XXX
    fullName = Column(String, nullable=False, index=True)
    dateOfBirth = Column(String, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)

    # Address (JSON)
    address = Column(JSON, nullable=False)  # {street, city, postalCode}

    # Emergency Contact (JSON)
    emergencyContact = Column(JSON, nullable=False)  # {name, phone}

    # Medical History (JSON)
    medicalHistory = Column(JSON, nullable=False)  # {chronicConditions, currentMedications, allergies, previousSurgeries, familyHistory, lifestyle}

    # Affiliation (JSON, optional)
    affiliation = Column(JSON, nullable=True)  # {assuranceNumber, startDate, endDate, duration}

    # Metadata
    registrationDate = Column(DateTime(timezone=True), nullable=False)
    createdBy = Column(String, nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updatedBy = Column(String, nullable=False)

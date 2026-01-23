"""
Patient Model
"""
from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import Gender


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    fullName = Column("full_name", String, nullable=False, index=True)
    dateOfBirth = Column("date_of_birth", String, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)

    # Address (JSON)
    address = Column(JSON, nullable=False)  # {street, city, postalCode}

    # Emergency Contact (JSON)
    emergencyContact = Column("emergency_contact", JSON, nullable=False)  # {fullName, relationship, phone, email}

    # Medical History (JSON)
    medicalHistory = Column("medical_history", JSON, nullable=False)  # {chronicConditions, currentMedications, allergies, previousSurgeries, familyHistory, lifestyle}

    # Affiliation (JSON, optional)
    affiliation = Column(JSON, nullable=True)  # {assuranceNumber, startDate, endDate, duration}

    # Vital Signs (JSON, optional)
    vitalSigns = Column("vital_signs", JSON, nullable=True)  # {temperature, heartRate, systolicBP, diastolicBP, respiratoryRate, oxygenSaturation}

    # Metadata
    registrationDate = Column("registration_date", DateTime(timezone=True), nullable=False)
    createdBy = Column("created_by", String, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updatedBy = Column("updated_by", String, nullable=False)

"""
Patient Model
"""
from sqlalchemy import Column, String, DateTime, Boolean, JSON, Enum
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import Gender


class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, index=True)  # PAT-YYYYMMDD-XXX
    full_name = Column(String, nullable=False, index=True)
    date_of_birth = Column(String, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    
    # Address (JSON)
    address = Column(JSON, nullable=False)  # {street, city, postalCode}
    
    # Emergency Contact (JSON)
    emergency_contact = Column(JSON, nullable=False)  # {name, phone}
    
    # Medical History (JSON)
    medical_history = Column(JSON, nullable=False)  # {chronicConditions, currentMedications, allergies, previousSurgeries, familyHistory, lifestyle}
    
    # Affiliation (JSON, optional)
    affiliation = Column(JSON, nullable=True)  # {assuranceNumber, startDate, endDate, duration}
    
    # Metadata
    registration_date = Column(DateTime(timezone=True), nullable=False)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(String, nullable=False)

"""
Pydantic schemas for Patient
All fields use camelCase - no aliases needed
"""
from pydantic import BaseModel
from datetime import datetime
from app.schemas.enums import Gender, AffiliationDuration


class Address(BaseModel):
    street: str
    city: str
    postalCode: str


class EmergencyContact(BaseModel):
    name: str
    phone: str


class Lifestyle(BaseModel):
    smoking: bool
    alcohol: bool


class MedicalHistory(BaseModel):
    chronicConditions: list[str]
    currentMedications: list[str]
    allergies: list[str]
    previousSurgeries: list[str]
    familyHistory: str
    lifestyle: Lifestyle


class Affiliation(BaseModel):
    assuranceNumber: str
    startDate: str
    endDate: str
    duration: AffiliationDuration


class PatientBase(BaseModel):
    fullName: str
    dateOfBirth: str
    gender: Gender
    phone: str
    email: str | None = None
    address: Address
    emergencyContact: EmergencyContact
    medicalHistory: MedicalHistory
    affiliation: Affiliation | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    fullName: str | None = None
    phone: str | None = None
    email: str | None = None
    address: Address | None = None
    emergencyContact: EmergencyContact | None = None
    medicalHistory: MedicalHistory | None = None
    affiliation: Affiliation | None = None


class PatientResponse(PatientBase):
    id: str
    registrationDate: datetime
    createdBy: str
    createdAt: datetime
    updatedAt: datetime
    updatedBy: str

    class Config:
        from_attributes = True

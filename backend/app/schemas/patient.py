"""
Pydantic schemas for Patient
"""
from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.enums import Gender, AffiliationDuration


class Address(BaseModel):
    street: str
    city: str
    postalCode: str = Field(alias="postal_code")
    
    class Config:
        populate_by_name = True


class EmergencyContact(BaseModel):
    name: str
    phone: str


class Lifestyle(BaseModel):
    smoking: bool
    alcohol: bool


class MedicalHistory(BaseModel):
    chronicConditions: list[str] = Field(alias="chronic_conditions")
    currentMedications: list[str] = Field(alias="current_medications")
    allergies: list[str]
    previousSurgeries: list[str] = Field(alias="previous_surgeries")
    familyHistory: str = Field(alias="family_history")
    lifestyle: Lifestyle
    
    class Config:
        populate_by_name = True


class Affiliation(BaseModel):
    assuranceNumber: str = Field(alias="assurance_number")
    startDate: str = Field(alias="start_date")
    endDate: str = Field(alias="end_date")
    duration: AffiliationDuration
    
    class Config:
        populate_by_name = True


class PatientBase(BaseModel):
    fullName: str = Field(alias="full_name")
    dateOfBirth: str = Field(alias="date_of_birth")
    gender: Gender
    phone: str
    email: str | None = None
    address: Address
    emergencyContact: EmergencyContact = Field(alias="emergency_contact")
    medicalHistory: MedicalHistory = Field(alias="medical_history")
    affiliation: Affiliation | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    fullName: str | None = Field(None, alias="full_name")
    phone: str | None = None
    email: str | None = None
    address: Address | None = None
    emergencyContact: EmergencyContact | None = Field(None, alias="emergency_contact")
    medicalHistory: MedicalHistory | None = Field(None, alias="medical_history")
    affiliation: Affiliation | None = None


class PatientResponse(PatientBase):
    id: str
    registrationDate: datetime = Field(alias="registration_date")
    createdBy: str = Field(alias="created_by")
    createdAt: datetime = Field(alias="created_at")
    updatedAt: datetime = Field(alias="updated_at")
    updatedBy: str = Field(alias="updated_by")
    
    class Config:
        from_attributes = True
        populate_by_name = True

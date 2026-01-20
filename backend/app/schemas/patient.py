"""
Pydantic schemas for Patient
All fields use camelCase - no aliases needed
"""
import re
from pydantic import BaseModel, Field, field_validator, EmailStr
from datetime import datetime
from app.schemas.enums import Gender, AffiliationDuration


class Address(BaseModel):
    """Patient address information."""
    street: str = Field(..., min_length=1, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    postalCode: str = Field(..., min_length=1, max_length=20)


class EmergencyContact(BaseModel):
    """Emergency contact information."""
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)


class Lifestyle(BaseModel):
    """Patient lifestyle information."""
    smoking: bool
    alcohol: bool


class MedicalHistory(BaseModel):
    """Patient medical history."""
    chronicConditions: list[str] = Field(default_factory=list)
    currentMedications: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    previousSurgeries: list[str] = Field(default_factory=list)
    familyHistory: list[str] = Field(default_factory=list)
    lifestyle: Lifestyle


class Affiliation(BaseModel):
    """Insurance/affiliation information."""
    assuranceNumber: str = Field(..., min_length=1, max_length=50)
    startDate: str
    endDate: str
    duration: AffiliationDuration


class PatientBase(BaseModel):
    """Base patient schema with validation."""
    fullName: str = Field(..., min_length=2, max_length=100, description="Patient full name")
    dateOfBirth: str
    gender: Gender
    phone: str = Field(..., min_length=10, max_length=20)
    email: str | None = Field(None, max_length=254)
    address: Address
    emergencyContact: EmergencyContact
    medicalHistory: MedicalHistory
    affiliation: Affiliation | None = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format."""
        if not re.match(r'^[\d\s\-\+\(\)]+$', v):
            raise ValueError('Invalid phone number format')
        return v

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        """Validate email format if provided."""
        if v is None:
            return v
        # Basic email validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email format')
        return v


class PatientCreate(PatientBase):
    """Schema for creating a new patient."""
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

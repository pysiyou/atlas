"""
Pydantic schemas for Patient
All fields use camelCase - no aliases needed
"""
import re
from calendar import monthrange
from pydantic import BaseModel, Field, field_validator, model_validator, EmailStr
from datetime import datetime, timedelta
from app.schemas.enums import Gender, AffiliationDuration, Relationship


class Address(BaseModel):
    """Patient address information."""
    street: str = Field(..., min_length=1, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    postalCode: str = Field(..., min_length=1, max_length=20)


class EmergencyContact(BaseModel):
    """Emergency contact information."""
    fullName: str = Field(..., min_length=2, max_length=100)
    relationship: Relationship
    phone: str = Field(..., min_length=10, max_length=20)
    email: str | None = Field(None, max_length=254)


class VitalSigns(BaseModel):
    """Current patient vital signs (2026 Reference Standards)."""
    temperature: float | None = Field(None, description="In Celsius. Normal: 36.5-37.3", ge=30.0, le=45.0)
    heartRate: int | None = Field(None, description="BPM. Normal: 60-100", ge=30, le=250)
    systolicBP: int | None = Field(None, description="mmHg. Normal: <120", ge=50, le=250)
    diastolicBP: int | None = Field(None, description="mmHg. Normal: <80", ge=30, le=150)
    respiratoryRate: int | None = Field(None, description="Breaths/min. Normal: 12-20", ge=4, le=60)
    oxygenSaturation: int | None = Field(None, description="SpO2 %. Normal: 95-100", ge=50, le=100)


class Lifestyle(BaseModel):
    """Patient lifestyle information."""
    smoking: bool | None = None
    alcohol: bool | None = None


class MedicalHistory(BaseModel):
    """Patient medical history."""
    chronicConditions: list[str] = Field(default_factory=list)
    currentMedications: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    previousSurgeries: list[str] = Field(default_factory=list)
    familyHistory: list[str] = Field(default_factory=list)
    lifestyle: Lifestyle | None = None

    @field_validator('familyHistory', mode='before')
    @classmethod
    def normalize_family_history(cls, v):
        """Convert string to list if needed."""
        if isinstance(v, str):
            # Split by semicolon or use as single item
            if v.strip():
                return [item.strip() for item in v.split(';') if item.strip()]
            return []
        if v is None:
            return []
        return v


class AffiliationInput(BaseModel):
    """Partial affiliation input (for form submission)."""
    assuranceNumber: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    duration: AffiliationDuration | None = None


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
    height: float | None = Field(None, ge=30, le=250, description="Height in centimeters")
    weight: float | None = Field(None, ge=1, le=500, description="Weight in kilograms")
    address: Address
    emergencyContact: EmergencyContact
    medicalHistory: MedicalHistory | None = None
    affiliation: Affiliation | None = None
    vitalSigns: VitalSigns | None = None

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
        """Validate email format if provided. Allows Unicode characters in local part."""
        if v is None:
            return v
        # Email validation that allows Unicode characters in local part
        # RFC 5322 allows Unicode characters in email addresses
        # Pattern: local-part@domain where local-part can contain Unicode, domain is ASCII
        # Using \S (non-whitespace) for local part to allow Unicode, but ensuring @ and domain structure
        if '@' not in v:
            raise ValueError('Invalid email format: missing @')
        parts = v.split('@')
        if len(parts) != 2:
            raise ValueError('Invalid email format: multiple @ symbols')
        local_part, domain = parts
        if not local_part or len(local_part) > 64:  # RFC 5321 limit for local part
            raise ValueError('Invalid email format: local part invalid')
        if not domain or len(domain) > 255:  # RFC 5321 limit for domain
            raise ValueError('Invalid email format: domain invalid')
        # Validate domain format (ASCII only for domain)
        if not re.match(r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', domain):
            raise ValueError('Invalid email format: domain format invalid')
        # Additional check: ensure total length is within RFC 5321 limit
        if len(v) > 254:
            raise ValueError('Email address too long')
        return v


class PatientCreate(PatientBase):
    """Schema for creating a new patient."""
    # Allow partial affiliation input (will be normalized in validator)
    affiliation: Affiliation | AffiliationInput | None = None

    @model_validator(mode='before')
    @classmethod
    def normalize_affiliation(cls, data: dict) -> dict:
        """Auto-generate missing affiliation fields when only duration is provided."""
        if isinstance(data, dict) and 'affiliation' in data:
            aff = data['affiliation']
            if isinstance(aff, dict):
                # Only auto-generate if duration is explicitly provided
                duration = aff.get('duration')
                if duration is not None and not all(k in aff for k in ['assuranceNumber', 'startDate', 'endDate']):
                    import secrets
                    from datetime import datetime
                    
                    start_date = aff.get('startDate')
                    if not start_date:
                        start_date = datetime.now().strftime('%Y-%m-%d')
                    
                    # Calculate end date (add months properly)
                    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                    # Add months by manipulating year/month, handling day overflow
                    new_month = start_dt.month + duration
                    new_year = start_dt.year
                    while new_month > 12:
                        new_month -= 12
                        new_year += 1
                    # Handle day overflow (e.g., Jan 31 + 1 month -> Feb 28/29)
                    try:
                        end_dt = start_dt.replace(year=new_year, month=new_month)
                    except ValueError:
                        # Day doesn't exist in target month (e.g., Feb 31), use last day of month
                        last_day = monthrange(new_year, new_month)[1]
                        end_dt = start_dt.replace(year=new_year, month=new_month, day=min(start_dt.day, last_day))
                    end_date = end_dt.strftime('%Y-%m-%d')
                    
                    # Generate assurance number if missing
                    assurance_number = aff.get('assuranceNumber')
                    if not assurance_number:
                        date_str = datetime.now().strftime('%Y%m%d')
                        random_suffix = secrets.randbelow(1000)
                        assurance_number = f'ASS-{date_str}-{random_suffix:03d}'
                    
                    data['affiliation'] = {
                        'assuranceNumber': assurance_number,
                        'startDate': start_date,
                        'endDate': end_date,
                        'duration': duration,
                    }
        return data


class PatientUpdate(BaseModel):
    """Schema for updating a patient. All fields optional; only provided fields are updated."""

    fullName: str | None = None
    dateOfBirth: str | None = None
    gender: Gender | None = None
    phone: str | None = None
    email: str | None = None
    height: float | None = None
    weight: float | None = None
    address: Address | None = None
    emergencyContact: EmergencyContact | None = None
    medicalHistory: MedicalHistory | None = None
    affiliation: Affiliation | AffiliationInput | None = None
    vitalSigns: VitalSigns | None = None

    @model_validator(mode='before')
    @classmethod
    def normalize_affiliation(cls, data: dict) -> dict:
        """Auto-generate missing affiliation fields when only duration is provided."""
        if isinstance(data, dict) and 'affiliation' in data:
            aff = data['affiliation']
            if isinstance(aff, dict):
                # Only auto-generate if duration is explicitly provided
                duration = aff.get('duration')
                if duration is not None and not all(k in aff for k in ['assuranceNumber', 'startDate', 'endDate']):
                    import secrets
                    from datetime import datetime
                    
                    start_date = aff.get('startDate')
                    if not start_date:
                        start_date = datetime.now().strftime('%Y-%m-%d')
                    
                    # Calculate end date (add months properly)
                    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                    # Add months by manipulating year/month, handling day overflow
                    new_month = start_dt.month + duration
                    new_year = start_dt.year
                    while new_month > 12:
                        new_month -= 12
                        new_year += 1
                    # Handle day overflow (e.g., Jan 31 + 1 month -> Feb 28/29)
                    try:
                        end_dt = start_dt.replace(year=new_year, month=new_month)
                    except ValueError:
                        # Day doesn't exist in target month (e.g., Feb 31), use last day of month
                        last_day = monthrange(new_year, new_month)[1]
                        end_dt = start_dt.replace(year=new_year, month=new_month, day=min(start_dt.day, last_day))
                    end_date = end_dt.strftime('%Y-%m-%d')
                    
                    # Generate assurance number if missing
                    assurance_number = aff.get('assuranceNumber')
                    if not assurance_number:
                        date_str = datetime.now().strftime('%Y%m%d')
                        random_suffix = secrets.randbelow(1000)
                        assurance_number = f'ASS-{date_str}-{random_suffix:03d}'
                    
                    data['affiliation'] = {
                        'assuranceNumber': assurance_number,
                        'startDate': start_date,
                        'endDate': end_date,
                        'duration': duration,
                    }
        return data


class PatientResponse(PatientBase):
    id: int
    registrationDate: datetime
    createdBy: str
    createdAt: datetime
    updatedAt: datetime
    updatedBy: str

    class Config:
        from_attributes = True

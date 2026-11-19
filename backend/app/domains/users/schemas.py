"""
Pydantic schemas for User
"""
from datetime import datetime

from app.shared.clinical import EMPLOYEE_NUMBER_PATTERN
from app.shared.generated.enums import UserRole
from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserBase(BaseModel):
    username: str
    name: str
    role: UserRole
    email: str | None = None
    phone: str | None = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    password: str | None = Field(None, min_length=8)
    role: UserRole | None = None
    isActive: bool | None = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserResponse(UserBase):
    """Admin/auth user payload. `loggedInAt` is the persisted last login time."""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., pattern=EMPLOYEE_NUMBER_PATTERN)
    createdAt: datetime
    isActive: bool = True
    loggedInAt: datetime | None = None


class UserLookupResponse(BaseModel):
    """Minimal user info for display/lookup purposes (accessible to all authenticated users)"""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., pattern=EMPLOYEE_NUMBER_PATTERN)
    name: str
    username: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class SetupStatusResponse(BaseModel):
    """Whether the login screen should collect the first administrator."""

    required: bool


class FirstAdminSetupRequest(BaseModel):
    """Public first-account payload. Role is always administrator."""

    username: str
    password: str
    name: str
    email: str | None = None

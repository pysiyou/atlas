"""
Pydantic schemas for User
"""
from datetime import datetime

from app.platform.utils import EMPLOYEE_NUMBER_PATTERN
from app.shared.contracts.enums import UserRole
from pydantic import BaseModel, ConfigDict, Field


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
    password: str | None = None
    role: UserRole | None = None
    isActive: bool | None = None


class UserResponse(UserBase):
    """Admin/auth user payload. `loggedInAt` is the persisted last login time."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    employeeNumber: str = Field(..., pattern=EMPLOYEE_NUMBER_PATTERN)
    createdAt: datetime
    isActive: bool = True
    loggedInAt: datetime | None = None


class UserLookupResponse(BaseModel):
    """Minimal user info for display/lookup purposes (accessible to all authenticated users)"""

    model_config = ConfigDict(from_attributes=True)

    id: int
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

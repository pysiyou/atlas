"""
Pydantic schemas for User
"""
from pydantic import BaseModel
from datetime import datetime
from app.schemas.enums import UserRole


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


class UserResponse(UserBase):
    id: int
    createdAt: datetime
    loggedInAt: datetime | None = None  # Set by /auth/me to current time; frontend AuthUser expects it

    class Config:
        from_attributes = True


class UserLookupResponse(BaseModel):
    """Minimal user info for display/lookup purposes (accessible to all authenticated users)"""
    id: int
    name: str
    username: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole


class TokenData(BaseModel):
    user_id: int | None = None


class LoginRequest(BaseModel):
    username: str
    password: str

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
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str

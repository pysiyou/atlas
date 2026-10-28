"""Pydantic schemas for referent doctors."""
import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9._-]{3,100}$")


def _optional_strip(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped if stripped else None


class ReferentDoctorCreate(BaseModel):
    fullName: str = Field(..., min_length=1, max_length=200)
    username: str | None = Field(None, min_length=3, max_length=100)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    hospitalName: str | None = Field(None, max_length=200)

    @field_validator("username", "email", "phone", "hospitalName", mode="before")
    @classmethod
    def empty_strings_to_none(cls, value: object) -> object:
        if isinstance(value, str):
            return _optional_strip(value)
        return value

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not _USERNAME_PATTERN.match(value):
            raise ValueError(
                "Username must be 3–100 characters and use letters, numbers, dots, dashes, or underscores"
            )
        return value.lower()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not _EMAIL_PATTERN.match(value):
            raise ValueError("Invalid email format")
        return value


class ReferentDoctorResponse(BaseModel):
    referentDoctorId: int
    fullName: str
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    hospitalName: str | None = None
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

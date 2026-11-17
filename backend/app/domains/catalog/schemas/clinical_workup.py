"""Pydantic schemas for clinical workups."""
from datetime import datetime

from pydantic import BaseModel, Field


class ClinicalWorkupResponse(BaseModel):
    code: str
    name: str
    description: str | None = None
    testCodes: list[str] = Field(default_factory=list)
    isActive: bool = True
    createdAt: datetime | None = None
    updatedAt: datetime | None = None

    model_config = {"from_attributes": True}
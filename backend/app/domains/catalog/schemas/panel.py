"""Pydantic schemas for orderable catalog panels."""
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class CatalogPanelBase(BaseModel):
    """Shared panel fields."""

    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    memberTestCodes: list[str] = Field(..., min_length=1)
    price: float | None = Field(None, ge=0)
    isActive: bool = True

    @field_validator("memberTestCodes")
    @classmethod
    def unique_member_codes(cls, value: list[str]) -> list[str]:
        """Keep first-seen order while rejecting empty or duplicate codes."""
        unique: list[str] = []
        seen: set[str] = set()
        for raw in value:
            code = raw.strip()
            if not code or code in seen:
                continue
            seen.add(code)
            unique.append(code)
        if not unique:
            raise ValueError("Panel must include at least one member test code")
        return unique


class CatalogPanelResponse(CatalogPanelBase):
    """Persisted panel row."""

    code: str
    createdAt: datetime | None = None
    updatedAt: datetime | None = None

    class Config:
        from_attributes = True

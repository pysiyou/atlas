"""Shared status presentation model for API responses."""
from __future__ import annotations

from pydantic import BaseModel, Field


class StatusPresentation(BaseModel):
    """UI-facing primary status and optional secondary reason label."""

    primary: str = Field(..., description="Canonical presentation primary (e.g. pending, blocked)")
    secondary: str | None = Field(
        None, description="Human reason when blocked or rejected (from contracts)"
    )
    variant: str = Field(..., description="Badge color token aligned with frontend BadgeColor")

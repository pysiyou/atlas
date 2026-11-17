"""Pydantic schemas for catalog analytes."""
from pydantic import BaseModel


class AnalyteSummaryResponse(BaseModel):
    analyteCode: str
    name: str
    loincCode: str | None = None
    unit: str | None = None


class AnalyteResponse(AnalyteSummaryResponse):
    specimen: str | None = None
    definition: dict | None = None

    model_config = {"from_attributes": True}
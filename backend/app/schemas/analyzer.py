"""Analyzer integration API schemas."""
from datetime import datetime

from pydantic import BaseModel


class HL7MessageRequest(BaseModel):
    message: str
    analyzer_id: str | None = None


class AnalyzerResultRequest(BaseModel):
    specimen_id: str
    test_code: str
    results: dict
    analyzer_id: str | None = None
    observation_datetime: datetime | None = None


class AnalyzerResultResponse(BaseModel):
    success: bool
    message: str
    order_id: int | None = None
    test_id: int | None = None
    status: str | None = None
    warnings: list[str] = []

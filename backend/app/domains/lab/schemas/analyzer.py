"""Analyzer integration API schemas."""
from datetime import datetime

from app.platform.utils import ANALYZER_ID_PATTERN
from pydantic import BaseModel, Field


class HL7MessageRequest(BaseModel):
    message: str
    analyzer_id: str | None = Field(None, pattern=ANALYZER_ID_PATTERN)


class AnalyzerResultRequest(BaseModel):
    """JSON ingest: specimen_id is the accession (SPM-2), not the integer sample PK."""

    specimen_id: str
    test_code: str
    results: dict
    analyzer_id: str | None = Field(None, pattern=ANALYZER_ID_PATTERN)
    observation_datetime: datetime | None = None
    correlation_id: str | None = None


class AnalyzerResultResponse(BaseModel):
    success: bool
    message: str
    order_id: int | None = None
    test_id: int | None = None
    status: str | None = None
    warnings: list[str] = []

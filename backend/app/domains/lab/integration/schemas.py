"""Analyzer integration API schemas."""
from __future__ import annotations

from datetime import datetime

from app.shared.clinical import (
    ANALYZER_ID_PATTERN,
    SPECIMEN_INGEST_PATTERN,
    TEST_MNEMONIC_PATTERN,
)
from pydantic import BaseModel, Field


class AnalyzerResultRequest(BaseModel):
    """REST ingest: specimen_id is the accession, not the integer sample PK."""

    specimen_id: str = Field(..., pattern=SPECIMEN_INGEST_PATTERN)
    test_code: str = Field(..., pattern=TEST_MNEMONIC_PATTERN, min_length=2, max_length=8)
    results: dict
    analyzer_id: str | None = Field(None, pattern=ANALYZER_ID_PATTERN)
    observation_datetime: datetime | None = None
    correlation_id: str | None = Field(None, max_length=255)


class AnalyzerResultResponse(BaseModel):
    success: bool
    message: str
    order_id: str | None = None
    test_id: int | None = None
    status: str | None = None
    warnings: list[str] = []

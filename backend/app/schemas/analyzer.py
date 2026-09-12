"""Analyzer integration API schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class HL7MessageRequest(BaseModel):
    message: str
    analyzer_id: Optional[str] = None


class AnalyzerResultRequest(BaseModel):
    specimen_id: str
    test_code: str
    results: dict
    analyzer_id: Optional[str] = None
    observation_datetime: Optional[datetime] = None


class AnalyzerResultResponse(BaseModel):
    success: bool
    message: str
    order_id: Optional[int] = None
    test_id: Optional[int] = None
    status: Optional[str] = None
    warnings: List[str] = []

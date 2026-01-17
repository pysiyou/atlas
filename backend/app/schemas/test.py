"""
Pydantic schemas for Test Catalog
"""
from pydantic import BaseModel
from datetime import datetime


class TestBase(BaseModel):
    code: str
    name: str
    displayName: str
    category: str
    price: float
    turnaroundTimeHours: int
    sampleType: str
    containerTypes: list[str]
    containerTopColors: list[str]
    isActive: bool = True


class TestCreate(TestBase):
    synonyms: list[str] | None = None
    sampleVolume: str | None = None
    minimumVolume: float | None = None
    optimalVolume: float | None = None
    numberOfContainers: int | None = None
    containerDescription: str | None = None
    specialRequirements: str | None = None
    fastingRequired: bool = False
    collectionNotes: str | None = None
    rejectionCriteria: list[str] | None = None
    referenceRanges: dict | None = None
    resultItems: dict | None = None
    panels: list[str] | None = None
    loincCodes: list[str] | None = None
    methodology: str | None = None
    confidence: str | None = None
    notes: str | None = None


class TestUpdate(BaseModel):
    price: float | None = None
    isActive: bool | None = None


class TestResponse(TestBase):
    synonyms: list[str] | None = None
    sampleVolume: str | None = None
    minimumVolume: float | None = None
    optimalVolume: float | None = None
    numberOfContainers: int | None = None
    containerDescription: str | None = None
    specialRequirements: str | None = None
    fastingRequired: bool | None = None
    collectionNotes: str | None = None
    rejectionCriteria: list[str] | None = None
    referenceRanges: dict | None = None
    resultItems: dict | None = None
    panels: list[str] | None = None
    loincCodes: list[str] | None = None
    methodology: str | None = None
    confidence: str | None = None
    notes: str | None = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

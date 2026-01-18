"""
Test Catalog Model - All fields use camelCase
"""
from sqlalchemy import Column, String, Float, Integer, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Test(Base):
    __tablename__ = "tests"

    code = Column(String, primary_key=True, index=True)  # e.g., HEM001
    name = Column(String, nullable=False, index=True)
    displayName = Column(String, nullable=False)
    synonyms = Column(JSON, nullable=True)  # Array of alternative names
    category = Column(String, nullable=False, index=True)

    # Pricing and timing
    price = Column(Float, nullable=False)
    turnaroundTimeHours = Column(Integer, nullable=False)

    # Sample requirements (JSON)
    sampleType = Column(String, nullable=False)
    sampleVolume = Column(String, nullable=True)
    minimumVolume = Column(Float, nullable=True)
    optimalVolume = Column(Float, nullable=True)

    # Container requirements
    containerTypes = Column(JSON, nullable=False)  # Array of ContainerType
    containerTopColors = Column(JSON, nullable=False)  # Array of ContainerTopColor
    numberOfContainers = Column(Integer, nullable=True)
    containerDescription = Column(String, nullable=True)

    # Special requirements
    specialRequirements = Column(String, nullable=True)
    fastingRequired = Column(Boolean, default=False)
    collectionNotes = Column(String, nullable=True)
    rejectionCriteria = Column(JSON, nullable=True)  # Array of strings

    # Reference ranges and parameters (JSON)
    referenceRanges = Column(JSON, nullable=True)  # Array of ReferenceRange objects
    resultItems = Column(JSON, nullable=True)  # Array of ResultItem objects from catalog

    # Additional catalog fields
    panels = Column(JSON, nullable=True)  # Related test panels
    loincCodes = Column(JSON, nullable=True)  # LOINC codes
    methodology = Column(String, nullable=True)
    confidence = Column(String, nullable=True)  # HIGH, MEDIUM, LOW
    notes = Column(String, nullable=True)

    # Status
    isActive = Column(Boolean, default=True)

    # Metadata
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

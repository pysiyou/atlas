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
    displayName = Column("display_name", String, nullable=False)
    synonyms = Column(JSON, nullable=True)  # Array of alternative names
    category = Column(String, nullable=False, index=True)

    # Pricing and timing
    price = Column(Float, nullable=False)
    turnaroundTimeHours = Column("turnaround_time_hours", Integer, nullable=False)

    # Sample requirements (JSON)
    sampleType = Column("sample_type", String, nullable=False)
    sampleVolume = Column("sample_volume", String, nullable=True)
    minimumVolume = Column("minimum_volume", Float, nullable=True)
    optimalVolume = Column("optimal_volume", Float, nullable=True)

    # Container requirements
    containerTypes = Column("container_types", JSON, nullable=False)  # Array of ContainerType
    containerTopColors = Column("container_top_colors", JSON, nullable=False)  # Array of ContainerTopColor
    numberOfContainers = Column("number_of_containers", Integer, nullable=True)
    containerDescription = Column("container_description", String, nullable=True)

    # Special requirements
    specialRequirements = Column("special_requirements", String, nullable=True)
    fastingRequired = Column("fasting_required", Boolean, default=False)
    collectionNotes = Column("collection_notes", String, nullable=True)
    rejectionCriteria = Column("rejection_criteria", JSON, nullable=True)  # Array of strings

    # Reference ranges and parameters (JSON)
    referenceRanges = Column("reference_ranges", JSON, nullable=True)  # Array of ReferenceRange objects
    resultItems = Column("result_items", JSON, nullable=True)  # Array of ResultItem objects from catalog

    # Additional catalog fields
    panels = Column(JSON, nullable=True)  # Related test panels
    loincCodes = Column("loinc_codes", JSON, nullable=True)  # LOINC codes
    methodology = Column(String, nullable=True)
    confidence = Column(String, nullable=True)  # HIGH, MEDIUM, LOW
    notes = Column(String, nullable=True)

    # Status
    isActive = Column("is_active", Boolean, default=True)

    # Metadata
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

"""
Test Catalog Model
"""
from sqlalchemy import Column, String, Float, Integer, Boolean, JSON, Enum, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Test(Base):
    __tablename__ = "tests"
    
    code = Column(String, primary_key=True, index=True)  # e.g., HEM001
    name = Column(String, nullable=False, index=True)
    display_name = Column(String, nullable=False)
    synonyms = Column(JSON, nullable=True)  # Array of alternative names
    category = Column(String, nullable=False, index=True)
    
    # Pricing and timing
    price = Column(Float, nullable=False)
    turnaround_time_hours = Column(Integer, nullable=False)
    
    # Sample requirements (JSON)
    sample_type = Column(String, nullable=False)
    sample_volume = Column(String, nullable=True)
    minimum_volume = Column(Float, nullable=True)
    optimal_volume = Column(Float, nullable=True)
    
    # Container requirements
    container_types = Column(JSON, nullable=False)  # Array of ContainerType
    container_top_colors = Column(JSON, nullable=False)  # Array of ContainerTopColor
    number_of_containers = Column(Integer, nullable=True)
    container_description = Column(String, nullable=True)
    
    # Special requirements
    special_requirements = Column(String, nullable=True)
    fasting_required = Column(Boolean, default=False)
    collection_notes = Column(String, nullable=True)
    rejection_criteria = Column(JSON, nullable=True)  # Array of strings
    
    # Reference ranges and parameters (JSON)
    reference_ranges = Column(JSON, nullable=True)  # Array of ReferenceRange objects
    result_items = Column(JSON, nullable=True)  # Array of ResultItem objects from catalog
    
    # Additional catalog fields
    panels = Column(JSON, nullable=True)  # Related test panels
    loinc_codes = Column(JSON, nullable=True)  # LOINC codes
    methodology = Column(String, nullable=True)
    confidence = Column(String, nullable=True)  # HIGH, MEDIUM, LOW
    notes = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

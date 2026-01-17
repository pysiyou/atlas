"""
Sample Model
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import SampleStatus, SampleType, ContainerType, ContainerTopColor, PriorityLevel


class Sample(Base):
    __tablename__ = "samples"
    
    sample_id = Column(String, primary_key=True, index=True)  # SAM-YYYYMMDD-XXX
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False, index=True)
    sample_type = Column(Enum(SampleType), nullable=False)
    status = Column(Enum(SampleStatus), nullable=False, default=SampleStatus.PENDING)
    
    # What this sample is for
    test_codes = Column(JSON, nullable=False)  # Array of test codes
    required_volume = Column(Float, nullable=False)
    priority = Column(Enum(PriorityLevel), nullable=False)
    
    # Required specs
    required_container_types = Column(JSON, nullable=False)  # Array of ContainerType
    required_container_colors = Column(JSON, nullable=False)  # Array of ContainerTopColor
    
    # Collection info (only when status = collected or rejected)
    collected_at = Column(DateTime(timezone=True), nullable=True)
    collected_by = Column(String, nullable=True)
    collected_volume = Column(Float, nullable=True)
    
    # Actual container used (only when collected)
    actual_container_type = Column(Enum(ContainerType), nullable=True)
    actual_container_color = Column(Enum(ContainerTopColor), nullable=True)
    
    # Optional collection fields
    collection_notes = Column(String, nullable=True)
    remaining_volume = Column(Float, nullable=True)
    
    # Quality assessment
    quality_issues = Column(JSON, nullable=True)  # Array of RejectionReason
    quality_notes = Column(String, nullable=True)
    
    # Rejection info (only when status = rejected)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    rejected_by = Column(String, nullable=True)
    rejection_reasons = Column(JSON, nullable=True)  # Array of RejectionReason
    rejection_notes = Column(String, nullable=True)
    
    # Recollection
    recollection_required = Column(Boolean, default=False)
    recollection_sample_id = Column(String, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(String, nullable=False)

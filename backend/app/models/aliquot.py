"""
Aliquot Model
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import AliquotStatus, ContainerType


class Aliquot(Base):
    __tablename__ = "aliquots"
    
    aliquot_id = Column(String, primary_key=True, index=True)  # ALQ-YYYYMMDD-XXX
    parent_sample_id = Column(String, ForeignKey("samples.sample_id"), nullable=False, index=True)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    
    # Aliquot details
    aliquot_number = Column(Float, nullable=False)  # 1, 2, 3, etc.
    volume = Column(Float, nullable=False)  # mL in this aliquot
    remaining_volume = Column(Float, nullable=False)  # mL remaining after testing
    
    # Purpose
    linked_test_codes = Column(JSON, nullable=False)  # Array of test codes
    purpose = Column(String, nullable=True)  # e.g., "Sendout tests", "Chemistry panel"
    
    # Container
    container_type = Column(Enum(ContainerType), nullable=False)
    barcode = Column(String, nullable=False, unique=True, index=True)
    
    # Status and location
    status = Column(Enum(AliquotStatus), nullable=False, default=AliquotStatus.AVAILABLE)
    current_location = Column(String, nullable=False)
    
    # Usage tracking
    used_for_tests = Column(JSON, nullable=True)  # Array of test codes that have consumed this
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    consumed_by = Column(String, nullable=True)
    
    # Storage
    storage_location = Column(String, nullable=True)
    storage_conditions = Column(String, nullable=True)
    
    # Disposal
    disposed_at = Column(DateTime(timezone=True), nullable=True)
    disposed_by = Column(String, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, nullable=False)

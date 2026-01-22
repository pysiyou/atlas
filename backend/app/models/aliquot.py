"""
Aliquot Model - All fields use camelCase
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import AliquotStatus, ContainerType


class Aliquot(Base):
    __tablename__ = "aliquots"

    aliquotId = Column("aliquot_id", String, primary_key=True, index=True)  # ALQ-YYYYMMDD-XXX
    parentSampleId = Column("parent_sample_id", String, ForeignKey("samples.sample_id"), nullable=False, index=True)
    orderId = Column("order_id", String, ForeignKey("orders.order_id"), nullable=False, index=True)
    patientId = Column("patient_id", String, ForeignKey("patients.id"), nullable=False)

    # Aliquot details
    aliquotNumber = Column("aliquot_number", Float, nullable=False)  # 1, 2, 3, etc.
    volume = Column(Float, nullable=False)  # mL in this aliquot
    remainingVolume = Column("remaining_volume", Float, nullable=False)  # mL remaining after testing

    # Purpose
    linkedTestCodes = Column("linked_test_codes", JSON, nullable=False)  # Array of test codes
    purpose = Column(String, nullable=True)  # e.g., "Sendout tests", "Chemistry panel"

    # Container
    containerType = Column("container_type", Enum(ContainerType), nullable=False)
    barcode = Column(String, nullable=False, unique=True, index=True)

    # Status and location
    status = Column(Enum(AliquotStatus), nullable=False, default=AliquotStatus.AVAILABLE)
    currentLocation = Column("current_location", String, nullable=False)

    # Usage tracking
    usedForTests = Column("used_for_tests", JSON, nullable=True)  # Array of test codes that have consumed this
    consumedAt = Column("consumed_at", DateTime(timezone=True), nullable=True)
    consumedBy = Column("consumed_by", String, nullable=True)

    # Storage
    storageLocation = Column("storage_location", String, nullable=True)
    storageConditions = Column("storage_conditions", String, nullable=True)

    # Disposal
    disposedAt = Column("disposed_at", DateTime(timezone=True), nullable=True)
    disposedBy = Column("disposed_by", String, nullable=True)

    # Metadata
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    createdBy = Column("created_by", String, nullable=False)

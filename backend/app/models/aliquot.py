"""
Aliquot Model - All fields use camelCase
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import AliquotStatus, ContainerType


class Aliquot(Base):
    __tablename__ = "aliquots"

    aliquotId = Column(String, primary_key=True, index=True)  # ALQ-YYYYMMDD-XXX
    parentSampleId = Column(String, ForeignKey("samples.sampleId"), nullable=False, index=True)
    orderId = Column(String, ForeignKey("orders.orderId"), nullable=False, index=True)
    patientId = Column(String, ForeignKey("patients.id"), nullable=False)

    # Aliquot details
    aliquotNumber = Column(Float, nullable=False)  # 1, 2, 3, etc.
    volume = Column(Float, nullable=False)  # mL in this aliquot
    remainingVolume = Column(Float, nullable=False)  # mL remaining after testing

    # Purpose
    linkedTestCodes = Column(JSON, nullable=False)  # Array of test codes
    purpose = Column(String, nullable=True)  # e.g., "Sendout tests", "Chemistry panel"

    # Container
    containerType = Column(Enum(ContainerType), nullable=False)
    barcode = Column(String, nullable=False, unique=True, index=True)

    # Status and location
    status = Column(Enum(AliquotStatus), nullable=False, default=AliquotStatus.AVAILABLE)
    currentLocation = Column(String, nullable=False)

    # Usage tracking
    usedForTests = Column(JSON, nullable=True)  # Array of test codes that have consumed this
    consumedAt = Column(DateTime(timezone=True), nullable=True)
    consumedBy = Column(String, nullable=True)

    # Storage
    storageLocation = Column(String, nullable=True)
    storageConditions = Column(String, nullable=True)

    # Disposal
    disposedAt = Column(DateTime(timezone=True), nullable=True)
    disposedBy = Column(String, nullable=True)

    # Metadata
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    createdBy = Column(String, nullable=False)

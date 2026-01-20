"""
Sample Model - All fields use camelCase
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey, Boolean, Integer
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import SampleStatus, SampleType, ContainerType, ContainerTopColor, PriorityLevel


class Sample(Base):
    __tablename__ = "samples"

    sampleId = Column(String, primary_key=True, index=True)  # SAM-YYYYMMDD-XXX
    orderId = Column(String, ForeignKey("orders.orderId"), nullable=False, index=True)
    sampleType = Column(Enum(SampleType), nullable=False)
    status = Column(Enum(SampleStatus), nullable=False, default=SampleStatus.PENDING, index=True)

    # What this sample is for
    testCodes = Column(JSON, nullable=False)  # Array of test codes
    requiredVolume = Column(Float, nullable=False)
    priority = Column(Enum(PriorityLevel), nullable=False)

    # Required specs
    requiredContainerTypes = Column(JSON, nullable=False)  # Array of ContainerType
    requiredContainerColors = Column(JSON, nullable=False)  # Array of ContainerTopColor

    # Collection info (only when status = collected or rejected)
    collectedAt = Column(DateTime(timezone=True), nullable=True)
    collectedBy = Column(String, nullable=True)
    collectedVolume = Column(Float, nullable=True)

    # Actual container used (only when collected)
    actualContainerType = Column(Enum(ContainerType), nullable=True)
    actualContainerColor = Column(Enum(ContainerTopColor), nullable=True)

    # Optional collection fields
    collectionNotes = Column(String, nullable=True)
    remainingVolume = Column(Float, nullable=True)

    # Quality assessment
    qualityIssues = Column(JSON, nullable=True)  # Array of RejectionReason
    qualityNotes = Column(String, nullable=True)

    # Rejection info (only when status = rejected)
    rejectedAt = Column(DateTime(timezone=True), nullable=True)
    rejectedBy = Column(String, nullable=True)
    rejectionReasons = Column(JSON, nullable=True)  # Array of RejectionReason
    rejectionNotes = Column(String, nullable=True)
    rejectionHistory = Column(JSON, nullable=True, default=list)  # Array of rejection records

    # Recollection
    recollectionRequired = Column(Boolean, default=False)
    recollectionSampleId = Column(String, nullable=True)
    
    # New fields for recollection tracking
    isRecollection = Column(Boolean, default=False)
    originalSampleId = Column(String, nullable=True)  # Pointer to the sample this replaced
    recollectionReason = Column(String, nullable=True)
    recollectionAttempt = Column(Integer, default=1)  # 1 = original/first collection, 2 = 1st recollection, etc.

    # Metadata
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    createdBy = Column(String, nullable=False)
    updatedAt = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updatedBy = Column(String, nullable=False)

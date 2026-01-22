"""
Sample Model - All fields use camelCase
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum, ForeignKey, Boolean, Integer
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import SampleStatus, SampleType, ContainerType, ContainerTopColor, PriorityLevel


class Sample(Base):
    __tablename__ = "samples"

    sampleId = Column("sample_id", String, primary_key=True, index=True)  # SAM-YYYYMMDD-XXX
    orderId = Column("order_id", String, ForeignKey("orders.order_id"), nullable=False, index=True)
    sampleType = Column("sample_type", Enum(SampleType), nullable=False)
    status = Column(Enum(SampleStatus), nullable=False, default=SampleStatus.PENDING, index=True)

    # What this sample is for
    testCodes = Column("test_codes", JSON, nullable=False)  # Array of test codes
    requiredVolume = Column("required_volume", Float, nullable=False)
    priority = Column(Enum(PriorityLevel), nullable=False)

    # Required specs
    requiredContainerTypes = Column("required_container_types", JSON, nullable=False)  # Array of ContainerType
    requiredContainerColors = Column("required_container_colors", JSON, nullable=False)  # Array of ContainerTopColor

    # Collection info (only when status = collected or rejected)
    collectedAt = Column("collected_at", DateTime(timezone=True), nullable=True)
    collectedBy = Column("collected_by", String, nullable=True)
    collectedVolume = Column("collected_volume", Float, nullable=True)

    # Actual container used (only when collected)
    actualContainerType = Column("actual_container_type", Enum(ContainerType), nullable=True)
    actualContainerColor = Column("actual_container_color", Enum(ContainerTopColor), nullable=True)

    # Optional collection fields
    collectionNotes = Column("collection_notes", String, nullable=True)
    remainingVolume = Column("remaining_volume", Float, nullable=True)

    # Quality assessment
    qualityIssues = Column("quality_issues", JSON, nullable=True)  # Array of RejectionReason
    qualityNotes = Column("quality_notes", String, nullable=True)

    # Rejection info (only when status = rejected)
    rejectedAt = Column("rejected_at", DateTime(timezone=True), nullable=True)
    rejectedBy = Column("rejected_by", String, nullable=True)
    rejectionReasons = Column("rejection_reasons", JSON, nullable=True)  # Array of RejectionReason
    rejectionNotes = Column("rejection_notes", String, nullable=True)
    rejectionHistory = Column("rejection_history", JSON, nullable=True, default=list)  # Array of rejection records

    # Recollection
    recollectionRequired = Column("recollection_required", Boolean, default=False)
    recollectionSampleId = Column("recollection_sample_id", String, nullable=True)
    
    # New fields for recollection tracking
    isRecollection = Column("is_recollection", Boolean, default=False)
    originalSampleId = Column("original_sample_id", String, nullable=True)  # Pointer to the sample this replaced
    recollectionReason = Column("recollection_reason", String, nullable=True)
    recollectionAttempt = Column("recollection_attempt", Integer, default=1)  # 1 = original/first collection, 2 = 1st recollection, etc.

    # Metadata
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    createdBy = Column("created_by", String, nullable=False)
    updatedAt = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updatedBy = Column("updated_by", String, nullable=False)

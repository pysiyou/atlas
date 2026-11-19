"""Sample Model - All fields use camelCase."""
from __future__ import annotations
from app.platform.database import Base, contract_enum
from app.shared.generated.enums import (
    ContainerTopColor,
    ContainerType,
    PriorityLevel,
    SampleStatus,
    SampleType,
)
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func


class Sample(Base):
    __tablename__ = "samples"

    sampleId = Column("sample_id", String(20), primary_key=True, index=True)
    orderId = Column("order_id", String(13), ForeignKey("orders.order_id"), nullable=False, index=True)
    sampleType = Column("sample_type", contract_enum(SampleType), nullable=False)
    status = Column(
        contract_enum(SampleStatus), nullable=False, default=SampleStatus.PENDING, index=True
    )

    # What this sample is for
    testCodes = Column("test_codes", JSON, nullable=False)  # Array of test codes
    requiredVolume = Column("required_volume", Float, nullable=False)
    optimalVolume = Column(
        "optimal_volume",
        Float,
        nullable=False,
        default=0.0,
        server_default="0",
    )
    priority = Column(contract_enum(PriorityLevel), nullable=False)

    # Required specs
    requiredContainerTypes = Column(
        "required_container_types", JSON, nullable=False
    )  # Array of ContainerType
    requiredContainerColors = Column(
        "required_container_colors", JSON, nullable=False
    )  # Array of ContainerTopColor

    # Collection info (only when status = collected or rejected)
    collectedAt = Column("collected_at", DateTime(timezone=True), nullable=True)
    collectedBy = Column("collected_by", String, nullable=True)
    collectedVolume = Column("collected_volume", Float, nullable=True)
    receivedVolumeMl = Column("received_volume_ml", Float, nullable=True)

    # Actual container used (only when collected)
    actualContainerType = Column(
        "actual_container_type", contract_enum(ContainerType), nullable=True
    )
    actualContainerColor = Column(
        "actual_container_color", contract_enum(ContainerTopColor), nullable=True
    )

    # Optional collection fields
    collectionNotes = Column("collection_notes", String, nullable=True)
    remainingVolume = Column("remaining_volume", Float, nullable=True)

    # Quality assessment
    qualityIssues = Column("quality_issues", JSON, nullable=True)  # Registry reason ids
    qualityNotes = Column("quality_notes", String, nullable=True)

    # Rejection info (only when status = rejected)
    rejectedAt = Column("rejected_at", DateTime(timezone=True), nullable=True)
    rejectedBy = Column("rejected_by", String, nullable=True)
    rejectionReason = Column(
        "rejection_reason", String, nullable=True
    )  # Catalog rejection criterion
    rejectionNotes = Column("rejection_notes", String, nullable=True)
    # Recollection
    recollectionRequired = Column("recollection_required", Boolean, default=False)
    recollectionSampleId = Column("recollection_sample_id", String(20), nullable=True)

    # New fields for recollection tracking
    isRecollection = Column("is_recollection", Boolean, default=False)
    recollectionReason = Column("recollection_reason", String, nullable=True)
    recollectionAttempt = Column(
        "recollection_attempt", Integer, default=1
    )  # 1 = original/first collection, 2 = 1st recollection, etc.

    parentSampleId = Column(
        "parent_sample_id",
        String(20),
        ForeignKey("samples.sample_id"),
        nullable=True,
        index=True,
    )
    originalSampleId = Column(
        "original_sample_id",
        String(20),
        ForeignKey("samples.sample_id"),
        nullable=True,
    )
    isAliquot = Column("is_aliquot", Boolean, default=False)
    aliquotIndex = Column("aliquot_index", Integer, nullable=True)
    aliquotVolume = Column("aliquot_volume", Float, nullable=True)

    # Metadata
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    createdBy = Column("created_by", String, nullable=False)
    updatedAt = Column(
        "updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    updatedBy = Column("updated_by", String, nullable=False)

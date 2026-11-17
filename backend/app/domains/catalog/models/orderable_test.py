"""Orderable laboratory test (panel or single-analyte order)."""
from __future__ import annotations

from app.platform.database import Base
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class OrderableTest(Base):
    __tablename__ = "orderable_tests"

    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    displayName = Column("display_name", String, nullable=False)
    synonyms = Column(JSON, nullable=True)
    category = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    turnaroundTimeHours = Column("turnaround_time_hours", Integer, nullable=False)
    sampleType = Column("sample_type", String, nullable=False)
    sampleVolume = Column("sample_volume", String, nullable=True)
    minimumVolume = Column("minimum_volume", Float, nullable=True)
    optimalVolume = Column("optimal_volume", Float, nullable=True)
    containerTypes = Column("container_types", JSON, nullable=False)
    containerTopColors = Column("container_top_colors", JSON, nullable=False)
    numberOfContainers = Column("number_of_containers", Integer, nullable=True)
    containerDescription = Column("container_description", String, nullable=True)
    specialRequirements = Column("special_requirements", String, nullable=True)
    fastingRequired = Column("fasting_required", Boolean, default=False)
    collectionNotes = Column("collection_notes", String, nullable=True)
    rejectionCriteria = Column("rejection_criteria", JSON, nullable=True)
    validationRejectionCriteria = Column("validation_rejection_criteria", JSON, nullable=True)
    loincCode = Column("loinc_code", String, nullable=True)
    methodology = Column(String, nullable=True)
    confidence = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    isActive = Column("is_active", Boolean, default=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    analyteLinks = relationship(
        "OrderableTestAnalyte",
        back_populates="test",
        cascade="all, delete-orphan",
        order_by="OrderableTestAnalyte.sortOrder",
    )
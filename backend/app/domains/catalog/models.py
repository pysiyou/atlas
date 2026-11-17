"""Catalog ORM models — analytes, orderable tests, workups, affiliation pricing."""
from __future__ import annotations

from app.platform.database import Base
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class CatalogAnalyte(Base):
    __tablename__ = "catalog_analytes"

    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    loincCode = Column("loinc_code", String, nullable=True)
    unit = Column(String, nullable=True)
    specimen = Column(String, nullable=True)
    definition = Column(JSON, nullable=True)
    contractEntry = Column("contract_entry", JSON, nullable=True)
    validationRejectionCriteria = Column("validation_rejection_criteria", JSON, nullable=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


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
    contractEntry = Column("contract_entry", JSON, nullable=True)
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


class OrderableTestAnalyte(Base):
    __tablename__ = "orderable_test_analytes"
    __table_args__ = (UniqueConstraint("test_code", "analyte_code", name="uq_orderable_test_analyte"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    testCode = Column("test_code", String, ForeignKey("orderable_tests.code", ondelete="CASCADE"), nullable=False)
    analyteCode = Column(
        "analyte_code",
        String,
        ForeignKey("catalog_analytes.code", ondelete="CASCADE"),
        nullable=False,
    )
    sortOrder = Column("sort_order", Integer, nullable=False, default=0)

    test = relationship("OrderableTest", back_populates="analyteLinks")
    analyte = relationship("CatalogAnalyte")


class ClinicalWorkup(Base):
    __tablename__ = "clinical_workups"

    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    isActive = Column("is_active", Boolean, default=True, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    testLinks = relationship(
        "ClinicalWorkupTest",
        back_populates="workup",
        cascade="all, delete-orphan",
    )


class ClinicalWorkupTest(Base):
    __tablename__ = "clinical_workup_tests"
    __table_args__ = (UniqueConstraint("workup_code", "test_code", name="uq_clinical_workup_test"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    workupCode = Column(
        "workup_code",
        String,
        ForeignKey("clinical_workups.code", ondelete="CASCADE"),
        nullable=False,
    )
    testCode = Column(
        "test_code",
        String,
        ForeignKey("orderable_tests.code", ondelete="CASCADE"),
        nullable=False,
    )

    workup = relationship("ClinicalWorkup", back_populates="testLinks")
    test = relationship("OrderableTest")


class AffiliationPricing(Base):
    __tablename__ = "affiliation_pricing"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    duration = Column(Integer, nullable=False, unique=True, index=True)
    price = Column(Float, nullable=False)
    isActive = Column("is_active", Boolean, default=True, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
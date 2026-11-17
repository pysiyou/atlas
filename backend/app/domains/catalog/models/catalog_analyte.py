"""Measurable catalog analyte (observation)."""
from __future__ import annotations

from app.platform.database import Base
from sqlalchemy import JSON, Column, DateTime, String
from sqlalchemy.sql import func


class CatalogAnalyte(Base):
    __tablename__ = "catalog_analytes"

    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    loincCode = Column("loinc_code", String, nullable=True)
    unit = Column(String, nullable=True)
    specimen = Column(String, nullable=True)
    definition = Column(JSON, nullable=True)
    validationRejectionCriteria = Column("validation_rejection_criteria", JSON, nullable=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
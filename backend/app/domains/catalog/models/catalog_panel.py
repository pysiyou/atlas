"""Orderable catalog panel — groups member tests for one-click ordering."""
from app.platform.database import Base
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, String
from sqlalchemy.sql import func


class CatalogPanel(Base):
    """Named bundle of catalog test codes (e.g. Complete Hematology Panel)."""

    __tablename__ = "catalog_panels"

    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    memberTestCodes = Column("member_test_codes", JSON, nullable=False)
    price = Column(Float, nullable=True)
    isActive = Column("is_active", Boolean, default=True, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(
        "updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

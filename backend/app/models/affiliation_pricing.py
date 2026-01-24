"""
Affiliation Pricing Model
Stores pricing information for different affiliation durations
"""
from sqlalchemy import Column, Integer, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.enums import AffiliationDuration


class AffiliationPricing(Base):
    __tablename__ = "affiliation_pricing"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    duration = Column(Integer, nullable=False, unique=True, index=True)  # 6, 12, or 24 months
    price = Column(Float, nullable=False)  # Price in local currency
    isActive = Column("is_active", Boolean, default=True, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<AffiliationPricing(duration={self.duration}, price={self.price}, isActive={self.isActive})>"

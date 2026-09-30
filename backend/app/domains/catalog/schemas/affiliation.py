"""Affiliation pricing schemas."""
from pydantic import BaseModel


class AffiliationPricingResponse(BaseModel):
    duration: int
    price: float
    isActive: bool

    class Config:
        from_attributes = True

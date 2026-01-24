"""
Affiliation API Routes
Handles affiliation pricing and purchase operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.affiliation_pricing import AffiliationPricing
from app.schemas.enums import AffiliationDuration
from pydantic import BaseModel

router = APIRouter()


class AffiliationPricingResponse(BaseModel):
    """Response model for affiliation pricing"""
    duration: int
    price: float
    isActive: bool

    class Config:
        from_attributes = True


@router.get("/affiliations/pricing")
def get_affiliation_pricing(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all active affiliation pricing options.
    Returns pricing for 6, 12, and 24 month durations.
    """
    pricing_list = db.query(AffiliationPricing).filter(
        AffiliationPricing.isActive == True
    ).order_by(AffiliationPricing.duration).all()
    
    return [AffiliationPricingResponse.model_validate(p).model_dump() for p in pricing_list]


@router.get("/affiliations/pricing/{duration}")
def get_affiliation_price(
    duration: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get pricing for a specific affiliation duration.
    Valid durations: 6, 12, or 24 months.
    """
    # Validate duration
    valid_durations = [AffiliationDuration.SIX_MONTHS, AffiliationDuration.TWELVE_MONTHS, AffiliationDuration.TWENTY_FOUR_MONTHS]
    if duration not in [d.value for d in valid_durations]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid duration. Valid durations are: 6, 12, or 24 months."
        )
    
    pricing = db.query(AffiliationPricing).filter(
        AffiliationPricing.duration == duration,
        AffiliationPricing.isActive == True
    ).first()
    
    if not pricing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pricing not found for {duration} month duration"
        )
    
    return AffiliationPricingResponse.model_validate(pricing).model_dump()

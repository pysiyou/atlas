"""
Affiliation API Routes
Handles affiliation pricing and purchase operations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
import hashlib
import json
from app.database import get_db
from app.core.dependencies import get_current_user
from app.core.cache import cache_get, cache_set, CacheKeys
from app.config import settings
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
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all active affiliation pricing options.
    Returns pricing for 6, 12, and 24 month durations.
    Results are cached for 1 hour (static data).
    """
    cache_key = CacheKeys.AFFILIATIONS_PRICING

    # Try cache first
    cached_data = cache_get(cache_key)
    if cached_data is not None:
        # Generate ETag and set cache headers
        etag = hashlib.md5(json.dumps(cached_data, sort_keys=True).encode()).hexdigest()
        response.headers["ETag"] = f'"{etag}"'
        response.headers["Cache-Control"] = "public, max-age=3600"

        # Check If-None-Match header
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match.strip('"') == etag:
            response.status_code = 304
            return []

        return cached_data

    # Query database
    pricing_list = db.query(AffiliationPricing).filter(
        AffiliationPricing.isActive == True
    ).order_by(AffiliationPricing.duration).all()

    result = [AffiliationPricingResponse.model_validate(p).model_dump() for p in pricing_list]

    # Cache result
    cache_set(cache_key, result, settings.CACHE_TTL_STATIC)

    # Set cache headers
    etag = hashlib.md5(json.dumps(result, sort_keys=True).encode()).hexdigest()
    response.headers["ETag"] = f'"{etag}"'
    response.headers["Cache-Control"] = "public, max-age=3600"

    return result


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

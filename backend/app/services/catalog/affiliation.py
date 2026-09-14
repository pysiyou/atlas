"""Affiliation pricing business logic."""
from typing import List

from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.cache import CacheKeys, cache_get, cache_set
from app.models.affiliation_pricing import AffiliationPricing
from app.schemas.affiliation import AffiliationPricingResponse
from app.schemas.enums import AffiliationDuration


class AffiliationService:
    def __init__(self, db: Session):
        self.db = db

    def list_pricing(self, response: Response) -> List[dict]:
        response.headers["Cache-Control"] = "private, no-store"
        cache_key = CacheKeys.AFFILIATIONS_PRICING
        cached_data = cache_get(cache_key)
        if cached_data is not None:
            return cached_data

        pricing_list = (
            self.db.query(AffiliationPricing)
            .filter(AffiliationPricing.isActive.is_(True))
            .order_by(AffiliationPricing.duration)
            .all()
        )
        result = [AffiliationPricingResponse.model_validate(p).model_dump() for p in pricing_list]
        cache_set(cache_key, result, settings.CACHE_TTL_STATIC)
        return result

    def get_price(self, duration: int) -> dict:
        valid_durations = [
            AffiliationDuration.SIX_MONTHS,
            AffiliationDuration.TWELVE_MONTHS,
            AffiliationDuration.TWENTY_FOUR_MONTHS,
        ]
        if duration not in [d.value for d in valid_durations]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid duration. Valid durations are: 6, 12, or 24 months.",
            )
        pricing = (
            self.db.query(AffiliationPricing)
            .filter(
                AffiliationPricing.duration == duration,
                AffiliationPricing.isActive.is_(True),
            )
            .first()
        )
        if not pricing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pricing not found for {duration} month duration",
            )
        return AffiliationPricingResponse.model_validate(pricing).model_dump()

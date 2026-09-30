"""Affiliation API Routes"""
from app.domains.catalog.affiliation_pricing_service import AffiliationPricingService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/affiliations/pricing")
def get_affiliation_pricing(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AffiliationPricingService(db).list_pricing(response)


@router.get("/affiliations/pricing/{duration}")
def get_affiliation_price(
    duration: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AffiliationPricingService(db).get_price(duration)

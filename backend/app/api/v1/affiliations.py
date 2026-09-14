"""Affiliation API Routes"""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.services.catalog.affiliation import AffiliationService

router = APIRouter()


@router.get("/affiliations/pricing")
def get_affiliation_pricing(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AffiliationService(db).list_pricing(response)


@router.get("/affiliations/pricing/{duration}")
def get_affiliation_price(
    duration: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AffiliationService(db).get_price(duration)

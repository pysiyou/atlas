"""Catalog panel routes."""
from app.domains.catalog.panel_service import CatalogPanelService
from app.domains.catalog.schemas.panel import CatalogPanelResponse
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http import get_current_user
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/panels", response_model=list[CatalogPanelResponse])
def list_panels(
    activeOnly: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List orderable panels (taxonomy tags inverted into member bundles)."""
    return CatalogPanelService(db).list_panels(active_only=activeOnly)

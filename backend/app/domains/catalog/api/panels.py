"""Catalog panel routes."""
from app.domains.catalog.panel_service import CatalogPanelService
from app.domains.catalog.schemas.panel import (
    CatalogPanelCreate,
    CatalogPanelResponse,
    CatalogPanelUpdate,
)
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, status
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


@router.get("/panels/{code}", response_model=CatalogPanelResponse)
def get_panel(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CatalogPanelService(db).get_by_code(code)


@router.post("/panels", response_model=CatalogPanelResponse, status_code=status.HTTP_201_CREATED)
def create_panel(
    data: CatalogPanelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CatalogPanelService(db).create(data)


@router.put("/panels/{code}", response_model=CatalogPanelResponse)
def update_panel(
    code: str,
    data: CatalogPanelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CatalogPanelService(db).update(code, data)

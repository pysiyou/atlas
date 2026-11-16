"""
Configuration API

Exposes white-label configuration to frontend.
"""
from app.platform.config import client_config
from fastapi import APIRouter

router = APIRouter()


@router.get("/config")
def get_client_config():
    """
    Get client-specific configuration.

    Public (no auth) so the frontend can load branding before login.
    """
    return client_config.to_dict()
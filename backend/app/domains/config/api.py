"""
Configuration API

Exposes white-label configuration to frontend.
"""
import json
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, ValidationError

from app.platform.client_config import client_config, CONFIG_FILE
from app.platform.client_config_models import ClientConfigModel

router = APIRouter()


class ConfigValidationResult(BaseModel):
    """Result of config validation."""

    valid: bool
    errors: list[str] = []
    warnings: list[str] = []
    config: dict[str, Any] | None = None


@router.get("/config")
def get_client_config():
    """
    Get client-specific configuration.

    Public (no auth) so the frontend can load branding before login.
    """
    return client_config.to_dict()


@router.get("/config/validate", response_model=ConfigValidationResult)
def validate_config():
    """Validate `client-config.json` with the same Pydantic model used at startup."""
    if not CONFIG_FILE.exists():
        return ConfigValidationResult(
            valid=False,
            errors=[f"Config file not found: {CONFIG_FILE}"],
        )

    try:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            raw = json.load(f)
    except json.JSONDecodeError as e:
        return ConfigValidationResult(valid=False, errors=[f"Invalid JSON: {e}"])
    except OSError as e:
        return ConfigValidationResult(valid=False, errors=[f"Failed to read config: {e}"])

    warnings: list[str] = []
    try:
        model = ClientConfigModel.model_validate(raw)
    except ValidationError as e:
        return ConfigValidationResult(
            valid=False,
            errors=[f"{err['loc']}: {err['msg']}" for err in e.errors()],
            warnings=warnings,
        )

    if not model.branding.primaryColor.startswith("#"):
        warnings.append("branding.primaryColor should be a hex color (e.g., #0284c7)")
    if not model.company.contact:
        warnings.append("Consider adding company.contact information")
    if not model.terminology:
        warnings.append("Consider adding terminology overrides for custom labels")
    if not model.features:
        warnings.append("Consider adding feature flags to control module visibility")

    return ConfigValidationResult(
        valid=True,
        warnings=warnings,
        config=model.to_dict(),
    )
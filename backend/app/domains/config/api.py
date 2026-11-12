"""
Configuration API

Exposes white-label configuration to frontend.
"""
import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from app.platform.client_config import client_config, CONFIG_FILE

router = APIRouter()


class ConfigValidationResult(BaseModel):
    """Result of config validation"""
    valid: bool
    errors: list[str] = []
    warnings: list[str] = []
    config: dict[str, Any] | None = None


@router.get("/config")
def get_client_config():
    """
    Get client-specific configuration.
    
    This endpoint is public (no auth required) so the frontend
    can load branding/config before user logs in.
    """
    return client_config.to_dict()


@router.get("/config/validate", response_model=ConfigValidationResult)
def validate_config():
    """
    Validate the current configuration file.
    
    Checks if the config file exists, is valid JSON, and matches the schema.
    Returns validation errors and warnings.
    """
    errors = []
    warnings = []
    config_data = None
    
    # Check if config file exists
    if not CONFIG_FILE.exists():
        errors.append(f"Config file not found: {CONFIG_FILE}")
        return ConfigValidationResult(valid=False, errors=errors, warnings=warnings)
    
    # Try to parse JSON
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
    except json.JSONDecodeError as e:
        errors.append(f"Invalid JSON: {str(e)}")
        return ConfigValidationResult(valid=False, errors=errors, warnings=warnings)
    except Exception as e:
        errors.append(f"Failed to read config: {str(e)}")
        return ConfigValidationResult(valid=False, errors=errors, warnings=warnings)
    
    # Check required fields
    if 'company' not in config_data:
        errors.append("Missing required field: company")
    elif not isinstance(config_data['company'], dict):
        errors.append("Field 'company' must be an object")
    else:
        if 'name' not in config_data['company']:
            errors.append("Missing required field: company.name")
        if 'displayName' not in config_data['company']:
            errors.append("Missing required field: company.displayName")
    
    if 'branding' not in config_data:
        errors.append("Missing required field: branding")
    elif not isinstance(config_data['branding'], dict):
        errors.append("Field 'branding' must be an object")
    else:
        if 'logoPath' not in config_data['branding']:
            errors.append("Missing required field: branding.logoPath")
        if 'primaryColor' not in config_data['branding']:
            errors.append("Missing required field: branding.primaryColor")
        elif not isinstance(config_data['branding']['primaryColor'], str):
            errors.append("Field 'branding.primaryColor' must be a string")
        elif not config_data['branding']['primaryColor'].startswith('#'):
            warnings.append("branding.primaryColor should be a hex color (e.g., #0284c7)")
    
    # Check optional but recommended fields
    if 'terminology' in config_data and not isinstance(config_data['terminology'], dict):
        errors.append("Field 'terminology' must be an object")
    
    if 'features' in config_data and not isinstance(config_data['features'], dict):
        errors.append("Field 'features' must be an object")
    
    if 'workflows' in config_data and not isinstance(config_data['workflows'], dict):
        errors.append("Field 'workflows' must be an object")
    
    # Warnings for missing optional fields
    if 'contact' not in config_data.get('company', {}):
        warnings.append("Consider adding company.contact information")
    
    if 'terminology' not in config_data:
        warnings.append("Consider adding terminology overrides for custom labels")
    
    if 'features' not in config_data:
        warnings.append("Consider adding feature flags to control module visibility")
    
    valid = len(errors) == 0
    
    return ConfigValidationResult(
        valid=valid,
        errors=errors,
        warnings=warnings,
        config=config_data if valid else None
    )

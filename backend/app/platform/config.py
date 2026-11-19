"""
Runtime settings (env) and white-label client configuration (JSON).

``settings`` is loaded from the backend ``.env``. ``client_config`` is loaded
from ``config/client-config.json`` and validated by the Pydantic models below.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Environment settings
# ---------------------------------------------------------------------------


class Settings(BaseSettings):
    """Process configuration from environment variables and ``backend/.env``."""

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        case_sensitive=True,
        extra="ignore",
    )

    DATABASE_URL: str = Field(..., description="PostgreSQL connection string (required)")

    SECRET_KEY: str = Field(..., description="JWT secret key (required)")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = Field(default="", description="Comma-separated list of allowed origins")
    ENVIRONMENT: str = Field(default="production", description="production | development")

    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Atlas Laboratory Management System"

    ANALYZER_API_KEY: str = Field(
        default="",
        description="Shared secret for analyzer ingest (X-Analyzer-Key header)",
    )
    ANALYZER_STRICT_VALIDATION: bool = Field(
        default=False,
        description="When true, analyzer ingest fails on catalog validation errors instead of warning-only",
    )

    ARTIFICIAL_DELAY_MS: int = Field(
        default=0,
        description="Optional delay in ms for all API v1 requests (for testing loading UI)",
    )

    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    CACHE_ENABLED: bool = Field(default=True, description="Enable/disable Redis caching")
    CACHE_TTL_STATIC: int = Field(
        default=3600, description="TTL for static data like tests (seconds)"
    )

    REPORTS_DIR: str = Field(default="./storage/reports", description="Directory for issued PDFs")
    UPLOADS_DIR: str = Field(default="./storage/uploads", description="Directory for uploads")

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        if not origins and self.ENVIRONMENT == "development":
            return ["http://localhost:5173"]
        return origins


settings = Settings()


# ---------------------------------------------------------------------------
# White-label client config models (config/client-config.json)
# ---------------------------------------------------------------------------


class AddressConfig(BaseModel):
    """Physical address block inside company contact."""

    street: str
    city: str
    state: str
    zipCode: str = Field(alias="zipCode")
    country: str
    fullAddress: str | None = Field(default=None, alias="fullAddress")

    class Config:
        populate_by_name = True


class ContactConfig(BaseModel):
    """Company contact details."""

    address: AddressConfig
    phone: list[str]
    email: str
    website: str


class CompanyConfig(BaseModel):
    """Company identity shown in the UI and on reports."""

    name: str
    displayName: str = Field(alias="displayName")
    fullName: str | None = Field(default=None, alias="fullName")
    subtitle: str | None = None
    tagline: str | None = None
    version: str | None = None
    copyright: str | None = None
    contact: ContactConfig | None = None

    class Config:
        populate_by_name = True


class TrustIndicatorConfig(BaseModel):
    """Optional login-screen trust line."""

    text: str
    count: str
    audience: str


class BrandingConfig(BaseModel):
    """Visual identity: logo paths and theme colors."""

    logoPath: str = Field(alias="logoPath")
    faviconPath: str | None = Field(default=None, alias="faviconPath")
    primaryColor: str = Field(alias="primaryColor")
    secondaryColor: str | None = Field(default=None, alias="secondaryColor")
    defaultTheme: str | None = Field(default=None, alias="defaultTheme")

    class Config:
        populate_by_name = True

    @field_validator("primaryColor", "secondaryColor")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Accept ``#rgb`` or ``#rrggbb`` hex colors."""
        if v is None:
            return v
        if not v.startswith("#") or len(v) not in [4, 7]:
            raise ValueError(f"Invalid color format: {v}. Must be hex color (#rgb or #rrggbb)")
        return v


class ReportsConfig(BaseModel):
    """PDF report header/footer options."""

    headerText: str | None = Field(default=None, alias="headerText")
    footerText: str | None = Field(default=None, alias="footerText")
    includeSignature: bool | None = Field(default=True, alias="includeSignature")

    class Config:
        populate_by_name = True


class MarketingConfig(BaseModel):
    """Optional login-screen marketing copy."""

    features: list[str] | None = None
    description: str | None = None
    trustIndicator: TrustIndicatorConfig | None = Field(default=None, alias="trustIndicator")

    class Config:
        populate_by_name = True


class ClientConfigModel(BaseModel):
    """Validated shape of ``config/client-config.json``."""

    company: CompanyConfig
    branding: BrandingConfig
    terminology: dict[str, str] = Field(default_factory=dict)
    features: dict[str, bool] = Field(default_factory=dict)
    workflows: dict[str, bool] = Field(default_factory=dict)
    reports: ReportsConfig | None = None
    marketing: MarketingConfig | None = None

    class Config:
        populate_by_name = True
        extra = "allow"

    def to_dict(self) -> dict[str, Any]:
        """Serialize for API responses using JSON aliases."""
        return self.model_dump(by_alias=True, exclude_none=False)


# ---------------------------------------------------------------------------
# Client config loader
# ---------------------------------------------------------------------------

CONFIG_DIR = Path(
    os.getenv("ATLAS_CONFIG_DIR", Path(__file__).parent.parent.parent.parent / "config")
)
CONFIG_FILE = CONFIG_DIR / "client-config.json"


class ClientConfig:
    """Loads and exposes the white-label JSON config as a process singleton."""

    def __init__(self) -> None:
        self._config: ClientConfigModel | None = None
        self._raw_dict: dict[str, Any] = {}
        self._load_config()

    def _load_config(self) -> None:
        """Read, validate, and cache ``client-config.json``."""
        if not CONFIG_FILE.exists():
            raise FileNotFoundError(f"Client config not found: {CONFIG_FILE}")

        try:
            with open(CONFIG_FILE, encoding="utf-8") as f:
                raw_data = json.load(f)
            raw_data.pop("$schema", None)

            self._config = ClientConfigModel.model_validate(raw_data)
            self._raw_dict = self._config.to_dict()
            logger.info("Loaded and validated client config from %s", CONFIG_FILE)
        except ValidationError as ve:
            logger.error("Configuration validation failed: %s", ve)
            raise
        except Exception as e:
            logger.error("Error loading client config: %s", e)
            raise

    @property
    def company(self) -> dict[str, Any]:
        if self._config:
            return self._config.company.model_dump(by_alias=True, exclude_none=False)
        return {}

    @property
    def branding(self) -> dict[str, Any]:
        if self._config:
            return self._config.branding.model_dump(by_alias=True, exclude_none=False)
        return {}

    @property
    def terminology(self) -> dict[str, str]:
        return self._config.terminology if self._config else {}

    @property
    def features(self) -> dict[str, bool]:
        return self._config.features if self._config else {}

    @property
    def workflows(self) -> dict[str, bool]:
        return self._config.workflows if self._config else {}

    @property
    def reports(self) -> dict[str, Any] | None:
        if self._config and self._config.reports:
            return self._config.reports.model_dump(by_alias=True, exclude_none=False)
        return None

    @property
    def marketing(self) -> dict[str, Any] | None:
        if self._config and self._config.marketing:
            return self._config.marketing.model_dump(by_alias=True, exclude_none=False)
        return None

    def get(self, key: str, default: Any = None) -> Any:
        """Return a top-level config value by key."""
        return self._raw_dict.get(key, default)

    def to_dict(self) -> dict[str, Any]:
        """Return a copy of the validated config dict."""
        return self._raw_dict.copy()


client_config = ClientConfig()

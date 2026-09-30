"""
Configuration management using Pydantic Settings
"""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        case_sensitive=True,
        extra="ignore",
    )

    # Database - PostgreSQL only (MUST be set via environment variable)
    DATABASE_URL: str = Field(..., description="PostgreSQL connection string (required)")

    # JWT
    SECRET_KEY: str = Field(..., description="JWT secret key (required)")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS (empty default for security - must be configured in production)
    CORS_ORIGINS: str = Field(default="", description="Comma-separated list of allowed origins")
    # When set to "development", allow http://localhost:5173 if CORS_ORIGINS is empty
    ENVIRONMENT: str = Field(default="production", description="production | development")

    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Atlas Laboratory Management System"

    # Analyzer integration — required for /lab/analyzer/* endpoints
    ANALYZER_API_KEY: str = Field(
        default="",
        description="Shared secret for analyzer ingest (X-Analyzer-Key header)",
    )
    ANALYZER_STRICT_VALIDATION: bool = Field(
        default=False,
        description="When true, analyzer ingest fails on catalog validation errors instead of warning-only",
    )

    # Optional artificial delay for testing loading UI (ms). Set to 0 to disable.
    ARTIFICIAL_DELAY_MS: int = Field(
        default=0,
        description="Optional delay in ms for all API v1 requests (for testing loading UI)",
    )

    # Redis Cache
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    CACHE_ENABLED: bool = Field(default=True, description="Enable/disable Redis caching")
    CACHE_TTL_STATIC: int = Field(
        default=3600, description="TTL for static data like tests (seconds)"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        if not origins and self.ENVIRONMENT == "development":
            return ["http://localhost:5173"]
        return origins


settings = Settings()

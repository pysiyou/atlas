"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
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
    
    # File Storage
    REPORTS_DIR: str = "./storage/reports"
    UPLOADS_DIR: str = "./storage/uploads"

    # Redis Cache
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    CACHE_ENABLED: bool = Field(default=True, description="Enable/disable Redis caching")
    CACHE_TTL_STATIC: int = Field(default=3600, description="TTL for static data like tests (seconds)")
    CACHE_TTL_SEMI_STATIC: int = Field(default=300, description="TTL for semi-static data like patients (seconds)")
    CACHE_TTL_DYNAMIC: int = Field(default=60, description="TTL for dynamic data (seconds)")
    
    @property
    def cors_origins_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        if not origins and self.ENVIRONMENT == "development":
            return ["http://localhost:5173"]
        return origins
    
    class Config:
        import os
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        case_sensitive = True


settings = Settings()

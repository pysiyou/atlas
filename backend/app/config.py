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
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Atlas Laboratory Management System"
    
    # File Storage
    REPORTS_DIR: str = "./storage/reports"
    UPLOADS_DIR: str = "./storage/uploads"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        import os
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        case_sensitive = True


settings = Settings()

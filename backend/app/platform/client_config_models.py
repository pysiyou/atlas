"""
Pydantic Models for Client Configuration

Provides type-safe validation for white-label configuration loaded from client-config.json.
Each deployment has its own config file with validated structure.
"""
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, field_validator


class AddressConfig(BaseModel):
    """Physical address configuration"""
    street: str
    city: str
    state: str
    zipCode: str = Field(alias="zipCode")
    country: str
    fullAddress: Optional[str] = Field(default=None, alias="fullAddress")
    
    class Config:
        populate_by_name = True


class ContactConfig(BaseModel):
    """Contact information configuration"""
    address: AddressConfig
    phone: list[str]
    email: str
    website: str


class CompanyConfig(BaseModel):
    """Company information configuration"""
    name: str
    displayName: str = Field(alias="displayName")
    fullName: Optional[str] = Field(default=None, alias="fullName")
    subtitle: Optional[str] = None
    tagline: Optional[str] = None
    version: Optional[str] = None
    copyright: Optional[str] = None
    contact: Optional[ContactConfig] = None
    
    class Config:
        populate_by_name = True


class BrandingConfig(BaseModel):
    """Branding and visual identity configuration"""
    logoPath: str = Field(alias="logoPath")
    primaryColor: str = Field(alias="primaryColor")
    secondaryColor: Optional[str] = Field(default=None, alias="secondaryColor")
    defaultTheme: Optional[str] = Field(default=None, alias="defaultTheme")
    
    class Config:
        populate_by_name = True
    
    @field_validator("primaryColor", "secondaryColor")
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        """Validate hex color format"""
        if v is None:
            return v
        if not v.startswith("#") or len(v) not in [4, 7]:
            raise ValueError(f"Invalid color format: {v}. Must be hex color (#rgb or #rrggbb)")
        return v


class ReportsConfig(BaseModel):
    """Report generation configuration"""
    headerText: Optional[str] = Field(default=None, alias="headerText")
    footerText: Optional[str] = Field(default=None, alias="footerText")
    includeSignature: Optional[bool] = Field(default=True, alias="includeSignature")
    
    class Config:
        populate_by_name = True


class MarketingConfig(BaseModel):
    """Marketing and login screen configuration (optional)"""
    features: Optional[list[str]] = None
    description: Optional[str] = None
    
    class Config:
        populate_by_name = True


class ClientConfigModel(BaseModel):
    """
    Complete white-label client configuration model.
    
    This model validates the entire client-config.json structure and provides
    type-safe access to all configuration sections.
    """
    company: CompanyConfig
    branding: BrandingConfig
    terminology: Dict[str, str] = Field(default_factory=dict)
    features: Dict[str, bool] = Field(default_factory=dict)
    workflows: Dict[str, bool] = Field(default_factory=dict)
    reports: Optional[ReportsConfig] = None
    marketing: Optional[MarketingConfig] = None
    
    class Config:
        populate_by_name = True
        extra = "allow"  # Allow additional fields for future extensions
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return self.model_dump(by_alias=True, exclude_none=False)

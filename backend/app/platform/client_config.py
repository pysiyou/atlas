"""
Client Configuration Loader

Loads white-label configuration from config/client-config.json file.
Each deployment has its own config file - no code changes needed.
"""
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from pydantic import ValidationError

from .client_config_models import (
    ClientConfigModel,
    CompanyConfig,
    BrandingConfig,
    ReportsConfig,
    MarketingConfig,
)

logger = logging.getLogger(__name__)

# Path to config file (relative to project root or from env var)
CONFIG_DIR = Path(os.getenv("ATLAS_CONFIG_DIR", Path(__file__).parent.parent.parent.parent / "config"))
CONFIG_FILE = CONFIG_DIR / "client-config.json"


class ClientConfig:
    """White-label configuration loaded from JSON file with Pydantic validation"""
    
    def __init__(self):
        self._config: Optional[ClientConfigModel] = None
        self._raw_dict: Dict[str, Any] = {}
        self._load_config()
    
    def _load_config(self):
        """Load and validate configuration from JSON file"""
        try:
            if CONFIG_FILE.exists():
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    raw_data = json.load(f)
                
                # Validate with Pydantic
                try:
                    self._config = ClientConfigModel.model_validate(raw_data)
                    self._raw_dict = self._config.to_dict()
                    logger.info(f"Loaded and validated client config from {CONFIG_FILE}")
                except ValidationError as ve:
                    logger.error(f"Configuration validation failed: {ve}")
                    logger.warning("Falling back to default configuration")
                    self._config = self._default_config()
                    self._raw_dict = self._config.to_dict()
            else:
                logger.warning(f"Client config file not found: {CONFIG_FILE}")
                self._config = self._default_config()
                self._raw_dict = self._config.to_dict()
        except Exception as e:
            logger.error(f"Error loading client config: {e}")
            self._config = self._default_config()
            self._raw_dict = self._config.to_dict()
    
    def _default_config(self) -> ClientConfigModel:
        """Default configuration if file doesn't exist or validation fails"""
        return ClientConfigModel(
            company=CompanyConfig(
                name="Atlas Lab",
                displayName="Atlas Lab"
            ),
            branding=BrandingConfig(
                logoPath="/icons/here.svg",
                primaryColor="#0284c7"
            ),
            terminology={},
            features={},
            workflows={}
        )
    
    @property
    def company(self) -> Dict[str, Any]:
        """Company information"""
        if self._config:
            return self._config.company.model_dump(by_alias=True, exclude_none=False)
        return {}
    
    @property
    def branding(self) -> Dict[str, Any]:
        """Branding and visual identity"""
        if self._config:
            return self._config.branding.model_dump(by_alias=True, exclude_none=False)
        return {}
    
    @property
    def terminology(self) -> Dict[str, str]:
        """Custom terminology mappings"""
        return self._config.terminology if self._config else {}
    
    @property
    def features(self) -> Dict[str, bool]:
        """Feature flags"""
        return self._config.features if self._config else {}
    
    @property
    def workflows(self) -> Dict[str, bool]:
        """Workflow configuration"""
        return self._config.workflows if self._config else {}
    
    @property
    def reports(self) -> Optional[Dict[str, Any]]:
        """Report configuration"""
        if self._config and self._config.reports:
            return self._config.reports.model_dump(by_alias=True, exclude_none=False)
        return None
    
    @property
    def marketing(self) -> Optional[Dict[str, Any]]:
        """Marketing configuration"""
        if self._config and self._config.marketing:
            return self._config.marketing.model_dump(by_alias=True, exclude_none=False)
        return None
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get any config value by key"""
        return self._raw_dict.get(key, default)
    
    def to_dict(self) -> Dict[str, Any]:
        """Return full config as dictionary"""
        return self._raw_dict.copy()


# Global singleton instance
client_config = ClientConfig()

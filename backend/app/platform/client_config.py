"""
Client Configuration Loader

Loads white-label configuration from config/client-config.json file.
Each deployment has its own config file - no code changes needed.
"""
import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Path to config file (relative to project root or from env var)
CONFIG_DIR = Path(os.getenv("ATLAS_CONFIG_DIR", Path(__file__).parent.parent.parent.parent / "config"))
CONFIG_FILE = CONFIG_DIR / "client-config.json"


class ClientConfig:
    """White-label configuration loaded from JSON file"""
    
    def __init__(self):
        self._config: dict[str, Any] = {}
        self._load_config()
    
    def _load_config(self):
        """Load configuration from JSON file"""
        try:
            if CONFIG_FILE.exists():
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
                logger.info(f"Loaded client config from {CONFIG_FILE}")
            else:
                logger.warning(f"Client config file not found: {CONFIG_FILE}")
                self._config = self._default_config()
        except Exception as e:
            logger.error(f"Error loading client config: {e}")
            self._config = self._default_config()
    
    def _default_config(self) -> dict[str, Any]:
        """Default configuration if file doesn't exist"""
        return {
            "company": {
                "name": "Atlas Lab",
                "displayName": "Atlas Lab"
            },
            "branding": {
                "logoPath": "/icons/here.svg",
                "primaryColor": "#0284c7"
            },
            "terminology": {},
            "features": {},
            "workflows": {}
        }
    
    @property
    def company(self) -> dict[str, Any]:
        return self._config.get("company", {})
    
    @property
    def branding(self) -> dict[str, Any]:
        return self._config.get("branding", {})
    
    @property
    def terminology(self) -> dict[str, str]:
        return self._config.get("terminology", {})
    
    @property
    def features(self) -> dict[str, bool]:
        return self._config.get("features", {})
    
    @property
    def workflows(self) -> dict[str, bool]:
        return self._config.get("workflows", {})
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get any config value by key"""
        return self._config.get(key, default)
    
    def to_dict(self) -> dict[str, Any]:
        """Return full config as dictionary"""
        return self._config.copy()


# Global singleton instance
client_config = ClientConfig()

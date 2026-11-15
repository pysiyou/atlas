"""
Client Configuration Loader

Loads white-label configuration from config/client-config.json file.
Each deployment has its own config file - no code changes needed.
"""
import json
import logging
import os
from pathlib import Path
from typing import Any, Optional

from pydantic import ValidationError

from .client_config_models import ClientConfigModel

logger = logging.getLogger(__name__)

# Path to config file (relative to project root or from env var)
CONFIG_DIR = Path(
    os.getenv("ATLAS_CONFIG_DIR", Path(__file__).parent.parent.parent.parent / "config")
)
CONFIG_FILE = CONFIG_DIR / "client-config.json"


class ClientConfig:
    """White-label configuration loaded from JSON file with Pydantic validation"""

    def __init__(self):
        self._config: Optional[ClientConfigModel] = None
        self._raw_dict: dict[str, Any] = {}
        self._load_config()

    def _load_config(self):
        """Load and validate configuration from JSON file"""
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
        """Company information"""
        if self._config:
            return self._config.company.model_dump(by_alias=True, exclude_none=False)
        return {}

    @property
    def branding(self) -> dict[str, Any]:
        """Branding and visual identity"""
        if self._config:
            return self._config.branding.model_dump(by_alias=True, exclude_none=False)
        return {}

    @property
    def terminology(self) -> dict[str, str]:
        """Custom terminology mappings"""
        return self._config.terminology if self._config else {}

    @property
    def features(self) -> dict[str, bool]:
        """Feature flags"""
        return self._config.features if self._config else {}

    @property
    def workflows(self) -> dict[str, bool]:
        """Workflow configuration"""
        return self._config.workflows if self._config else {}

    @property
    def reports(self) -> Optional[dict[str, Any]]:
        """Report configuration"""
        if self._config and self._config.reports:
            return self._config.reports.model_dump(by_alias=True, exclude_none=False)
        return None

    @property
    def marketing(self) -> Optional[dict[str, Any]]:
        """Marketing configuration"""
        if self._config and self._config.marketing:
            return self._config.marketing.model_dump(by_alias=True, exclude_none=False)
        return None

    def get(self, key: str, default: Any = None) -> Any:
        """Get any config value by key"""
        return self._raw_dict.get(key, default)

    def to_dict(self) -> dict[str, Any]:
        """Return full config as dictionary"""
        return self._raw_dict.copy()


# Global singleton instance
client_config = ClientConfig()
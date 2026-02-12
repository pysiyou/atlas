"""
Artificial delay middleware for testing loading UI.
When ARTIFICIAL_DELAY_MS > 0, delays all API v1 requests by that many milliseconds.
Skips /health and docs/openapi routes.
"""
import asyncio
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings


class DelayMiddleware(BaseHTTPMiddleware):
    """Adds optional artificial delay to API v1 requests for testing loading states."""

    SKIP_PREFIXES = ("/docs", "/redoc", "/openapi.json")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        delay_ms = getattr(settings, "ARTIFICIAL_DELAY_MS", 0) or 0
        if delay_ms <= 0:
            return await call_next(request)

        path = request.url.path
        if not path.startswith(settings.API_V1_PREFIX):
            return await call_next(request)
        if any(path.startswith(p) for p in self.SKIP_PREFIXES):
            return await call_next(request)

        await asyncio.sleep(delay_ms / 1000.0)
        return await call_next(request)

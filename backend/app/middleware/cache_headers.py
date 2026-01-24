"""
HTTP Caching Headers Middleware.
Automatically adds appropriate Cache-Control headers based on endpoint patterns.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable


class CacheHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add HTTP caching headers to responses.

    Cache strategies:
    - Static endpoints (/tests, /affiliations): public, max-age=3600 (1 hour)
    - Dynamic endpoints (/orders, /samples, /payments): private, no-cache
    - Auth endpoints: no-store (never cache)
    """

    # Endpoints with static data (can be cached publicly)
    STATIC_ENDPOINTS = {
        "/api/v1/tests": 3600,           # 1 hour
        "/api/v1/affiliations": 3600,    # 1 hour
    }

    # Endpoints that should never be cached
    NO_CACHE_ENDPOINTS = {
        "/api/v1/auth",
        "/api/v1/users/me",
    }

    # Endpoints with semi-static data (short cache, private)
    SEMI_STATIC_ENDPOINTS = {
        "/api/v1/patients": 300,  # 5 minutes
    }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Only add cache headers for GET requests
        if request.method != "GET":
            # Mutations should not be cached
            response.headers["Cache-Control"] = "no-store"
            return response

        # Skip if headers already set (e.g., by endpoint with ETag)
        if "Cache-Control" in response.headers:
            return response

        path = request.url.path

        # Check for no-cache endpoints (auth, user-specific)
        for endpoint in self.NO_CACHE_ENDPOINTS:
            if path.startswith(endpoint):
                response.headers["Cache-Control"] = "no-store"
                return response

        # Check for static endpoints
        for endpoint, max_age in self.STATIC_ENDPOINTS.items():
            if path.startswith(endpoint):
                response.headers["Cache-Control"] = f"public, max-age={max_age}"
                response.headers["Vary"] = "Authorization"
                return response

        # Check for semi-static endpoints
        for endpoint, max_age in self.SEMI_STATIC_ENDPOINTS.items():
            if path.startswith(endpoint):
                response.headers["Cache-Control"] = f"private, max-age={max_age}"
                response.headers["Vary"] = "Authorization"
                return response

        # Default: dynamic data, require revalidation
        response.headers["Cache-Control"] = "private, no-cache, must-revalidate"
        response.headers["Vary"] = "Authorization"

        return response

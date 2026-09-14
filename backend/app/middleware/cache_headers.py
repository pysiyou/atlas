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
    - Catalog/auth endpoints: no-store (SPA JWT clients cannot use 304 bodies)
    - Dynamic endpoints (/orders, /samples, /payments): private, no-cache
    """

    # Endpoints that should never be cached
    NO_CACHE_ENDPOINTS = {
        "/api/v1/auth",
        "/api/v1/users/me",
        "/api/v1/tests",
        "/api/v1/affiliations",
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

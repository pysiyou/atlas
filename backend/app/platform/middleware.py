"""
HTTP middleware and unified exception handlers.
"""
from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Callable

from app.platform.config import settings
from app.shared.api import ErrorDetail, ErrorResponse
from app.shared.errors import IdentifierError, LabOperationError
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Light request/response console traces for API debugging."""

    SKIP_PREFIXES = ("/docs", "/redoc", "/openapi.json")
    SKIP_EXACT = frozenset({"/health"})

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if path in self.SKIP_EXACT or any(path.startswith(p) for p in self.SKIP_PREFIXES):
            return await call_next(request)
        if not path.startswith(settings.API_V1_PREFIX):
            return await call_next(request)

        from app.platform.debug_log import http_request, http_response

        method = request.method
        client = request.client
        client_addr = f"{client.host}:{client.port}" if client else "-"
        query = request.url.query
        full_path = f"{path}?{query}" if query else path
        http_request(method, full_path, client_addr=client_addr)
        started = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started) * 1000
        http_response(
            method,
            full_path,
            response.status_code,
            elapsed_ms,
            client_addr=client_addr,
        )
        return response


class CacheHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds Cache-Control headers by endpoint pattern.

    Catalog/auth stay ``no-store``. Mutations are never cached. Other GET
    responses revalidate privately.
    """

    NO_CACHE_ENDPOINTS = {
        "/api/v1/auth",
        "/api/v1/users/me",
        "/api/v1/orderable-tests",
        "/api/v1/workups",
        "/api/v1/affiliations",
    }
    SEMI_STATIC_ENDPOINTS = {
        "/api/v1/patients": 300,
    }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        if request.method != "GET":
            response.headers["Cache-Control"] = "no-store"
            return response

        if "Cache-Control" in response.headers:
            return response

        path = request.url.path

        for endpoint in self.NO_CACHE_ENDPOINTS:
            if path.startswith(endpoint):
                response.headers["Cache-Control"] = "no-store"
                return response

        for endpoint, max_age in self.SEMI_STATIC_ENDPOINTS.items():
            if path.startswith(endpoint):
                response.headers["Cache-Control"] = f"private, max-age={max_age}"
                response.headers["Vary"] = "Authorization"
                return response

        response.headers["Cache-Control"] = "private, no-cache, must-revalidate"
        response.headers["Vary"] = "Authorization"
        return response


class DelayMiddleware(BaseHTTPMiddleware):
    """Optional artificial delay on API v1 requests for loading-UI testing."""

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


async def lab_operation_error_handler(request: Request, exc: LabOperationError) -> JSONResponse:
    """Map lab service errors onto the shared error schema."""
    from app.platform.debug_log import warn

    warn(
        "lab",
        exc.message,
        code=exc.error_code,
        status=exc.status_code,
        path=request.url.path,
        method=request.method,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error_code=exc.error_code, message=exc.message).model_dump(),
    )


async def request_validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Flatten Pydantic request-validation errors."""
    from app.platform.debug_log import warn

    warn(
        "http",
        "request validation failed",
        method=request.method,
        path=request.url.path,
        error_count=len(exc.errors()),
    )
    details = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"]) if error["loc"] else None
        details.append(ErrorDetail(field=field, message=error["msg"]))

    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error_code="VALIDATION_ERROR", message="Request validation failed", details=details
        ).model_dump(),
    )


async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Hide database internals; log the full exception."""
    from app.platform.debug_log import exception as debug_exception

    logger.exception("Database error on %s %s", request.method, request.url.path)
    debug_exception(
        "db",
        f"database error on {request.method} {request.url.path}",
        exc=exc,
    )
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error_code="DATABASE_ERROR",
            message="A database error occurred. Please try again later.",
        ).model_dump(),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Normalize FastAPI HTTPException into ErrorResponse."""
    if exc.status_code >= 400:
        from app.platform.debug_log import warn

        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        warn(
            "http",
            detail,
            status=exc.status_code,
            method=request.method,
            path=request.url.path,
        )
    error_code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_ERROR",
    }
    error_code = error_code_map.get(exc.status_code, "ERROR")
    matches = None
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    if isinstance(exc.detail, dict):
        error_code = str(exc.detail.get("error_code") or error_code)
        message = str(exc.detail.get("message") or message)
        raw_matches = exc.detail.get("matches")
        if isinstance(raw_matches, list):
            matches = raw_matches

    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error_code=error_code,
            message=message,
            matches=matches,
        ).model_dump(),
    )


async def identifier_error_handler(request: Request, exc: IdentifierError) -> JSONResponse:
    """Sequence cap or invalid generated identifier — client should retry later or contact ops."""
    from app.platform.debug_log import warn

    logger.warning("Identifier allocation failed: %s", exc)
    warn("orders", str(exc), method=request.method, path=request.url.path)
    return JSONResponse(
        status_code=503,
        content=ErrorResponse(
            error_code="IDENTIFIER_EXHAUSTED",
            message=str(exc),
        ).model_dump(),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log internally, return a generic 500."""
    from app.platform.debug_log import exception as debug_exception

    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    debug_exception(
        "http",
        f"unhandled exception on {request.method} {request.url.path}",
        exc=exc,
    )
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred. Please try again later.",
        ).model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Attach all exception handlers to the FastAPI app."""
    app.add_exception_handler(IdentifierError, identifier_error_handler)
    app.add_exception_handler(LabOperationError, lab_operation_error_handler)
    app.add_exception_handler(RequestValidationError, request_validation_error_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

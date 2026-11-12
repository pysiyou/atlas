"""
Global exception handlers for consistent error responses.

These handlers ensure that:
1. Internal errors don't leak sensitive information
2. All errors follow the same response schema
3. Errors are properly logged for debugging
"""
import logging

from app.platform.utils.exceptions import LabOperationError
from app.shared.schemas.error import ErrorDetail, ErrorResponse
from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


async def lab_operation_error_handler(request: Request, exc: LabOperationError) -> JSONResponse:
    """Handle LabOperationError exceptions from service layer."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error_code=exc.error_code, message=exc.message).model_dump(),
    )


async def request_validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors from request body/params."""
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
    """Handle SQLAlchemy database errors without leaking details."""
    logger.exception(f"Database error on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error_code="DATABASE_ERROR",
            message="A database error occurred. Please try again later.",
        ).model_dump(),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTPException with unified format."""
    # Map status codes to error codes
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

    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error_code=error_code,
            message=exc.detail if isinstance(exc.detail, str) else str(exc.detail),
        ).model_dump(),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler for unexpected exceptions.

    IMPORTANT: Never expose internal error details to the client.
    Log the full exception for debugging, but return a generic message.
    """
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred. Please try again later.",
        ).model_dump(),
    )


def register_exception_handlers(app):
    """Register all exception handlers with the FastAPI app."""
    from fastapi.exceptions import RequestValidationError

    # Custom exceptions
    app.add_exception_handler(LabOperationError, lab_operation_error_handler)

    # Framework exceptions
    app.add_exception_handler(RequestValidationError, request_validation_error_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)

    # Catch-all for unexpected errors (must be last)
    app.add_exception_handler(Exception, generic_exception_handler)

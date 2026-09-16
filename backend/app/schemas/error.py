"""
Unified error response schemas for consistent API error handling.
"""

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Individual error detail, e.g., for field-level validation errors."""

    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    """
    Unified error response schema for all API errors.

    Usage:
        - error_code: Machine-readable code (e.g., "NOT_FOUND", "VALIDATION_ERROR")
        - message: Human-readable description
        - details: Optional list of field-level errors for validation failures
    """

    error_code: str
    message: str
    details: list[ErrorDetail] | None = None


class MessageResponse(BaseModel):
    """Simple message response for operations that return a status message."""

    message: str


class OperationResponse(BaseModel):
    """Response for operations that return a status with additional context."""

    success: bool
    message: str

    class Config:
        from_attributes = True

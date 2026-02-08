"""
Pagination schemas for standardized paginated API responses.
"""
from typing import Generic, TypeVar, List
from pydantic import BaseModel, Field
from math import ceil

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """Pagination metadata."""

    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    pageSize: int = Field(..., ge=1, le=10000, description="Number of items per page")
    total: int = Field(..., ge=0, description="Total number of items")
    totalPages: int = Field(..., ge=0, description="Total number of pages")
    hasNext: bool = Field(..., description="Whether there are more pages")
    hasPrev: bool = Field(..., description="Whether there are previous pages")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response wrapper.

    Usage:
        PaginatedResponse[OrderResponse](
            data=[...],
            pagination=PaginationMeta(...)
        )
    """

    data: List[T] = Field(..., description="List of items for the current page")
    pagination: PaginationMeta = Field(..., description="Pagination metadata")


def create_paginated_response(
    data: List[T],
    total: int,
    page: int,
    page_size: int,
) -> dict:
    """
    Create a paginated response dict.

    Args:
        data: List of items for the current page
        total: Total number of items (before pagination)
        page: Current page number (1-indexed)
        page_size: Number of items per page

    Returns:
        Dict with 'data' and 'pagination' keys
    """
    total_pages = ceil(total / page_size) if page_size > 0 else 0

    return {
        "data": data,
        "pagination": {
            "page": page,
            "pageSize": page_size,
            "total": total,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrev": page > 1,
        },
    }


def skip_to_page(skip: int, limit: int) -> int:
    """Convert skip/limit to 1-indexed page number."""
    if limit <= 0:
        return 1
    return (skip // limit) + 1

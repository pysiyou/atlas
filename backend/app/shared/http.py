"""
HTTP-facing Pydantic types: errors, pagination, status badges, clinical path/query params.
"""
from __future__ import annotations

from math import ceil
from typing import Annotated, Generic, TypeVar

from app.shared.identifiers import (
    EMPLOYEE_NUMBER_PATTERN,
    FILLER_PATTERN,
    LAB_ACTOR_USER_ID_PATTERN,
    MRN_PATTERN,
    RECEIPT_NUMBER_PATTERN,
    REFERENT_DOCTOR_ID_PATTERN,
    SAMPLE_ID_PATTERN,
    TEST_MNEMONIC_PATTERN,
)
from fastapi import Path, Query
from pydantic import BaseModel, Field

MrnPath = Annotated[str, Path(pattern=MRN_PATTERN, min_length=8, max_length=8)]
OrderIdPath = Annotated[str, Path(pattern=FILLER_PATTERN, min_length=13, max_length=13)]
SampleIdPath = Annotated[str, Path(pattern=SAMPLE_ID_PATTERN, min_length=8, max_length=20)]
EmployeeIdPath = Annotated[
    str, Path(pattern=EMPLOYEE_NUMBER_PATTERN, min_length=8, max_length=8)
]
TestCodePath = Annotated[str, Path(pattern=TEST_MNEMONIC_PATTERN, min_length=2, max_length=8)]
OrderTestIdPath = Annotated[int, Path(gt=0)]
ReceiptIdPath = Annotated[str, Path(pattern=RECEIPT_NUMBER_PATTERN, min_length=8, max_length=8)]

MrnQuery = Annotated[str | None, Query(pattern=MRN_PATTERN, min_length=8, max_length=8)]
OrderIdQuery = Annotated[str | None, Query(pattern=FILLER_PATTERN, min_length=13, max_length=13)]
SampleIdQuery = Annotated[
    str | None,
    Query(pattern=SAMPLE_ID_PATTERN, min_length=8, max_length=20),
]
EmployeeIdQuery = Annotated[
    str | None,
    Query(pattern=EMPLOYEE_NUMBER_PATTERN, min_length=8, max_length=8),
]
LabActorIdQuery = Annotated[
    str | None,
    Query(pattern=LAB_ACTOR_USER_ID_PATTERN, min_length=6, max_length=8),
]
ReferentDoctorIdQuery = Annotated[
    str | None,
    Query(pattern=REFERENT_DOCTOR_ID_PATTERN, min_length=8, max_length=8),
]

T = TypeVar("T")


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    details: list[ErrorDetail] | None = None
    matches: list[dict] | None = None


class MessageResponse(BaseModel):
    message: str


class StatusPresentation(BaseModel):
    primary: str = Field(..., description="Canonical presentation primary (e.g. pending, blocked)")
    secondary: str | None = Field(
        None, description="Human reason when blocked or rejected (from contracts)"
    )
    variant: str = Field(..., description="Badge color token aligned with frontend BadgeColor")


class PaginationMeta(BaseModel):
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    pageSize: int = Field(..., ge=1, le=10000, description="Number of items per page")
    total: int = Field(..., ge=0, description="Total number of items")
    totalPages: int = Field(..., ge=0, description="Total number of pages")
    hasNext: bool = Field(..., description="Whether there are more pages")
    hasPrev: bool = Field(..., description="Whether there are previous pages")


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T] = Field(..., description="List of items for the current page")
    pagination: PaginationMeta = Field(..., description="Pagination metadata")


def create_paginated_response(
    data: list[T],
    total: int,
    page: int,
    page_size: int,
) -> dict:
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
    if limit <= 0:
        return 1
    return (skip // limit) + 1
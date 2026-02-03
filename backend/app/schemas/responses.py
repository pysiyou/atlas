"""
Additional response schemas for specific endpoint operations.
"""
from pydantic import BaseModel
from typing import Optional, List, Any, Union
from app.schemas.order import OrderResponse
from app.schemas.sample import SampleResponse
from app.schemas.pagination import PaginatedResponse


class MessageResponse(BaseModel):
    """Simple message response for stateless operations."""
    message: str


class OrderReportResponse(BaseModel):
    """Response for order report/completion confirmation."""
    orderId: int
    status: str
    message: str


class PaginatedOrdersResponse(BaseModel):
    """Paginated response for orders list."""
    data: List[OrderResponse]
    pagination: dict


class RejectAndRecollectResponseTyped(BaseModel):
    """Typed response for combined reject and recollect operation."""
    rejectedSample: SampleResponse
    newSample: SampleResponse
    recollectionAttempt: int
    message: str

    class Config:
        from_attributes = True

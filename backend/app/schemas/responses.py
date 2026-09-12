"""
Additional response schemas for specific endpoint operations.
"""
from pydantic import BaseModel
from typing import List
from app.schemas.order import OrderResponse
from app.schemas.sample import SampleResponse


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

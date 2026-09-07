"""
Order API Routes
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime, timezone
from app.database import get_db

logger = logging.getLogger(__name__)
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.models.billing import Payment
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse, OrderDetailResponse
from app.schemas.enums import OrderStatus, PaymentStatus
from app.schemas.pagination import create_paginated_response, skip_to_page
from app.services.audit_service import AuditService
from app.services.order_status_updater import update_order_status
from app.utils.db_helpers import get_or_404
from app.api.deps import PaginationParams
from app.services.order_service import OrderService
from app.services.payment_service import enrich_payment
from app.schemas.payment import PaymentResponse
from app.schemas.responses import OrderReportResponse

router = APIRouter()


class OrderPaymentUpdate(BaseModel):
    """Body for PATCH /orders/{orderId}/payment"""
    paymentStatus: PaymentStatus = Field(..., description="paid | unpaid")
    amountPaid: Optional[float] = Field(None, ge=0)


@router.get("/orders")
def get_orders(
    pagination: PaginationParams,
    patientId: int | None = None,
    order_status: OrderStatus | None = Query(None, alias="status"),
    paymentStatus: PaymentStatus | None = Query(None, alias="paymentStatus"),
    sort: Literal["createdAt", "updatedAt"] = Query(
        "updatedAt", description="Sort by updatedAt (default, last modified) or createdAt"
    ),
    paginated: bool = Query(False, description="Return paginated response with total count"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all orders with optional filters.
    Query params: paginated: If true, returns {data: [...], pagination: {...}} format.
    sort: updatedAt (default) or createdAt for ordering.
    """
    skip = pagination["skip"]
    limit = pagination["limit"]
    query = db.query(Order)

    if patientId:
        query = query.filter(Order.patientId == patientId)

    if order_status:
        query = query.filter(Order.overallStatus == order_status)

    if paymentStatus:
        query = query.filter(Order.paymentStatus == paymentStatus)

    # Eagerly load relationships needed for serialization
    query = query.options(
        joinedload(Order.patient),
        selectinload(Order.tests).joinedload(OrderTest.test)
    )

    # Get total count for pagination (before offset/limit)
    total = query.count() if paginated else 0

    order_by = Order.updatedAt.desc() if sort == "updatedAt" else Order.createdAt.desc()
    orders = query.order_by(order_by).offset(skip).limit(limit).all()

    # Serialize orders using response model to ensure relationships are included
    try:
        serialized_orders = [OrderResponse.model_validate(o).model_dump(mode="json") for o in orders]
    except Exception:
        logger.exception("Error serializing orders")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing order data"
        )

    if paginated:
        page = skip_to_page(skip, limit)
        return create_paginated_response(serialized_orders, total, page, limit)

    return serialized_orders


@router.get("/orders/{orderId}")
def get_order(
    orderId: int,
    include: Optional[str] = Query(None, description="Include related data, e.g. 'payments'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get order by ID with all tests. Eager-loads patient and tests to avoid N+1.
    Use ?include=payments to also return payments for this order (single request for order detail page).
    Without include, response shape is unchanged (no payments key) for frontend compatibility.
    """
    options = [
        joinedload(Order.patient),
        selectinload(Order.tests).joinedload(OrderTest.test),
    ]
    if include == "payments":
        options.append(selectinload(Order.payments))
    order = (
        db.query(Order)
        .filter(Order.orderId == orderId)
        .options(*options)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {orderId} not found"
        )
    if include == "payments":
        order_dump = OrderResponse.model_validate(order).model_dump(mode="json")
        order_dump["payments"] = [
            PaymentResponse(**enrich_payment(p, order)) for p in order.payments
        ]
        return OrderDetailResponse(**order_dump)
    return OrderResponse.model_validate(order)


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new order. Delegates to OrderService."""
    return OrderService(db).create_order(order_data, current_user.id)


@router.put("/orders/{orderId}", response_model=OrderResponse)
def update_order(
    orderId: int,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order information, including tests. Delegates to OrderService."""
    return OrderService(db).update_order(orderId, order_data, current_user.id)


@router.delete("/orders/{orderId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an order. Allowed only when the order has no payments. Cascades to order tests and samples."""
    order = get_or_404(db, Order, orderId, "orderId")
    has_payments = db.query(Payment).filter(Payment.orderId == orderId).first() is not None
    if has_payments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete order that has payments. Remove or void payments first."
        )
    try:
        db.query(Sample).filter(Sample.orderId == orderId).delete()
        db.delete(order)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception(f"Failed to delete order {orderId}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete order"
        )
    return None


@router.patch("/orders/{orderId}/payment", response_model=OrderResponse)
def update_order_payment_status(
    orderId: int,
    body: OrderPaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order payment status. Optionally record a payment amount (creates a Payment record). Delegates to OrderService."""
    return OrderService(db).update_order_payment(
        orderId, body.paymentStatus, body.amountPaid, current_user.id
    )


@router.post("/orders/{orderId}/report", response_model=OrderReportResponse, status_code=status.HTTP_200_OK)
def mark_as_reported(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> OrderReportResponse:
    """
    Confirm order completion (all tests validated).
    """
    order = get_or_404(db, Order, orderId, "orderId")

    if order.overallStatus != OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order must be COMPLETED before reporting. Current status: {order.overallStatus}"
        )

    # Order is already in COMPLETED state (final state), just acknowledge
    return OrderReportResponse(orderId=orderId, status="completed", message="Order is complete")

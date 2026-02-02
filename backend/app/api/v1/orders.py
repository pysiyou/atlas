"""
Order API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.models.billing import Payment
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse, OrderDetailResponse
from app.schemas.enums import OrderStatus, PaymentStatus, TestStatus
from app.schemas.pagination import create_paginated_response, skip_to_page
from app.services.audit_service import AuditService
from app.services.order_status_updater import update_order_status
from app.utils.db_helpers import get_or_404
from app.api.deps import PaginationParams
from app.services.order_service import OrderService
from app.services.payment_service import enrich_payment
from app.schemas.payment import PaymentResponse

router = APIRouter()


class OrderTestStatusUpdate(BaseModel):
    """Body for PATCH /orders/{orderId}/tests/{testCode}"""
    status: TestStatus = Field(..., description="New test status")
    technicianNotes: Optional[str] = None
    validationNotes: Optional[str] = None


class OrderPaymentUpdate(BaseModel):
    """Body for PATCH /orders/{orderId}/payment"""
    paymentStatus: PaymentStatus = Field(..., description="paid | unpaid")
    amountPaid: Optional[float] = Field(None, ge=0)


class CriticalNotifyRequest(BaseModel):
    """Body for POST /orders/{orderId}/tests/{testCode}/critical"""
    notifiedTo: str = Field(..., min_length=1)


@router.get("/orders")
def get_orders(
    pagination: PaginationParams,
    patientId: int | None = None,
    order_status: OrderStatus | None = Query(None, alias="status"),
    paymentStatus: PaymentStatus | None = Query(None, alias="paymentStatus"),
    sort: Literal["createdAt", "updatedAt"] = Query(
        "createdAt", description="Sort by createdAt (default) or updatedAt (last modified)"
    ),
    paginated: bool = Query(False, description="Return paginated response with total count"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all orders with optional filters.
    Query params: paginated: If true, returns {data: [...], pagination: {...}} format.
    sort: createdAt (default) or updatedAt for last-modified ordering.
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
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Error serializing orders: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serializing order data: {str(e)}"
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
    db.query(Sample).filter(Sample.orderId == orderId).delete()
    db.delete(order)
    db.commit()
    return None


@router.patch("/orders/{orderId}/tests/{testCode}", response_model=OrderResponse)
def update_order_test_status(
    orderId: int,
    testCode: str,
    body: OrderTestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update test status within an order. Optionally update technicianNotes or validationNotes.
    Recomputes order overall status after update.
    """
    order = db.query(Order).filter(Order.orderId == orderId).options(
        selectinload(Order.tests).joinedload(OrderTest.test),
        joinedload(Order.patient),
    ).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {orderId} not found"
        )
    order_test = next((t for t in order.tests if t.testCode == testCode), None)
    if not order_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {testCode} not found in order {orderId}"
        )
    order_test.status = body.status
    if body.technicianNotes is not None:
        order_test.technicianNotes = body.technicianNotes
    if body.validationNotes is not None:
        order_test.validationNotes = body.validationNotes
    update_order_status(db, orderId)
    db.commit()
    db.refresh(order)
    return order


@router.post("/orders/{orderId}/tests/{testCode}/critical", response_model=OrderResponse)
def mark_order_test_critical(
    orderId: int,
    testCode: str,
    body: CriticalNotifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record that a critical value notification was sent for this order test.
    Resolves OrderTest by orderId + testCode and delegates to critical notification + audit.
    """
    from app.services.critical_notification_service import CriticalNotificationService
    from app.services.flag_calculator import ResultFlag
    from app.schemas.enums import ResultStatus

    order = db.query(Order).filter(Order.orderId == orderId).options(
        selectinload(Order.tests).joinedload(OrderTest.test),
        joinedload(Order.patient),
    ).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {orderId} not found"
        )
    order_test = next((t for t in order.tests if t.testCode == testCode), None)
    if not order_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {testCode} not found in order {orderId}"
        )
    if not order_test.hasCriticalValues:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test does not have critical values"
        )
    service = CriticalNotificationService(db)
    critical_flags = []
    if order_test.flags:
        for flag_str in order_test.flags:
            parts = flag_str.split(":")
            if len(parts) >= 2:
                critical_flags.append(
                    ResultFlag(
                        item_code=parts[0],
                        item_name=parts[0],
                        value=float(parts[2]) if len(parts) > 2 else 0,
                        status=ResultStatus(parts[1]) if parts[1] in [s.value for s in ResultStatus] else ResultStatus.CRITICAL,
                        reference_low=None,
                        reference_high=None,
                        critical_low=None,
                        critical_high=None,
                        unit=None,
                    )
                )
    service.create_notification(
        order_test=order_test,
        order=order,
        critical_flags=critical_flags,
        notified_to=body.notifiedTo,
        notification_method="phone",
    )
    audit = AuditService(db)
    audit.log_critical_value_notified(
        order_id=orderId,
        test_id=order_test.id,
        test_code=testCode,
        user_id=current_user.id,
        notified_to=body.notifiedTo,
        notification_method="phone",
    )
    db.commit()
    db.refresh(order)
    return order


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


@router.post("/orders/{orderId}/report", status_code=status.HTTP_200_OK)
def mark_as_reported(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    return {"orderId": orderId, "status": "completed", "message": "Order is complete"}

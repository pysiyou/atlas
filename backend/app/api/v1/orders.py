"""
Order API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.core.dependencies import get_current_user, require_receptionist, require_validator
from app.models.user import User
from app.models.order import Order, OrderTest
from app.models.test import Test
from app.models.patient import Patient
from app.models.sample import Sample
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.schemas.enums import OrderStatus, PaymentStatus, TestStatus, SampleStatus, UserRole
from app.services.id_generator import generate_id
from app.services.sample_generator import generate_samples_for_order
from app.utils.db_helpers import get_or_404

router = APIRouter()


@router.get("/orders", response_model=List[OrderResponse])
def get_orders(
    patientId: str | None = None,
    status: OrderStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all orders with optional filters.
    
    Role-based filtering:
    - Admin/Receptionist: All orders
    - Lab Tech: Only orders with pending/collected samples
    - Validator: Only orders with results to validate
    """
    query = db.query(Order)

    # Role-based filtering
    if current_user.role == UserRole.LAB_TECH:
        # Lab techs only see orders with samples to process
        query = query.join(Sample).filter(
            Sample.status.in_([SampleStatus.PENDING, SampleStatus.COLLECTED])
        ).distinct()
    elif current_user.role == UserRole.VALIDATOR:
        # Validators only see orders with results to validate
        query = query.join(OrderTest).filter(
            OrderTest.status == TestStatus.RESULTED
        ).distinct()
    # Admin and Receptionist see all orders

    if patientId:
        query = query.filter(Order.patientId == patientId)

    if status:
        query = query.filter(Order.overallStatus == status)

    orders = query.order_by(Order.createdAt.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/orders/{orderId}", response_model=OrderResponse)
def get_order(
    orderId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get order by ID with all tests
    """
    order = db.query(Order).filter(Order.orderId == orderId).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {orderId} not found"
        )
    return order


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    """
    Create a new order
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == order_data.patientId).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {order_data.patientId} not found"
        )

    # Calculate total price and create order tests
    total_price = 0.0
    orderId = generate_id("order", db)
    order_tests = []

    for test_data in order_data.tests:
        # Get test from catalog
        test = db.query(Test).filter(Test.code == test_data.testCode).first()
        if not test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test {test_data.testCode} not found"
            )

        total_price += test.price

        # Create OrderTest
        order_test = OrderTest(
            id=f"{orderId}_{test.code}",
            orderId=orderId,
            testCode=test.code,
            status=TestStatus.PENDING,
            priceAtOrder=test.price,
        )
        order_tests.append(order_test)

    # Create order
    order = Order(
        orderId=orderId,
        patientId=order_data.patientId,
        orderDate=datetime.now(timezone.utc),
        totalPrice=total_price,
        paymentStatus=PaymentStatus.UNPAID,
        overallStatus=OrderStatus.ORDERED,
        priority=order_data.priority,
        referringPhysician=order_data.referringPhysician,
        clinicalNotes=order_data.clinicalNotes,
        specialInstructions=order_data.specialInstructions,
        patientPrepInstructions=order_data.patientPrepInstructions,
        createdBy=current_user.id,
        tests=order_tests,
    )

    try:
        db.add(order)
        db.flush()  # Get order ID without committing

        # Generate samples for this order
        generate_samples_for_order(orderId, db, current_user.id)

        db.commit()
        db.refresh(order)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create order")

    return order


@router.put("/orders/{orderId}", response_model=OrderResponse)
def update_order(
    orderId: str,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    """
    Update order information
    """
    order = db.query(Order).filter(Order.orderId == orderId).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {orderId} not found"
        )

    update_data = order_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)

    db.commit()
    db.refresh(order)

    return order


@router.post("/orders/{orderId}/report", status_code=status.HTTP_200_OK)
def mark_as_reported(
    orderId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_validator)
):
    """
    Confirm order completion (all tests validated).
    Only validators can confirm completed orders.
    """
    order = get_or_404(db, Order, orderId, "orderId")

    if order.overallStatus != OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order must be COMPLETED before reporting. Current status: {order.overallStatus}"
        )

    # Order is already in COMPLETED state (final state), just acknowledge
    return {"orderId": orderId, "status": "completed", "message": "Order is complete"}

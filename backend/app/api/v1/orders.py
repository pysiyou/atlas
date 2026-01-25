"""
Order API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Union
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
from app.schemas.pagination import create_paginated_response, skip_to_page
from app.services.sample_generator import generate_samples_for_order
from app.utils.db_helpers import get_or_404

router = APIRouter()


@router.get("/orders")
def get_orders(
    patientId: int | None = None,
    status: OrderStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    paginated: bool = Query(False, description="Return paginated response with total count"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all orders with optional filters.

    Query params:
    - paginated: If true, returns {data: [...], pagination: {...}} format

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

    # Get total count for pagination (before offset/limit)
    total = query.count() if paginated else 0

    orders = query.order_by(Order.createdAt.desc()).offset(skip).limit(limit).all()

    # Serialize orders using response model to ensure relationships are included
    serialized_orders = [OrderResponse.model_validate(o).model_dump(mode="json") for o in orders]

    if paginated:
        page = skip_to_page(skip, limit)
        return create_paginated_response(serialized_orders, total, page, limit)

    return serialized_orders


@router.get("/orders/{orderId}", response_model=OrderResponse)
def get_order(
    orderId: int,
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

    # Calculate total price and validate tests
    total_price = 0.0
    test_entries = []

    for test_data in order_data.tests:
        # Get test from catalog
        test = db.query(Test).filter(Test.code == test_data.testCode).first()
        if not test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test {test_data.testCode} not found"
            )

        total_price += test.price
        test_entries.append((test.code, test.price))

    # Create order first
    order = Order(
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
    )

    try:
        db.add(order)
        db.flush()  # Get auto-generated orderId

        # Create OrderTests with the generated orderId
        for test_code, price in test_entries:
            order_test = OrderTest(
                orderId=order.orderId,
                testCode=test_code,
                status=TestStatus.PENDING,
                priceAtOrder=price,
            )
            db.add(order_test)

        db.flush()  # Ensure OrderTests are created

        # Generate samples for this order
        generate_samples_for_order(order.orderId, db, current_user.id)

        db.commit()
        db.refresh(order)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create order")

    return order


@router.put("/orders/{orderId}", response_model=OrderResponse)
def update_order(
    orderId: int,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    """
    Update order information, including tests.
    
    When tests are provided:
    - New tests are added (creates OrderTest entries)
    - Tests not in the list are removed (only if they have no results)
    - Existing tests are kept
    - Total price is recalculated
    """
    order = db.query(Order).filter(Order.orderId == orderId).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {orderId} not found"
        )

    update_data = order_data.model_dump(exclude_unset=True)
    tests_to_update = update_data.pop('tests', None)

    # Handle test updates if provided
    if tests_to_update is not None:
        # Get existing test codes
        existing_test_codes = {ot.testCode for ot in order.tests}
        # tests_to_update is a list of dicts from model_dump(), so use bracket notation
        new_test_codes = {t['testCode'] for t in tests_to_update}
        
        # Find tests to remove (existing tests not in new list)
        tests_to_remove = existing_test_codes - new_test_codes
        
        # Find tests to add (new tests not in existing list)
        tests_to_add = new_test_codes - existing_test_codes
        
        # Validate: Can't remove tests that have results or are in progress
        for ot in order.tests:
            if ot.testCode in tests_to_remove:
                # Check if test has results
                if ot.results is not None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot remove test {ot.testCode} - it has results entered"
                    )
                # Only allow removing tests that are still pending
                if ot.status != TestStatus.PENDING:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot remove test {ot.testCode} - it is in progress (status: {ot.status})"
                    )
        
        # Calculate price for tests that will remain (before removing)
        existing_tests_price = sum(
            ot.priceAtOrder for ot in order.tests
            if ot.testCode not in tests_to_remove and ot.status not in {TestStatus.SUPERSEDED, TestStatus.REMOVED}
        )
        
        # Remove tests (mark as removed for audit trail)
        for ot in order.tests:
            if ot.testCode in tests_to_remove:
                ot.status = TestStatus.REMOVED
        
        # Add new tests and calculate price adjustment
        total_price_adjustment = 0.0
        for test_data in tests_to_update:
            # test_data is a dict from model_dump(), so use bracket notation
            test_code = test_data['testCode']
            if test_code in tests_to_add:
                # Get test from catalog
                test = db.query(Test).filter(Test.code == test_code).first()
                if not test:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Test {test_code} not found"
                    )
                
                # Create new OrderTest
                order_test = OrderTest(
                    orderId=order.orderId,
                    testCode=test.code,
                    status=TestStatus.PENDING,
                    priceAtOrder=test.price,
                )
                db.add(order_test)
                total_price_adjustment += test.price
        
        # Recalculate total price
        # Keep price for existing tests that remain, add price for new tests
        order.totalPrice = existing_tests_price + total_price_adjustment
        
        # Generate samples for newly added tests
        from app.services.sample_generator import generate_samples_for_order
        # Only generate samples for new tests
        new_order_tests = [ot for ot in order.tests if ot.testCode in tests_to_add]
        if new_order_tests:
            # Generate samples for the order (will handle only tests without samples)
            generate_samples_for_order(order.orderId, db, current_user.id)

    # Update other fields
    for field, value in update_data.items():
        setattr(order, field, value)

    # Update timestamp
    order.updatedAt = datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)

    return order


@router.post("/orders/{orderId}/report", status_code=status.HTTP_200_OK)
def mark_as_reported(
    orderId: int,
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

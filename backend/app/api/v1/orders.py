"""
Order API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.dependencies import get_current_user, require_receptionist
from app.models.user import User
from app.models.order import Order, OrderTest
from app.models.test import Test
from app.models.patient import Patient
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.schemas.enums import OrderStatus, PaymentStatus, TestStatus
from app.services.id_generator import generate_id
from app.services.sample_generator import generate_samples_for_order

router = APIRouter()


@router.get("/orders", response_model=List[OrderResponse])
def get_orders(
    patient_id: str | None = None,
    status: OrderStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all orders with optional filters
    """
    query = db.query(Order)
    
    if patient_id:
        query = query.filter(Order.patient_id == patient_id)
    
    if status:
        query = query.filter(Order.overall_status == status)
    
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get order by ID with all tests
    """
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
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
    order_id = generate_id("order", db)
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
            id=f"{order_id}_{test.code}",
            order_id=order_id,
            test_code=test.code,
            status=TestStatus.PENDING,
            price_at_order=test.price,
        )
        order_tests.append(order_test)
    
    # Create order
    order = Order(
        order_id=order_id,
        patient_id=order_data.patientId,
        order_date=datetime.utcnow(),
        total_price=total_price,
        payment_status=PaymentStatus.PENDING,
        overall_status=OrderStatus.PENDING,
        priority=order_data.priority,
        referring_physician=order_data.referringPhysician,
        clinical_notes=order_data.clinicalNotes,
        special_instructions=order_data.specialInstructions,
        patient_prep_instructions=order_data.patientPrepInstructions,
        created_by=current_user.id,
        tests=order_tests,
    )
    
    db.add(order)
    db.commit()
    
    # Generate samples for this order
    generate_samples_for_order(order_id, db, current_user.id)
    
    db.refresh(order)
    return order


@router.put("/orders/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: str,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist)
):
    """
    Update order information
    """
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )
    
    update_data = order_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    db.commit()
    db.refresh(order)
    
    return order

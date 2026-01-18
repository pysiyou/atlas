"""
Generate orders for specific patients
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.order import Order, OrderTest
from app.models.test import Test
from app.schemas.enums import OrderStatus, PaymentStatus, TestStatus, PriorityLevel
from app.services.sample_generator import generate_samples_for_order

REQUIRED_PATIENTS = {
    "PAT-20260118-001": 5,
    "PAT-20260118-002": 3,
    "PAT-20260118-003": 1,
    "PAT-20260118-004": 1
}

def generate_orders(db: Session):
    """Generate orders for specific patients"""
    print("📦 Generating orders...")
    
    # Get all available tests
    all_tests = db.query(Test).all()
    if not all_tests:
        print("❌ No tests found in database. Cannot generate orders.")
        return

    orders_created = 0
    samples_created = 0
    
    try:
        for patient_id, num_orders in REQUIRED_PATIENTS.items():
            # We assume patient exists based on init_db order
            
            for i in range(num_orders):
                # Randomize order date within last 30 days
                order_date = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
                
                # Create Order
                order_id = f"ORD-{order_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
                
                # Select 1-5 random tests
                num_tests = random.randint(1, 5)
                selected_tests = random.sample(all_tests, num_tests)
                
                # Calculate total price
                total_price = sum(t.price for t in selected_tests)
                
                order = Order(
                    orderId=order_id,
                    patientId=patient_id,
                    orderDate=order_date,
                    totalPrice=total_price,
                    paymentStatus=PaymentStatus.PENDING,
                    overallStatus=OrderStatus.PENDING,
                    priority=PriorityLevel.ROUTINE,
                    createdBy="system"
                )
                db.add(order)
                
                # Create OrderTests
                for test in selected_tests:
                    order_test = OrderTest(
                        id=f"{order_id}-{test.code}",
                        orderId=order_id,
                        testCode=test.code,
                        status=TestStatus.PENDING,
                        priceAtOrder=test.price
                    )
                    db.add(order_test)
                
                # Flush to ensure order and tests are committed before generating samples
                db.flush()
                
                # Generate samples for this order
                samples = generate_samples_for_order(order_id, db, "system")
                db.flush()  # Flush samples to make IDs visible for next iteration
                samples_created += len(samples)
                
                orders_created += 1
                print(f"  ✓ {order_id}: {num_tests} tests, {len(samples)} sample(s)")
                
        db.commit()
        print(f"\n{'='*60}")
        print(f"✅ Successfully created {orders_created} orders for {len(REQUIRED_PATIENTS)} patients!")
        print(f"✅ Generated {samples_created} samples total")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Error generating orders: {e}")
        db.rollback()
        raise


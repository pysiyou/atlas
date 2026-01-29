"""
Generate orders for specific patients. Does not create tests in resulted/ready-for-validation state.
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.test import Test
from app.schemas.enums import OrderStatus, PaymentStatus, TestStatus, PriorityLevel
from app.services.sample_generator import generate_samples_for_order


def generate_orders(db: Session):
    """Generate orders for patients"""
    print("📦 Generating orders...")

    # Get all available tests
    all_tests = db.query(Test).all()
    if not all_tests:
        print("❌ No tests found in database. Cannot generate orders.")
        return

    # Get first 4 patients and assign orders to them
    patients = db.query(Patient).limit(4).all()
    if not patients:
        print("❌ No patients found in database. Cannot generate orders.")
        return

    # Assign different number of orders to each patient
    order_counts = [5, 3, 1, 1]  # Total 10 orders

    orders_created = 0
    samples_created = 0

    try:
        for idx, patient in enumerate(patients):
            num_orders = order_counts[idx] if idx < len(order_counts) else 1

            for i in range(num_orders):
                # Randomize order date within last 30 days
                order_date = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))

                # Select 1-5 random tests
                num_tests = random.randint(1, 5)
                selected_tests = random.sample(all_tests, num_tests)

                # Calculate total price
                total_price = sum(t.price for t in selected_tests)

                order = Order(
                    patientId=patient.id,
                    orderDate=order_date,
                    totalPrice=total_price,
                    paymentStatus=PaymentStatus.UNPAID,
                    overallStatus=OrderStatus.ORDERED,
                    priority=PriorityLevel.ROUTINE,
                    createdBy=1  # admin user ID (integer)
                )
                db.add(order)
                db.flush()  # Get auto-generated orderId

                # Create OrderTests
                for test in selected_tests:
                    order_test = OrderTest(
                        orderId=order.orderId,
                        testCode=test.code,
                        status=TestStatus.PENDING,
                        priceAtOrder=test.price
                    )
                    db.add(order_test)

                # Flush to ensure order and tests are committed before generating samples
                db.flush()

                # Generate samples for this order
                samples = generate_samples_for_order(order.orderId, db, 1)  # createdBy is now int
                db.flush()  # Flush samples to make IDs visible for next iteration
                samples_created += len(samples)

                orders_created += 1
                print(f"  ✓ ORD{order.orderId}: {num_tests} tests, {len(samples)} sample(s)")

        db.commit()
        print(f"\n{'='*60}")
        print(f"✅ Successfully created {orders_created} orders for {len(patients)} patients!")
        print(f"✅ Generated {samples_created} samples total")
        print(f"{'='*60}\n")

    except Exception as e:
        print(f"\n❌ Error generating orders: {e}")
        db.rollback()
        raise


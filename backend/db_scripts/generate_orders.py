"""
Generate orders for specific patients with sample results
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.test import Test
from app.schemas.enums import (
    OrderStatus, PaymentStatus, TestStatus, PriorityLevel,
    ContainerType, ContainerTopColor
)
from app.services.sample_generator import generate_samples_for_order
from app.services.lab_operations import LabOperationsService


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
        
        # Generate sample results for testing
        generate_sample_results(db)

    except Exception as e:
        print(f"\n❌ Error generating orders: {e}")
        db.rollback()
        raise


def generate_sample_results(db: Session):
    """
    Generate sample test results with various scenarios for testing.
    Creates orders with normal, abnormal, and critical values.
    """
    print("🧪 Generating sample results for testing...")
    
    # Get first patient
    patient = db.query(Patient).first()
    if not patient:
        print("  ⚠️  No patients found, skipping sample results")
        return
    
    # Get test definitions
    cbc_test = db.query(Test).filter(Test.code == "HEM001").first()
    potassium_test = db.query(Test).filter(Test.code == "CHEM008").first()
    
    if not cbc_test or not potassium_test:
        print("  ⚠️  Required tests not found, skipping sample results")
        return
    
    service = LabOperationsService(db)
    user_id = 1  # Admin user
    
    try:
        # Scenario 1: Normal CBC
        order1 = Order(
            patientId=patient.id,
            orderDate=datetime.now() - timedelta(days=1),
            totalPrice=cbc_test.price,
            paymentStatus=PaymentStatus.UNPAID,
            overallStatus=OrderStatus.ORDERED,
            priority=PriorityLevel.ROUTINE,
            createdBy=user_id
        )
        db.add(order1)
        db.flush()
        
        order_test1 = OrderTest(
            orderId=order1.orderId,
            testCode=cbc_test.code,
            status=TestStatus.PENDING,
            priceAtOrder=cbc_test.price
        )
        db.add(order_test1)
        db.flush()
        
        samples = generate_samples_for_order(order1.orderId, db, user_id)
        if samples:
            service.collect_sample(
                sample_id=samples[0].sampleId,
                user_id=user_id,
                collected_volume=5.0,
                container_type=ContainerType.TUBE,
                container_color=ContainerTopColor.PURPLE
            )
            
            service.enter_results(
                order_id=order1.orderId,
                test_code=cbc_test.code,
                user_id=user_id,
                results={
                    "WBC": "7.5", "RBC": "4.8", "Hemoglobin": "14.5",
                    "Hematocrit": "42", "Platelets": "250", "MCV": "88",
                    "MCH": "30", "MCHC": "34"
                },
                technician_notes="Normal CBC, all values within reference range"
            )
            print(f"  ✓ ORD{order1.orderId}: Normal CBC")
        
        # Scenario 2: Critical Potassium
        order2 = Order(
            patientId=patient.id,
            orderDate=datetime.now() - timedelta(hours=2),
            totalPrice=potassium_test.price,
            paymentStatus=PaymentStatus.UNPAID,
            overallStatus=OrderStatus.ORDERED,
            priority=PriorityLevel.STAT,
            createdBy=user_id
        )
        db.add(order2)
        db.flush()
        
        order_test2 = OrderTest(
            orderId=order2.orderId,
            testCode=potassium_test.code,
            status=TestStatus.PENDING,
            priceAtOrder=potassium_test.price
        )
        db.add(order_test2)
        db.flush()
        
        samples = generate_samples_for_order(order2.orderId, db, user_id)
        if samples:
            service.collect_sample(
                sample_id=samples[0].sampleId,
                user_id=user_id,
                collected_volume=5.0,
                container_type=ContainerType.TUBE,
                container_color=ContainerTopColor.RED
            )
            
            service.enter_results(
                order_id=order2.orderId,
                test_code=potassium_test.code,
                user_id=user_id,
                results={"K": "6.8"},  # Critical high
                technician_notes="CRITICAL: Potassium 6.8 - physician notification required"
            )
            print(f"  ✓ ORD{order2.orderId}: Critical Potassium (K=6.8)")
        
        # Scenario 3: Abnormal CBC
        order3 = Order(
            patientId=patient.id,
            orderDate=datetime.now() - timedelta(hours=3),
            totalPrice=cbc_test.price,
            paymentStatus=PaymentStatus.UNPAID,
            overallStatus=OrderStatus.ORDERED,
            priority=PriorityLevel.ROUTINE,
            createdBy=user_id
        )
        db.add(order3)
        db.flush()
        
        order_test3 = OrderTest(
            orderId=order3.orderId,
            testCode=cbc_test.code,
            status=TestStatus.PENDING,
            priceAtOrder=cbc_test.price
        )
        db.add(order_test3)
        db.flush()
        
        samples = generate_samples_for_order(order3.orderId, db, user_id)
        if samples:
            service.collect_sample(
                sample_id=samples[0].sampleId,
                user_id=user_id,
                collected_volume=5.0,
                container_type=ContainerType.TUBE,
                container_color=ContainerTopColor.PURPLE
            )
            
            service.enter_results(
                order_id=order3.orderId,
                test_code=cbc_test.code,
                user_id=user_id,
                results={
                    "WBC": "12.5", "RBC": "3.8", "Hemoglobin": "10.5",
                    "Hematocrit": "32", "Platelets": "180", "MCV": "85",
                    "MCH": "28", "MCHC": "33"
                },
                technician_notes="Mild leukocytosis and anemia - non-critical"
            )
            print(f"  ✓ ORD{order3.orderId}: Abnormal CBC (HIGH/LOW flags)")
        
        db.commit()
        print("✅ Sample results generated\n")
        
    except Exception as e:
        print(f"  ⚠️  Error generating sample results: {e}")
        db.rollback()


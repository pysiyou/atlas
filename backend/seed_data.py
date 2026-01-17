"""
Seed database with example data
Creates sample patients, tests, and orders for testing
"""
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import User, Patient, Test, Order, OrderTest
from app.core.security import get_password_hash
from app.schemas.enums import UserRole, Gender, TestStatus, OrderStatus, PaymentStatus, PriorityLevel


def seed_database():
    """Seed database with example data"""
    db = SessionLocal()
    
    try:
        print("🌱 Seeding database with example data...")
        
        # Create additional users
        users_data = [
            {
                "id": "USR-00000000-002",
                "username": "receptionist",
                "password": "recept123",
                "name": "Sarah Johnson",
                "role": UserRole.RECEPTIONIST,
                "email": "sarah@atlas.local"
            },
            {
                "id": "USR-00000000-003",
                "username": "labtech",
                "password": "lab123",
                "name": "Mike Chen",
                "role": UserRole.LAB_TECH,
                "email": "mike@atlas.local"
            },
            {
                "id": "USR-00000000-004",
                "username": "validator",
                "password": "valid123",
                "name": "Dr. Emily Rodriguez",
                "role": UserRole.VALIDATOR,
                "email": "emily@atlas.local"
            },
        ]
        
        for user_data in users_data:
            existing = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing:
                user = User(
                    id=user_data["id"],
                    username=user_data["username"],
                    hashed_password=get_password_hash(user_data["password"]),
                    name=user_data["name"],
                    role=user_data["role"],
                    email=user_data["email"]
                )
                db.add(user)
                print(f"  ✓ Created user: {user_data['name']} ({user_data['username']})")
        
        db.commit()
        
        # Create example tests
        tests_data = [
            {
                "code": "CBC001",
                "name": "Complete Blood Count",
                "display_name": "CBC",
                "category": "Hematology",
                "price": 25.00,
                "turnaround_time_hours": 4,
                "sample_type": "blood",
                "minimum_volume": 3.0,
                "optimal_volume": 5.0,
                "container_types": ["tube"],
                "container_top_colors": ["purple"],
                "fasting_required": False,
            },
            {
                "code": "GLUC001",
                "name": "Fasting Blood Glucose",
                "display_name": "FBG",
                "category": "Chemistry",
                "price": 15.00,
                "turnaround_time_hours": 2,
                "sample_type": "blood",
                "minimum_volume": 2.0,
                "optimal_volume": 3.0,
                "container_types": ["tube"],
                "container_top_colors": ["gray"],
                "fasting_required": True,
            },
            {
                "code": "LIPID001",
                "name": "Lipid Panel",
                "display_name": "Lipid Profile",
                "category": "Chemistry",
                "price": 35.00,
                "turnaround_time_hours": 6,
                "sample_type": "blood",
                "minimum_volume": 3.0,
                "optimal_volume": 5.0,
                "container_types": ["tube"],
                "container_top_colors": ["red"],
                "fasting_required": True,
            },
            {
                "code": "URIN001",
                "name": "Urinalysis Complete",
                "display_name": "Urinalysis",
                "category": "Urinalysis",
                "price": 20.00,
                "turnaround_time_hours": 3,
                "sample_type": "urine",
                "minimum_volume": 10.0,
                "optimal_volume": 30.0,
                "container_types": ["cup"],
                "container_top_colors": ["clear"],
                "fasting_required": False,
            },
        ]
        
        for test_data in tests_data:
            existing = db.query(Test).filter(Test.code == test_data["code"]).first()
            if not existing:
                test = Test(**test_data)
                db.add(test)
                print(f"  ✓ Created test: {test_data['name']} ({test_data['code']})")
        
        db.commit()
        
        # Create example patients
        patients_data = [
            {
                "id": "PAT-20260117-001",
                "fullName": "John Smith",
                "dateOfBirth": "1985-03-15",
                "gender": Gender.MALE,
                "phone": "+1-555-0101",
                "email": "john.smith@email.com",
                "address": {"street": "123 Main St", "city": "New York", "postalCode": "10001"},
                "emergencyContact": {"name": "Jane Smith", "phone": "+1-555-0102"},
                "medicalHistory": {
                    "chronicConditions": ["Hypertension"],
                    "currentMedications": ["Lisinopril 10mg"],
                    "allergies": ["Penicillin"],
                    "previousSurgeries": [],
                    "familyHistory": "Father had diabetes",
                    "lifestyle": {"smoking": False, "alcohol": False}
                },
                "registrationDate": datetime.utcnow(),
                "createdBy": "USR-00000000-001",
                "updatedBy": "USR-00000000-001",
            },
            {
                "id": "PAT-20260117-002",
                "fullName": "Maria Garcia",
                "dateOfBirth": "1992-07-22",
                "gender": Gender.FEMALE,
                "phone": "+1-555-0201",
                "email": "maria.garcia@email.com",
                "address": {"street": "456 Oak Ave", "city": "Los Angeles", "postalCode": "90001"},
                "emergencyContact": {"name": "Carlos Garcia", "phone": "+1-555-0202"},
                "medicalHistory": {
                    "chronicConditions": [],
                    "currentMedications": [],
                    "allergies": [],
                    "previousSurgeries": ["Appendectomy 2015"],
                    "familyHistory": "None reported",
                    "lifestyle": {"smoking": False, "alcohol": True}
                },
                "registrationDate": datetime.utcnow(),
                "createdBy": "USR-00000000-002",
                "updatedBy": "USR-00000000-002",
            },
        ]

        for patient_data in patients_data:
            existing = db.query(Patient).filter(Patient.id == patient_data["id"]).first()
            if not existing:
                patient = Patient(**patient_data)
                db.add(patient)
                print(f"  ✓ Created patient: {patient_data['fullName']} ({patient_data['id']})")
        
        db.commit()
        
        # Create example orders
        orders_data = [
            {
                "order_id": "ORD-20260117-001",
                "patient_id": "PAT-20260117-001",
                "order_date": datetime.utcnow(),
                "total_price": 75.00,
                "payment_status": PaymentStatus.PENDING,
                "overall_status": OrderStatus.PENDING,
                "priority": PriorityLevel.ROUTINE,
                "created_by": "USR-00000000-002",
                "test_codes": ["CBC001", "GLUC001", "LIPID001"],
            },
            {
                "order_id": "ORD-20260117-002",
                "patient_id": "PAT-20260117-002",
                "order_date": datetime.utcnow() - timedelta(hours=2),
                "total_price": 20.00,
                "payment_status": PaymentStatus.PAID,
                "overall_status": OrderStatus.SAMPLE_COLLECTION,
                "priority": PriorityLevel.ROUTINE,
                "created_by": "USR-00000000-002",
                "test_codes": ["URIN001"],
            },
        ]
        
        for order_data in orders_data:
            existing = db.query(Order).filter(Order.order_id == order_data["order_id"]).first()
            if not existing:
                test_codes = order_data.pop("test_codes")
                order = Order(**order_data)
                
                # Create order tests
                for test_code in test_codes:
                    test = db.query(Test).filter(Test.code == test_code).first()
                    if test:
                        order_test = OrderTest(
                            id=f"{order.order_id}_{test_code}",
                            order_id=order.order_id,
                            test_code=test_code,
                            status=TestStatus.PENDING,
                            price_at_order=test.price,
                        )
                        order.tests.append(order_test)
                
                db.add(order)
                print(f"  ✓ Created order: {order_data['order_id']} for patient {order_data['patient_id']}")
        
        db.commit()
        
        print("\n✅ Database seeded successfully!")
        print("\n📊 Summary:")
        print(f"  - Users: {db.query(User).count()}")
        print(f"  - Patients: {db.query(Patient).count()}")
        print(f"  - Tests: {db.query(Test).count()}")
        print(f"  - Orders: {db.query(Order).count()}")
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

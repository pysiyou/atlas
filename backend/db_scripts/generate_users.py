"""
Generate users
"""
from app.models import User
from app.core.security import get_password_hash
from app.schemas.enums import UserRole

def generate_users(db):
    """Seed initial users including admin"""
    print("🌱 Generating users...")
    users_data = [
        {
            "id": "USR-00000000-001",
            "username": "admin",
            "password": "admin123",
            "name": "System Administrator",
            "role": UserRole.ADMIN,
            "email": "admin@atlas.local"
        },
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
                hashedPassword=get_password_hash(user_data["password"]),
                name=user_data["name"],
                role=user_data["role"],
                email=user_data["email"]
            )
            db.add(user)
            print(f"  ✓ Created user: {user_data['name']} ({user_data['username']})")
    
    db.commit()

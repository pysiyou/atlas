"""
Database initialization script
Creates tables and seeds initial data
"""
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.schemas.enums import UserRole


def init_db():
    """Initialize database with tables and seed data"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")
    
    # Create default admin user
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("Creating default admin user...")
            admin = User(
                id="USR-00000000-001",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                name="System Administrator",
                role=UserRole.ADMIN,
                email="admin@atlas.local"
            )
            db.add(admin)
            db.commit()
            print("✓ Default admin user created")
            print("  Username: admin")
            print("  Password: admin123")
        else:
            print("✓ Admin user already exists")
    finally:
        db.close()
    
    print("\n✅ Database initialization complete!")


if __name__ == "__main__":
    init_db()

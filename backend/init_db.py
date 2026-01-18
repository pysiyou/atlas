"""
Database initialization script
Recreates the database, seeds initial data, and generates test data.
"""
from app.database import engine, Base, SessionLocal
from db_scripts.generate_users import generate_users
from db_scripts.generate_patients import generate_patients

def init_db():
    """Initialize database with fresh tables and data"""
    print("🚀 Initializing Database...")

    # 1. Drop and Create Tables
    print("\n🗑️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("✅ Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")

    # 2. Seed Data
    db = SessionLocal()
    try:
        # Seed core configuration data
        generate_users(db)
        
        # 3. Generate Patient Data
        # Generate random patients
        generate_patients(db, count=10)
        
        print("\n✅ Database initialization complete!")
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

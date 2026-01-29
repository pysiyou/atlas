from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from db_scripts.generate_users import generate_users
from db_scripts.generate_patients import generate_patients
from db_scripts.generate_tests import generate_tests
from db_scripts.generate_orders import generate_orders
from db_scripts.generate_payments import generate_payments
from db_scripts.seed_affiliation_pricing import seed_affiliation_pricing

def apply_migrations():
    """Apply database migrations for compliance features"""
    print("\n🔧 Applying database migrations...")
    
    with engine.connect() as conn:
        # Migration 1: Result immutability trigger
        print("  ⏳ Applying result immutability trigger...")
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION prevent_validated_result_update()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Check if trying to modify a validated result
                IF OLD.status = 'VALIDATED' AND (
                    (NEW.results::text IS DISTINCT FROM OLD.results::text) OR
                    (NEW.status IS DISTINCT FROM OLD.status)
                ) THEN
                    RAISE EXCEPTION 'Cannot modify validated results. Create an amended report instead.';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """))
        
        conn.execute(text("DROP TRIGGER IF EXISTS enforce_result_immutability ON order_tests;"))
        conn.execute(text("""
            CREATE TRIGGER enforce_result_immutability
            BEFORE UPDATE ON order_tests
            FOR EACH ROW
            EXECUTE FUNCTION prevent_validated_result_update();
        """))
        print("  ✓ Result immutability trigger applied")
        
        # Migration 2: Audit log immutability
        print("  ⏳ Applying audit log immutability rules...")
        conn.execute(text("""
            CREATE OR REPLACE RULE prevent_audit_delete AS
            ON DELETE TO lab_operation_logs
            DO INSTEAD NOTHING;
        """))
        conn.execute(text("""
            CREATE OR REPLACE RULE prevent_audit_update AS
            ON UPDATE TO lab_operation_logs
            DO INSTEAD NOTHING;
        """))
        print("  ✓ Audit log immutability rules applied")
        
        # Migration 3: Sample FK constraint
        print("  ⏳ Applying sample FK constraint...")
        conn.execute(text("ALTER TABLE order_tests DROP CONSTRAINT IF EXISTS fk_order_test_sample;"))
        conn.execute(text("""
            ALTER TABLE order_tests
            ADD CONSTRAINT fk_order_test_sample
            FOREIGN KEY (sample_id) REFERENCES samples(sample_id)
            ON DELETE SET NULL;
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_order_tests_sample_id 
            ON order_tests(sample_id);
        """))
        print("  ✓ Sample FK constraint applied")
        
        conn.commit()
    
    print("✓ All migrations applied")

def init_db():
    """Initialize database with fresh tables and data"""
    print("🚀 Initializing Database...")

    # 1. Drop and Create Tables
    print("\n🗑️  Dropping all tables...")
    # Drop triggers, rules, and constraints first to avoid conflicts
    with engine.connect() as conn:
        conn.execute(text("DROP TRIGGER IF EXISTS enforce_result_immutability ON order_tests CASCADE;"))
        conn.execute(text("DROP FUNCTION IF EXISTS prevent_validated_result_update() CASCADE;"))
        conn.execute(text("DROP RULE IF EXISTS prevent_audit_delete ON lab_operation_logs CASCADE;"))
        conn.execute(text("DROP RULE IF EXISTS prevent_audit_update ON lab_operation_logs CASCADE;"))
        conn.execute(text("ALTER TABLE IF EXISTS order_tests DROP CONSTRAINT IF EXISTS fk_order_test_sample CASCADE;"))
        conn.commit()
    
    Base.metadata.drop_all(bind=engine)
    
    print("✅ Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")
    
    # 2. Apply database migrations
    apply_migrations()

    # 3. Seed Data
    db = SessionLocal()
    try:
        # Seed core configuration data
        generate_users(db)
        
        # Seed affiliation pricing
        seed_affiliation_pricing(db)
        
        # 4. Generate Catalog Data
        generate_tests(db)
        
        # 5. Generate Patient Data
        # Generate random patients
        generate_patients(db, count=10)

        # 6. Generate Order Data
        generate_orders(db)
        
        # 7. Generate Payment Data
        generate_payments(db)
        
        print("\n" + "="*60)
        print("✅ Database initialization complete!")
        print("="*60)
        print("\n📊 Test Data Summary:")
        print("  • Users: 4 (admin, receptionist, lab tech, lab tech plus)")
        print("  • Patients: 10")
        print("  • Tests in catalog: 87")
        print("  • Orders: ~13 (10 basic + 3 with results)")
        print("  • Sample results: 3 orders")
        print("    - Normal CBC")
        print("    - Critical Potassium (K=6.8)")
        print("    - Abnormal CBC (HIGH/LOW flags)")
        print("\n🔒 Security Features:")
        print("  ✓ Result immutability trigger active")
        print("  ✓ Audit log append-only")
        print("  ✓ Sample FK constraint enforced")
        print("\n🚀 Ready for development!")
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

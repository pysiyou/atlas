from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from db_scripts.generate_users import generate_users
from db_scripts.generate_tests import generate_tests
from db_scripts.seed_affiliation_pricing import seed_affiliation_pricing
from db_scripts.seed_lis_6months import seed_lis_6months

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
        
        # Migration 4: Add escalated to TestStatus enum (order_tests.status)
        print("  ⏳ Adding test status 'escalated' to enum...")
        conn.execute(text("ALTER TYPE teststatus ADD VALUE IF NOT EXISTS 'escalated'"))
        print("  ✓ Test status escalated added")
        
        # Migration 5: Add timestamps to order_tests
        print("  ⏳ Adding timestamps to order_tests...")
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'order_tests' 
            AND column_name IN ('created_at', 'updated_at')
        """))
        existing_columns = {row[0] for row in result}
        
        if 'created_at' not in existing_columns:
            conn.execute(text("""
                ALTER TABLE order_tests 
                ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            """))
            print("    ✓ Added created_at column")
        
        if 'updated_at' not in existing_columns:
            conn.execute(text("""
                ALTER TABLE order_tests 
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            """))
            print("    ✓ Added updated_at column")
        
        # Create or replace the update trigger
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION update_order_test_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """))
        
        conn.execute(text("DROP TRIGGER IF EXISTS order_test_updated_at_trigger ON order_tests;"))
        conn.execute(text("""
            CREATE TRIGGER order_test_updated_at_trigger
            BEFORE UPDATE ON order_tests
            FOR EACH ROW
            EXECUTE FUNCTION update_order_test_updated_at();
        """))
        print("  ✓ Order test timestamps and trigger applied")
        
        # Migration 6: Add comment to lab_operation_logs
        print("  ⏳ Adding comment column to lab_operation_logs...")
        conn.execute(text("""
            ALTER TABLE lab_operation_logs
            ADD COLUMN IF NOT EXISTS comment VARCHAR(2000) NULL
        """))
        conn.execute(text("""
            COMMENT ON COLUMN lab_operation_logs.comment IS
            'Optional free-text note for this operation (e.g. rejection reason, validation notes)'
        """))
        print("  ✓ Lab operation log comment column applied")
        
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
        
        # 4. Generate catalog data
        generate_tests(db)
        
        # 5. Seed LIS 6-month history (50 patients, orders, samples, workflows, lab_operation_logs)
        seed_lis_6months(db, commit=True)
        
        print("\n" + "="*60)
        print("✅ Database initialization complete!")
        print("="*60)
        print("\n📊 Seed Data Summary:")
        print("  • Users: 4 (admin, receptionist, lab tech, lab tech plus)")
        print("  • Patients: 50 (registration spread over 6 months)")
        print("  • Tests in catalog: from test-catalog.json")
        print("  • Orders / samples / workflows: LIS 6-month seed (scenarios: completed, pending, escalated, etc.)")
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

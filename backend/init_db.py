from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from db_scripts.migrate_quality_issue_workflow import migrate as migrate_quality_issue_workflow
from db_scripts.generate_users import generate_users
from db_scripts.generate_tests import generate_tests
from db_scripts.seed_affiliation_pricing import seed_affiliation_pricing

def apply_migrations():
    """Apply database migrations for compliance features"""
    print("\n🔧 Applying database migrations...")

    with engine.connect() as conn:
        # Result immutability trigger
        print("  ⏳ Applying result immutability trigger...")
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION prevent_validated_result_update()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Check if trying to modify a validated result
                IF OLD.status::text = 'validated' AND (
                    (NEW.results::text IS DISTINCT FROM OLD.results::text) OR
                    (NEW.status::text IS DISTINCT FROM OLD.status::text
                     AND NEW.status::text <> 'escalated')
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

        # Audit log immutability
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
        conn.commit()

    # Lab workflow — canonical enum values only
    print("  ⏳ Applying quality-issue workflow migration...")
    migrate_quality_issue_workflow(dry_run=False)
    print("  ✓ Quality-issue workflow migration applied")

    print("✓ All migrations applied")

def init_db():
    """Initialize database with fresh tables and data"""
    print("🚀 Initializing Database...")

    # 1. Drop and Create Tables
    print("\n🗑️  Dropping all tables...")
    # Drop triggers and rules first to avoid conflicts
    with engine.connect() as conn:
        conn.execute(text("DROP TRIGGER IF EXISTS enforce_result_immutability ON order_tests CASCADE;"))
        conn.execute(text("DROP FUNCTION IF EXISTS prevent_validated_result_update() CASCADE;"))
        conn.execute(text("DROP RULE IF EXISTS prevent_audit_delete ON lab_operation_logs CASCADE;"))
        conn.execute(text("DROP RULE IF EXISTS prevent_audit_update ON lab_operation_logs CASCADE;"))
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

        print("\n" + "="*60)
        print("✅ Database initialization complete!")
        print("="*60)
        print("\n📊 Seed Data Summary:")
        print("  • Users: 4 (admin, receptionist, lab tech, lab tech plus)")
        print("  • Tests in catalog: from test-catalog.json")
        print("  • Affiliation pricing: 6, 12, 24 month plans")
        print("\n🔒 Security Features:")
        print("  ✓ Result immutability trigger active")
        print("  ✓ Audit log append-only")
        print("  ✓ Sample FK constraint enforced")
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

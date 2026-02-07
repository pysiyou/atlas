"""
Reset Lab Data Script

Cleans the entire database of lab-generated data while preserving
system configuration (users, test catalog, affiliation pricing).

Usage (from backend directory):
  PYTHONPATH=. poetry run python db_scripts/reset_lab_data.py
  PYTHONPATH=. poetry run python db_scripts/reset_lab_data.py --include-config   # also wipe users/tests
"""
from __future__ import annotations

import argparse

from sqlalchemy import text
from app.database import engine, SessionLocal


# Tables to truncate, ordered by foreign-key dependency (children first).
LAB_DATA_TABLES = [
    "lab_operation_logs",
    "aliquots",
    "reports",
    "insurance_claims",
    "payments",
    "invoices",
    "order_tests",
    "samples",
    "orders",
    "patients",
]

CONFIG_TABLES = [
    "affiliation_pricing",
    "tests",
    "users",
]


def reset_lab_data(include_config: bool = False) -> None:
    """
    Truncate lab data tables in the correct dependency order.

    The lab_operation_logs table has PostgreSQL RULES that prevent DELETE and UPDATE.
    We must temporarily drop those rules, truncate, then re-apply them.
    """
    tables = LAB_DATA_TABLES[:]
    if include_config:
        tables.extend(CONFIG_TABLES)

    with engine.connect() as conn:
        # 1. Temporarily remove audit log immutability rules
        print("Dropping audit log immutability rules...")
        conn.execute(text("DROP RULE IF EXISTS prevent_audit_delete ON lab_operation_logs CASCADE;"))
        conn.execute(text("DROP RULE IF EXISTS prevent_audit_update ON lab_operation_logs CASCADE;"))

        # 2. Temporarily drop the result immutability trigger
        print("Dropping result immutability trigger...")
        conn.execute(text("DROP TRIGGER IF EXISTS enforce_result_immutability ON order_tests CASCADE;"))

        # 3. Truncate all tables (CASCADE handles remaining FKs)
        for table in tables:
            try:
                conn.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;"))
                print(f"  Truncated: {table}")
            except Exception as e:
                print(f"  Skip {table}: {e}")

        # 4. Re-apply audit log immutability rules
        print("Re-applying audit log immutability rules...")
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

        # 5. Re-apply result immutability trigger
        print("Re-applying result immutability trigger...")
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION prevent_validated_result_update()
            RETURNS TRIGGER AS $$
            BEGIN
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
        conn.execute(text("""
            CREATE TRIGGER enforce_result_immutability
            BEFORE UPDATE ON order_tests
            FOR EACH ROW
            EXECUTE FUNCTION prevent_validated_result_update();
        """))

        conn.commit()

    print("\nDatabase reset complete.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Reset lab data (truncate tables).")
    parser.add_argument(
        "--include-config",
        action="store_true",
        help="Also wipe users, tests, and affiliation pricing.",
    )
    args = parser.parse_args()

    confirm = input(
        "This will DELETE ALL lab data (patients, orders, samples, results, logs). Continue? [y/N] "
    )
    if confirm.strip().lower() != "y":
        print("Aborted.")
        return

    reset_lab_data(include_config=args.include_config)


if __name__ == "__main__":
    main()

"""
Migrate laboperationtype enum and normalize legacy audit log values.

Legacy databases stored uppercase enum labels (e.g. RESULT_ENTRY) while the
application now uses lowercase values (e.g. result_entry). This script:
  1. Adds any missing lowercase enum values
  2. Rewrites legacy uppercase rows in lab_operation_logs to lowercase

Run after pulling escalation-engine changes on an existing database:
    python -m db_scripts.migrate_lab_operation_type_enum
"""
from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.database import engine
from app.schemas.enums import LabOperationType


def sync_lab_operation_type_enum_values(conn: Connection) -> None:
    """Ensure every LabOperationType value exists in PostgreSQL."""
    for op in LabOperationType:
        value = op.value.replace("'", "''")
        conn.execute(
            text(
                f"""
                DO $$ BEGIN
                    ALTER TYPE laboperationtype ADD VALUE '{value}';
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
                """
            )
        )


def migrate_legacy_uppercase_operation_logs(conn: Connection) -> int:
    """
    Rewrite legacy uppercase operation_type labels to lowercase values.

    Returns the number of rows updated.
    """
    conn.execute(text("DROP RULE IF EXISTS prevent_audit_update ON lab_operation_logs;"))

    result = conn.execute(
        text(
            """
            UPDATE lab_operation_logs
            SET operation_type = lower(operation_type::text)::laboperationtype
            WHERE operation_type::text <> lower(operation_type::text)
            """
        )
    )

    conn.execute(
        text(
            """
            CREATE OR REPLACE RULE prevent_audit_update AS
            ON UPDATE TO lab_operation_logs
            DO INSTEAD NOTHING;
            """
        )
    )

    return result.rowcount or 0


def migrate_lab_operation_type_enum() -> None:
    """Sync enum values and normalize legacy audit log operation types."""
    print("Migrating laboperationtype enum values...")
    with engine.connect() as conn:
        sync_lab_operation_type_enum_values(conn)
        for op in LabOperationType:
            print(f"  ✓ {op.value}")

        updated = migrate_legacy_uppercase_operation_logs(conn)
        if updated:
            print(f"  ✓ Normalized {updated} legacy audit log row(s) to lowercase values")

        conn.commit()
    print("Done.")


if __name__ == "__main__":
    migrate_lab_operation_type_enum()

"""
Create recollection_requests table and add supervisor-gated redraw enum values.

Usage:
  cd backend && python -m db_scripts.migrate_recollection_requests
"""
from __future__ import annotations

from sqlalchemy import text

from app.database import engine
from app.models.recollection_request import RecollectionRequest
from app.schemas.enums import LabOperationType, RecollectionRequestStatus, RemedyType


def _add_enum_value(conn, enum_type: str, value: str) -> None:
    safe = value.replace("'", "''")
    conn.execute(
        text(
            f"""
            DO $$ BEGIN
                ALTER TYPE {enum_type} ADD VALUE '{safe}';
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
            """
        )
    )


def _enum_exists(conn, name: str) -> bool:
    return (
        conn.execute(
            text("SELECT 1 FROM pg_type WHERE typname = :n AND typtype = 'e'"),
            {"n": name},
        ).first()
        is not None
    )


def _ensure_enum_values(conn, enum_type: str, values: list[str]) -> None:
    if not _enum_exists(conn, enum_type):
        labels = ", ".join(f"'{value.replace(chr(39), chr(39) * 2)}'" for value in values)
        conn.execute(text(f"CREATE TYPE {enum_type} AS ENUM ({labels})"))
        print(f"  created enum {enum_type}")
        return

    for value in values:
        print(f"  ensuring {enum_type}.{value}")
        _add_enum_value(conn, enum_type, value)


def migrate() -> None:
    with engine.connect() as conn:
        print("Updating remedytype enum...")
        _ensure_enum_values(
            conn,
            "remedytype",
            [member.value for member in RemedyType],
        )

        print("Updating recollectionrequeststatus enum...")
        _ensure_enum_values(
            conn,
            "recollectionrequeststatus",
            [member.value for member in RecollectionRequestStatus],
        )

        print("Updating laboperationtype enum...")
        _ensure_enum_values(
            conn,
            "laboperationtype",
            [member.value for member in LabOperationType],
        )

        conn.commit()

    RecollectionRequest.__table__.create(bind=engine, checkfirst=True)
    print("recollection_requests table ready.")


if __name__ == "__main__":
    migrate()

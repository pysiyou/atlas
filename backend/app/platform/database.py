"""
Database connection and session management
"""
import enum
from typing import TypeVar

from app.platform.config import settings
from sqlalchemy import Enum as SAEnum
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

E = TypeVar("E", bound=enum.Enum)


def contract_enum(enum_cls: type[E], **kwargs) -> SAEnum:
    """Bind a SQLAlchemy enum column to contract string values (enum.value), not member names."""
    return SAEnum(
        enum_cls,
        values_callable=lambda members: [member.value for member in members],
        **kwargs,
    )


# Create engine for PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False,  # Set to True for SQL query logging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_audit_event_scope_column() -> None:
    """
    Add and backfill audit_events.event_scope on existing databases.

    create_all does not ALTER existing tables, so production DBs need this
    additive step after the ORM model gains the column.
    """
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE audit_events "
                "ADD COLUMN IF NOT EXISTS event_scope VARCHAR(20)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_audit_events_event_scope "
                "ON audit_events (event_scope)"
            )
        )
        conn.execute(
            text(
                """
                UPDATE audit_events
                SET event_scope = CASE
                    WHEN event_type LIKE 'patient.%' THEN 'patient'
                    WHEN event_type LIKE 'system.%' THEN 'system'
                    WHEN event_type LIKE 'laboratory.%' THEN 'lab'
                    ELSE 'order'
                END
                WHERE event_scope IS NULL
                """
            )
        )


def ensure_user_admin_columns() -> None:
    """
    Add users.is_active and users.last_login_at on existing databases.

    create_all does not ALTER existing tables, so production DBs need this
    additive step after the ORM model gains the columns.
    """
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ"
            )
        )


def ensure_order_referring_physician_column() -> None:
    """
    Re-add orders.referring_physician on DBs that dropped it; backfill empty values.

    create_all does not ALTER existing tables, so this runs additive DDL plus a
    one-time placeholder fill for legacy rows (dev/demo data).
    """
    placeholder_names = (
        "Dr. Jaures Nolack",
        "Prof. Aminata Diallo",
        "Dr. Chikezie Okafor",
        "Pharm. Kwame Mensah",
        "Dr. Sandrine Mba",
        "Chief Surg. Modibo Keita",
        "Dr. Awa Traoré",
        "Prof. Yvan Kamdem",
        "Chief Matron Ngozi Eze",
        "Dr. Fally Ilunga",
        "Pharm. Ndèye Cissé",
        "Med. Dir. Kojo Asare",
        "Surg. Emeka Nwosu",
        "Prof. Chantal Ngoma",
        "Lab. Dir. Koffi Kouadio",
    )
    names_sql = ", ".join(f"'{name.replace(chr(39), chr(39) * 2)}'" for name in placeholder_names)
    array_len = len(placeholder_names)

    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE orders "
                "ADD COLUMN IF NOT EXISTS referring_physician VARCHAR(200)"
            )
        )
        conn.execute(
            text(
                f"""
                UPDATE orders o
                SET referring_physician = pick.name
                FROM (
                    SELECT order_id,
                        (ARRAY[{names_sql}])[
                            1 + floor(random() * {array_len})::int
                        ] AS name
                    FROM orders
                    WHERE referring_physician IS NULL
                       OR btrim(referring_physician) = ''
                ) AS pick
                WHERE o.order_id = pick.order_id
                """
            )
        )


def ensure_list_indexes() -> None:
    """
    Add list/search indexes that create_all will not attach to existing tables.

    pg_trgm GIN indexes are skipped when the extension cannot be created.
    """
    with engine.begin() as conn:
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_orders_overall_status ON orders (overall_status)")
        )
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_orders_payment_status ON orders (payment_status)")
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_orders_order_date_desc ON orders (order_date DESC)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_orders_updated_at_desc ON orders (updated_at DESC)"
            )
        )
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_patients_full_name_trgm "
                    "ON patients USING gin (full_name gin_trgm_ops)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_tests_name_trgm "
                    "ON tests USING gin (name gin_trgm_ops)"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_tests_code_trgm "
                    "ON tests USING gin (code gin_trgm_ops)"
                )
            )
        except Exception:
            # Managed databases may deny CREATE EXTENSION; btree name/code indexes still help.
            pass


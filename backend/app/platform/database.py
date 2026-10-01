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


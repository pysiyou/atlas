"""
Database connection and session management
"""
import enum
from typing import TypeVar

from app.platform.config import settings
from sqlalchemy import Enum as SAEnum
from sqlalchemy import create_engine
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
    connect_args={"connect_timeout": 5},
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


def init_db() -> None:
    """Drop every table and recreate the schema with no rows (dev bootstrap)."""
    import app.domains.registry  # noqa: F401 — register ORM models

    print("Initializing database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Tables created (empty). Create the first administrator from the login screen.")


def sync_missing_columns() -> None:
    """ALTER TABLE … ADD COLUMN for columns mapped in ORM but missing in PostgreSQL."""
    import logging

    from sqlalchemy import inspect, text

    logger = logging.getLogger(__name__)
    inspector = inspect(engine)
    dialect = engine.dialect
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            existing = {col["name"] for col in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing:
                    continue
                col_type = column.type.compile(dialect=dialect)
                if column.nullable or column.server_default is not None or column.default is not None:
                    null_sql = "NULL" if column.nullable else "NOT NULL"
                else:
                    null_sql = "NULL"
                ddl = (
                    f'ALTER TABLE "{table.name}" ADD COLUMN IF NOT EXISTS '
                    f'"{column.name}" {col_type} {null_sql}'
                )
                conn.execute(text(ddl))
                logger.info("schema_sync: added %s.%s", table.name, column.name)

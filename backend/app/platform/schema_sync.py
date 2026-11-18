"""Add ORM columns missing from an existing PostgreSQL schema (dev / post-migration)."""
from __future__ import annotations

import logging

from sqlalchemy import inspect, text

from app.platform.database import Base, engine

logger = logging.getLogger(__name__)


def sync_missing_columns() -> None:
    """ALTER TABLE … ADD COLUMN for each mapped column not present in the database."""
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
                # New columns on populated tables must be nullable unless a default exists.
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
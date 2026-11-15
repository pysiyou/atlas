"""
Additive PostgreSQL schema patches for existing tables.

``Base.metadata.create_all`` creates missing tables but does not ALTER
existing ones. These statements add new columns/indexes idempotently.
"""
from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

_PATCH_STATEMENTS: tuple[str, ...] = (
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS mrn VARCHAR",
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_patients_mrn ON patients (mrn)",
    "ALTER TABLE samples ADD COLUMN IF NOT EXISTS accession_number VARCHAR",
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_samples_accession_number ON samples (accession_number)",
    "ALTER TABLE samples ADD COLUMN IF NOT EXISTS parent_sample_id INTEGER",
    "ALTER TABLE samples ADD COLUMN IF NOT EXISTS is_aliquot BOOLEAN DEFAULT FALSE",
    "ALTER TABLE samples ADD COLUMN IF NOT EXISTS aliquot_index INTEGER",
    "ALTER TABLE samples ADD COLUMN IF NOT EXISTS aliquot_volume FLOAT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_by VARCHAR",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR",
    "UPDATE patients SET mrn = 'MRN-' || lpad(id::text, 8, '0') WHERE mrn IS NULL",
)


def apply_schema_patches(engine: Engine) -> None:
    """Apply additive ALTER/INDEX statements. Safe to run on every startup."""
    with engine.begin() as connection:
        for statement in _PATCH_STATEMENTS:
            try:
                connection.execute(text(statement))
            except Exception:
                logger.exception("Schema patch failed: %s", statement)
                raise
    logger.info("Applied %s additive schema patches", len(_PATCH_STATEMENTS))

"""Ensure DB uses only the 3-tier catalog schema (orderable tests, analytes, clinical workups)."""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Obsolete table names removed from Atlas after the catalog cutover.
OBSOLETE_CATALOG_TABLES = ("catalog_panels", "tests")


def _table_exists(db: Session, name: str) -> bool:
    return name in inspect(db.get_bind()).get_table_names()


def _order_tests_fk_targets(db: Session) -> set[str | None]:
    return {
        fk.get("referred_table")
        for fk in inspect(db.get_bind()).get_foreign_keys("order_tests")
    }


def _repoint_order_tests_to_orderable_tests(db: Session) -> bool:
    """If ``order_tests`` still FKs to obsolete ``tests``, repoint to ``orderable_tests``."""
    if "tests" not in _order_tests_fk_targets(db):
        return False
    legacy_name: str | None = None
    for fk in inspect(db.get_bind()).get_foreign_keys("order_tests"):
        if fk.get("referred_table") == "tests" and fk.get("constrained_columns") == ["test_code"]:
            legacy_name = fk.get("name")
            break
    if not legacy_name:
        return False
    orphan = db.execute(
        text(
            """
            SELECT DISTINCT ot.test_code
            FROM order_tests ot
            LEFT JOIN orderable_tests t ON t.code = ot.test_code
            WHERE t.code IS NULL
            LIMIT 20
            """
        )
    ).fetchall()
    if orphan:
        codes = ", ".join(row[0] for row in orphan if row[0])
        raise RuntimeError(
            f"Cannot finalize catalog: order_tests reference unknown codes: {codes}. "
            "Add them to contracts or fix data before restart."
        )
    db.execute(text(f'ALTER TABLE order_tests DROP CONSTRAINT "{legacy_name}"'))
    ensure_order_tests_references_orderable_tests(db)
    return True


def drop_obsolete_catalog_tables(db: Session) -> list[str]:
    """Drop obsolete catalog tables if they still exist."""
    dropped: list[str] = []
    if _table_exists(db, "tests") and "tests" in _order_tests_fk_targets(db):
        _repoint_order_tests_to_orderable_tests(db)
    for name in OBSOLETE_CATALOG_TABLES:
        if not _table_exists(db, name):
            continue
        db.execute(text(f'DROP TABLE IF EXISTS "{name}" CASCADE'))
        dropped.append(name)
    if dropped:
        db.commit()
        logger.info("Dropped obsolete catalog tables: %s", dropped)
    return dropped


def ensure_order_tests_references_orderable_tests(db: Session) -> bool:
    """Add FK order_tests.test_code → orderable_tests.code when missing."""
    if not _table_exists(db, "orderable_tests"):
        return False
    targets = _order_tests_fk_targets(db)
    if "orderable_tests" in targets:
        return False

    orphan = db.execute(
        text(
            """
            SELECT DISTINCT ot.test_code
            FROM order_tests ot
            LEFT JOIN orderable_tests t ON t.code = ot.test_code
            WHERE t.code IS NULL
            LIMIT 20
            """
        )
    ).fetchall()
    if orphan:
        codes = ", ".join(row[0] for row in orphan if row[0])
        raise RuntimeError(
            f"order_tests references unknown test codes (not in orderable_tests): {codes}"
        )

    db.execute(
        text(
            """
            ALTER TABLE order_tests
            ADD CONSTRAINT order_tests_test_code_fkey
            FOREIGN KEY (test_code) REFERENCES orderable_tests(code)
            """
        )
    )
    db.commit()
    logger.info("Added FK order_tests.test_code → orderable_tests.code")
    return True


def verify_catalog_architecture(db: Session) -> dict[str, Any]:
    """Return counts and assert legacy tables are absent."""
    stats: dict[str, Any] = {
        "obsolete_tables_present": [n for n in OBSOLETE_CATALOG_TABLES if _table_exists(db, n)],
        "orderable_tests": 0,
        "catalog_analytes": 0,
        "clinical_workups": 0,
        "fk_to_orderable_tests": "orderable_tests" in _order_tests_fk_targets(db),
    }
    for table, key in (
        ("orderable_tests", "orderable_tests"),
        ("catalog_analytes", "catalog_analytes"),
        ("clinical_workups", "clinical_workups"),
    ):
        if _table_exists(db, table):
            stats[key] = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0
    return stats


def finalize_catalog_schema(db: Session) -> dict[str, Any]:
    """
    Drop obsolete catalog tables, ensure FKs, and return architecture verification.

    Call after ``CatalogSeedService.seed_from_contracts()`` on every startup.
    """
    dropped = drop_obsolete_catalog_tables(db)
    fk_added = ensure_order_tests_references_orderable_tests(db)
    stats = verify_catalog_architecture(db)
    stats["obsolete_tables_dropped"] = dropped
    stats["order_tests_fk_added"] = fk_added
    if stats["obsolete_tables_present"]:
        raise RuntimeError(f"Obsolete catalog tables still present: {stats['obsolete_tables_present']}")
    return stats
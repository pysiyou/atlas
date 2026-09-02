"""
One-shot database migration for the quality-issue lab workflow.

Normalizes all enum data to the canonical contract values (contracts/enums.json)
and applies schema changes. No dual-format support — after this script, only
canonical values remain in use.

Usage:
    cd backend
    poetry run python -m db_scripts.migrate_quality_issue_workflow
    poetry run python -m db_scripts.migrate_quality_issue_workflow --dry-run

Recommended: pg_dump backup first.
"""
from __future__ import annotations

import argparse
import sys
from typing import Iterable

from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.database import engine
from app.models.quality_issue import QualityIssue
from app.schemas.enums import (
    ContainerTopColor,
    ContainerType,
    EscalationResolutionAction,
    Gender,
    LabOperationType,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    PriorityLevel,
    SampleStatus,
    SampleType,
    TestStatus,
    UserRole,
)

# Canonical value sets — single source of truth
CANONICAL_TEST_STATUSES = {s.value for s in TestStatus}
CANONICAL_SAMPLE_STATUSES = {s.value for s in SampleStatus}
CANONICAL_ORDER_STATUSES = {s.value for s in OrderStatus}
CANONICAL_LAB_OPERATIONS = {s.value for s in LabOperationType}
CANONICAL_ESCALATION_ACTIONS = {s.value for s in EscalationResolutionAction}


def _member_name_map(enum_cls) -> dict[str, str]:
    """Map legacy PostgreSQL labels stored as Python member names → contract values."""
    return {member.name: member.value for member in enum_cls}


# table, column, postgres enum type, mapping source enum
CONTRACT_ENUM_COLUMNS: list[tuple[str, str, str, type]] = [
    ("orders", "payment_status", "paymentstatus", PaymentStatus),
    ("invoices", "payment_status", "paymentstatus", PaymentStatus),
    ("orders", "priority", "prioritylevel", PriorityLevel),
    ("samples", "priority", "prioritylevel", PriorityLevel),
    ("samples", "sample_type", "sampletype", SampleType),
    ("users", "role", "userrole", UserRole),
    ("patients", "gender", "gender", Gender),
    ("samples", "actual_container_type", "containertype", ContainerType),
    ("samples", "actual_container_color", "containertopcolor", ContainerTopColor),
    ("payments", "payment_method", "paymentmethod", PaymentMethod),
]
TEST_STATUS_TO_CANONICAL: dict[str, str] = {
    "PENDING": TestStatus.PENDING.value,
    "SAMPLE_COLLECTED": TestStatus.SAMPLE_COLLECTED.value,
    "RESULTED": TestStatus.RESULTED.value,
    "VALIDATED": TestStatus.VALIDATED.value,
    "ESCALATED": TestStatus.ESCALATED.value,
    "SUPERSEDED": TestStatus.SUPERSEDED.value,
    "REMOVED": TestStatus.REMOVED.value,
    "IN_PROGRESS": TestStatus.SAMPLE_COLLECTED.value,
    "REJECTED": TestStatus.SUSPENDED.value,
    "in-progress": TestStatus.SAMPLE_COLLECTED.value,
    "rejected": TestStatus.SUSPENDED.value,
}

SAMPLE_STATUS_TO_CANONICAL: dict[str, str] = {
    "PENDING": SampleStatus.PENDING.value,
    "COLLECTED": SampleStatus.COLLECTED.value,
    "REJECTED": SampleStatus.REJECTED.value,
}

ORDER_STATUS_TO_CANONICAL: dict[str, str] = {
    "ORDERED": OrderStatus.ORDERED.value,
    "IN_PROGRESS": OrderStatus.IN_PROGRESS.value,
    "COMPLETED": OrderStatus.COMPLETED.value,
    "CANCELLED": OrderStatus.CANCELLED.value,
}

OPERATION_TYPE_TO_CANONICAL: dict[str, str] = {
    # Removed rejection flows → quality_issue_reported
    "result_validation_reject": LabOperationType.QUALITY_ISSUE_REPORTED.value,
    "result_validation_reject_retest": LabOperationType.QUALITY_ISSUE_REPORTED.value,
    "result_validation_reject_recollect": LabOperationType.QUALITY_ISSUE_REPORTED.value,
    "result_validation_escalate": LabOperationType.QUALITY_ISSUE_REPORTED.value,
    "RESULT_VALIDATION_REJECT_RETEST": LabOperationType.QUALITY_ISSUE_REPORTED.value,
    "RESULT_VALIDATION_REJECT_RECOLLECT": LabOperationType.QUALITY_ISSUE_REPORTED.value,
    "RESULT_VALIDATION_ESCALATE": LabOperationType.QUALITY_ISSUE_REPORTED.value,
    # Renamed escalation resolution
    "escalation_resolution_final_reject": LabOperationType.ESCALATION_RESOLUTION_CANCEL_TEST.value,
    "ESCALATION_RESOLUTION_FINAL_REJECT": LabOperationType.ESCALATION_RESOLUTION_CANCEL_TEST.value,
    # Uppercase audit labels → lowercase contract values
    "SAMPLE_COLLECT": LabOperationType.SAMPLE_COLLECT.value,
    "SAMPLE_REJECT": LabOperationType.SAMPLE_REJECT.value,
    "SAMPLE_RECOLLECTION_REQUEST": LabOperationType.SAMPLE_RECOLLECTION_REQUEST.value,
    "RESULT_ENTRY": LabOperationType.RESULT_ENTRY.value,
    "RESULT_VALIDATION_APPROVE": LabOperationType.RESULT_VALIDATION_APPROVE.value,
    "ORDER_STATUS_CHANGE": LabOperationType.ORDER_STATUS_CHANGE.value,
    "TEST_ADDED": LabOperationType.TEST_ADDED.value,
    "TEST_REMOVED": LabOperationType.TEST_REMOVED.value,
    "CRITICAL_VALUE_DETECTED": LabOperationType.CRITICAL_VALUE_DETECTED.value,
    "CRITICAL_VALUE_NOTIFIED": LabOperationType.CRITICAL_VALUE_NOTIFIED.value,
    "CRITICAL_VALUE_ACKNOWLEDGED": LabOperationType.CRITICAL_VALUE_ACKNOWLEDGED.value,
    "ESCALATION_RESOLUTION_AUTHORIZE_RETEST": LabOperationType.ESCALATION_RESOLUTION_AUTHORIZE_RETEST.value,
    "ESCALATION_RESOLUTION_AUTHORIZE_RECOLLECT": LabOperationType.ESCALATION_RESOLUTION_AUTHORIZE_RECOLLECT.value,
    "ESCALATION_RESOLUTION_FORCE_VALIDATE": LabOperationType.ESCALATION_RESOLUTION_FORCE_VALIDATE.value,
}

ESCALATION_ACTION_TO_CANONICAL: dict[str, str] = {
    "final_reject": EscalationResolutionAction.CANCEL_TEST.value,
    "FINAL_REJECT": EscalationResolutionAction.CANCEL_TEST.value,
}


def _add_enum_value(conn: Connection, enum_type: str, value: str) -> None:
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


def _enum_exists(conn: Connection, name: str) -> bool:
    return conn.execute(
        text("SELECT 1 FROM pg_type WHERE typname = :n AND typtype = 'e'"),
        {"n": name},
    ).first() is not None


def _table_exists(conn: Connection, name: str) -> bool:
    return conn.execute(
        text(
            "SELECT 1 FROM information_schema.tables"
            " WHERE table_schema = 'public' AND table_name = :n"
        ),
        {"n": name},
    ).first() is not None


def _column_exists(conn: Connection, table: str, column: str) -> bool:
    return conn.execute(
        text(
            "SELECT 1 FROM information_schema.columns"
            " WHERE table_schema = 'public' AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    ).first() is not None


def _count(conn: Connection, sql: str, **params) -> int:
    return int(conn.execute(text(sql), params).scalar() or 0)


def _section(title: str) -> None:
    print(f"\n{'=' * 60}\n{title}\n{'=' * 60}")


def _status_counts(conn: Connection, table: str, column: str, label: str) -> None:
    rows = conn.execute(
        text(f"SELECT {column}::text, COUNT(*) FROM {table} GROUP BY 1 ORDER BY 2 DESC")
    ).fetchall()
    print(f"\n{label}")
    for value, count in rows or []:
        mark = "" if value in _canonical_for_table(table, column) else "  ← non-canonical"
        print(f"  {value}: {count}{mark}")


def _canonical_for_table(table: str, column: str) -> set[str]:
    if table == "order_tests" and column == "status":
        return CANONICAL_TEST_STATUSES
    if table == "samples" and column == "status":
        return CANONICAL_SAMPLE_STATUSES
    if table == "orders" and column == "overall_status":
        return CANONICAL_ORDER_STATUSES
    return set()


def inspect(conn: Connection) -> None:
    _section("Database state")
    if _table_exists(conn, "order_tests"):
        _status_counts(conn, "order_tests", "status", "order_tests.status")
    if _table_exists(conn, "samples"):
        _status_counts(conn, "samples", "status", "samples.status")
    if _table_exists(conn, "orders"):
        _status_counts(conn, "orders", "overall_status", "orders.overall_status")
    if _table_exists(conn, "lab_operation_logs"):
        rows = conn.execute(
            text(
                "SELECT operation_type::text, COUNT(*) FROM lab_operation_logs"
                " GROUP BY 1 ORDER BY 2 DESC"
            )
        ).fetchall()
        print("\nlab_operation_logs.operation_type")
        for value, count in rows:
            mark = "" if value in CANONICAL_LAB_OPERATIONS else "  ← non-canonical"
            print(f"  {value}: {count}{mark}")


def ensure_enum_values(conn: Connection, enum_type: str, values: Iterable[str], dry_run: bool) -> None:
    if not _enum_exists(conn, enum_type):
        print(f"  {enum_type}: not found, skipping")
        return
    for value in values:
        action = "would add" if dry_run else "adding"
        print(f"  {action} {enum_type}.{value}")
        if not dry_run:
            _add_enum_value(conn, enum_type, value)


def ensure_schema_enums(conn: Connection, dry_run: bool) -> None:
    _section("Ensuring PostgreSQL enum values")
    ensure_enum_values(conn, "teststatus", CANONICAL_TEST_STATUSES, dry_run)
    ensure_enum_values(conn, "samplestatus", CANONICAL_SAMPLE_STATUSES, dry_run)
    ensure_enum_values(conn, "orderstatus", CANONICAL_ORDER_STATUSES, dry_run)
    ensure_enum_values(conn, "laboperationtype", CANONICAL_LAB_OPERATIONS, dry_run)
    ensure_enum_values(conn, "escalationresolutionaction", CANONICAL_ESCALATION_ACTIONS, dry_run)
    ensure_enum_values(conn, "paymentstatus", {s.value for s in PaymentStatus}, dry_run)
    ensure_enum_values(conn, "prioritylevel", {s.value for s in PriorityLevel}, dry_run)
    ensure_enum_values(conn, "sampletype", {s.value for s in SampleType}, dry_run)
    ensure_enum_values(conn, "userrole", {s.value for s in UserRole}, dry_run)
    ensure_enum_values(conn, "gender", {s.value for s in Gender}, dry_run)
    ensure_enum_values(conn, "containertype", {s.value for s in ContainerType}, dry_run)
    ensure_enum_values(conn, "containertopcolor", {s.value for s in ContainerTopColor}, dry_run)
    ensure_enum_values(conn, "paymentmethod", {s.value for s in PaymentMethod}, dry_run)


def _apply_mapped_updates(
    conn: Connection,
    *,
    table: str,
    column: str,
    enum_type: str,
    mapping: dict[str, str],
    dry_run: bool,
) -> int:
    total = 0
    for source, target in mapping.items():
        count = _count(
            conn,
            f"SELECT COUNT(*) FROM {table} WHERE {column}::text = :source",
            source=source,
        )
        if count == 0:
            continue
        if dry_run:
            print(f"  [dry-run] {source} → {target}: {count}")
            total += count
            continue
        result = conn.execute(
            text(
                f"""
                UPDATE {table}
                SET {column} = CAST(:target AS {enum_type})
                WHERE {column}::text = :source
                """
            ),
            {"source": source, "target": target},
        )
        updated = result.rowcount or 0
        print(f"  ✓ {source} → {target}: {updated}")
        total += updated
    return total


def _disable_order_test_triggers(conn: Connection) -> None:
    conn.execute(text("DROP TRIGGER IF EXISTS enforce_result_immutability ON order_tests;"))


def _enable_order_test_triggers(conn: Connection) -> None:
    conn.execute(
        text(
            """
            CREATE TRIGGER enforce_result_immutability
            BEFORE UPDATE ON order_tests
            FOR EACH ROW
            EXECUTE FUNCTION prevent_validated_result_update();
            """
        )
    )


def normalize_order_tests(conn: Connection, dry_run: bool) -> None:
    _section("Normalizing order_tests.status")
    if not _table_exists(conn, "order_tests"):
        print("  order_tests not found")
        return

    if not dry_run:
        _disable_order_test_triggers(conn)
    special_steps: list[tuple[str, str, dict]] = [
        (
            "in-progress with results → resulted",
            """
            UPDATE order_tests
            SET status = CAST(:target AS teststatus)
            WHERE status::text IN ('IN_PROGRESS', 'in-progress')
              AND results IS NOT NULL
            """,
            {"target": TestStatus.RESULTED.value},
        ),
        (
            "rejected with retest child → superseded",
            """
            UPDATE order_tests ot
            SET status = CAST(:target AS teststatus)
            WHERE ot.status::text IN ('REJECTED', 'rejected')
              AND EXISTS (
                SELECT 1 FROM order_tests c WHERE c.retest_of_test_id = ot.id
              )
            """,
            {"target": TestStatus.SUPERSEDED.value},
        ),
        (
            "rejected with open escalation → escalated",
            """
            UPDATE order_tests ot
            SET status = CAST(:target AS teststatus)
            WHERE ot.status::text IN ('REJECTED', 'rejected')
              AND EXISTS (
                SELECT 1 FROM escalation_tickets et
                WHERE et.order_test_id = ot.id AND et.status::text = 'OPEN'
              )
            """,
            {"target": TestStatus.ESCALATED.value},
        ),
        (
            "remaining rejected → suspended",
            """
            UPDATE order_tests
            SET status = CAST(:target AS teststatus)
            WHERE status::text IN ('REJECTED', 'rejected')
            """,
            {"target": TestStatus.SUSPENDED.value},
        ),
    ]

    for label, sql, params in special_steps:
        if dry_run:
            count_sql = "SELECT COUNT(*) FROM order_tests" + sql[sql.find(" WHERE") :]
            count_sql = count_sql.replace("UPDATE order_tests", "").replace("UPDATE order_tests ot", "")
            count_sql = count_sql.replace("SET status = :target::teststatus", "").strip()
            # Use simpler per-step counts
            count = _count_special_order_tests(conn, label)
            print(f"  [dry-run] {label}: {count}")
        else:
            result = conn.execute(text(sql), params)
            print(f"  ✓ {label}: {result.rowcount or 0}")

    _apply_mapped_updates(
        conn,
        table="order_tests",
        column="status",
        enum_type="teststatus",
        mapping=TEST_STATUS_TO_CANONICAL,
        dry_run=dry_run,
    )

    if not dry_run:
        _enable_order_test_triggers(conn)


def _count_special_order_tests(conn: Connection, label: str) -> int:
    queries = {
        "in-progress with results → resulted": """
            SELECT COUNT(*) FROM order_tests
            WHERE status::text IN ('IN_PROGRESS', 'in-progress') AND results IS NOT NULL
        """,
        "rejected with retest child → superseded": """
            SELECT COUNT(*) FROM order_tests ot
            WHERE ot.status::text IN ('REJECTED', 'rejected')
              AND EXISTS (SELECT 1 FROM order_tests c WHERE c.retest_of_test_id = ot.id)
        """,
        "rejected with open escalation → escalated": """
            SELECT COUNT(*) FROM order_tests ot
            WHERE ot.status::text IN ('REJECTED', 'rejected')
              AND EXISTS (
                SELECT 1 FROM escalation_tickets et
                WHERE et.order_test_id = ot.id AND et.status::text = 'OPEN'
              )
        """,
        "remaining rejected → suspended": """
            SELECT COUNT(*) FROM order_tests
            WHERE status::text IN ('REJECTED', 'rejected')
        """,
    }
    return _count(conn, queries.get(label, "SELECT 0"))


def normalize_samples(conn: Connection, dry_run: bool) -> None:
    _section("Normalizing samples.status")
    if not _table_exists(conn, "samples"):
        return
    _apply_mapped_updates(
        conn,
        table="samples",
        column="status",
        enum_type="samplestatus",
        mapping=SAMPLE_STATUS_TO_CANONICAL,
        dry_run=dry_run,
    )


def normalize_contract_enums(conn: Connection, dry_run: bool) -> None:
    _section("Normalizing remaining contract enums")
    for table, column, enum_type, enum_cls in CONTRACT_ENUM_COLUMNS:
        if not _table_exists(conn, table) or not _column_exists(conn, table, column):
            continue
        mapping = _member_name_map(enum_cls)
        _apply_mapped_updates(
            conn,
            table=table,
            column=column,
            enum_type=enum_type,
            mapping=mapping,
            dry_run=dry_run,
        )


def normalize_orders(conn: Connection, dry_run: bool) -> None:
    _section("Normalizing orders.overall_status")
    if not _table_exists(conn, "orders"):
        return
    _apply_mapped_updates(
        conn,
        table="orders",
        column="overall_status",
        enum_type="orderstatus",
        mapping=ORDER_STATUS_TO_CANONICAL,
        dry_run=dry_run,
    )


def normalize_audit_logs(conn: Connection, dry_run: bool) -> None:
    _section("Normalizing lab_operation_logs.operation_type")
    if not _table_exists(conn, "lab_operation_logs"):
        return

    if not dry_run:
        conn.execute(text("DROP RULE IF EXISTS prevent_audit_update ON lab_operation_logs;"))

    _apply_mapped_updates(
        conn,
        table="lab_operation_logs",
        column="operation_type",
        enum_type="laboperationtype",
        mapping=OPERATION_TYPE_TO_CANONICAL,
        dry_run=dry_run,
    )

    if not dry_run:
        conn.execute(
            text(
                """
                CREATE OR REPLACE RULE prevent_audit_update AS
                ON UPDATE TO lab_operation_logs DO INSTEAD NOTHING;
                """
            )
        )


def normalize_escalation_actions(conn: Connection, dry_run: bool) -> None:
    _section("Normalizing escalation_tickets.resolution_action")
    if not _table_exists(conn, "escalation_tickets"):
        return
    if not _column_exists(conn, "escalation_tickets", "resolution_action"):
        return
    _apply_mapped_updates(
        conn,
        table="escalation_tickets",
        column="resolution_action",
        enum_type="escalationresolutionaction",
        mapping=ESCALATION_ACTION_TO_CANONICAL,
        dry_run=dry_run,
    )


def ensure_quality_issues_table(conn: Connection, dry_run: bool) -> None:
    _section("Ensuring quality_issues table")
    if dry_run:
        print(f"  [dry-run] exists: {_table_exists(conn, 'quality_issues')}")
        return
    QualityIssue.__table__.create(bind=conn, checkfirst=True)
    print("  ✓ ready")


def drop_deprecated_columns(conn: Connection, dry_run: bool) -> None:
    _section("Dropping deprecated columns")
    for table, column in (
        ("order_tests", "result_rejection_history"),
        ("samples", "rejection_history"),
    ):
        if not _column_exists(conn, table, column):
            print(f"  {table}.{column}: absent")
            continue
        if dry_run:
            print(f"  [dry-run] would drop {table}.{column}")
        else:
            conn.execute(text(f"ALTER TABLE {table} DROP COLUMN {column}"))
            print(f"  ✓ dropped {table}.{column}")


def assert_canonical(conn: Connection) -> None:
    _section("Verification")
    errors: list[str] = []

    if _table_exists(conn, "order_tests"):
        bad = conn.execute(
            text(
                """
                SELECT status::text, COUNT(*) FROM order_tests
                WHERE status::text NOT IN (
                  'pending', 'sample-collected', 'resulted', 'validated',
                  'suspended', 'cancelled', 'escalated', 'superseded', 'removed'
                )
                GROUP BY 1
                """
            )
        ).fetchall()
        for value, count in bad:
            errors.append(f"order_tests.status '{value}' ({count} rows)")

    if _table_exists(conn, "samples"):
        bad = conn.execute(
            text(
                """
                SELECT status::text, COUNT(*) FROM samples
                WHERE status::text NOT IN ('pending', 'collected', 'rejected')
                GROUP BY 1
                """
            )
        ).fetchall()
        for value, count in bad:
            errors.append(f"samples.status '{value}' ({count} rows)")

    if _table_exists(conn, "orders"):
        bad = conn.execute(
            text(
                """
                SELECT overall_status::text, COUNT(*) FROM orders
                WHERE overall_status::text NOT IN ('ordered', 'in-progress', 'completed', 'cancelled')
                GROUP BY 1
                """
            )
        ).fetchall()
        for value, count in bad:
            errors.append(f"orders.overall_status '{value}' ({count} rows)")

    if errors:
        print("  ✗ Non-canonical values remain:")
        for err in errors:
            print(f"    - {err}")
        raise RuntimeError("Migration incomplete — non-canonical enum values remain")

    for table, column, _, enum_cls in CONTRACT_ENUM_COLUMNS:
        if not _table_exists(conn, table) or not _column_exists(conn, table, column):
            continue
        allowed = {m.value for m in enum_cls}
        bad = conn.execute(
            text(f"SELECT {column}::text, COUNT(*) FROM {table} GROUP BY 1")
        ).fetchall()
        for value, count in bad:
            if value not in allowed:
                errors.append(f"{table}.{column} '{value}' ({count} rows)")

    if errors:
        print("  ✗ Non-canonical values remain:")
        for err in errors:
            print(f"    - {err}")
        raise RuntimeError("Migration incomplete — non-canonical enum values remain")
    print("  ✓ All enum columns use canonical contract values")


def migrate(*, dry_run: bool = False) -> None:
    print("Quality Issue Workflow Migration (canonical cutover)")
    print(f"  dry_run={dry_run}")

    with engine.connect() as conn:
        inspect(conn)

    if dry_run:
        with engine.connect() as conn:
            ensure_schema_enums(conn, dry_run=True)
            normalize_order_tests(conn, dry_run=True)
            normalize_samples(conn, dry_run=True)
            normalize_orders(conn, dry_run=True)
            normalize_contract_enums(conn, dry_run=True)
            normalize_escalation_actions(conn, dry_run=True)
            normalize_audit_logs(conn, dry_run=True)
            ensure_quality_issues_table(conn, dry_run=True)
            drop_deprecated_columns(conn, dry_run=True)
            conn.rollback()
        print("\n[dry-run] No changes committed.")
        return

    # Phase 1: enum labels must be committed before they can be used in UPDATEs
    with engine.connect() as conn:
        ensure_schema_enums(conn, dry_run=False)
        conn.commit()
    print("\n  ✓ Enum values committed")

    # Phase 2: normalize data + schema cleanup
    with engine.connect() as conn:
        normalize_order_tests(conn, dry_run=False)
        normalize_samples(conn, dry_run=False)
        normalize_orders(conn, dry_run=False)
        normalize_contract_enums(conn, dry_run=False)
        normalize_escalation_actions(conn, dry_run=False)
        normalize_audit_logs(conn, dry_run=False)
        ensure_quality_issues_table(conn, dry_run=False)
        drop_deprecated_columns(conn, dry_run=False)
        conn.commit()
    print("\n✓ Migration committed.")

    with engine.connect() as verify_conn:
        inspect(verify_conn)
        assert_canonical(verify_conn)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Migrate DB to canonical quality-issue workflow.")
    parser.add_argument("--dry-run", action="store_true", help="Report only; no writes.")
    args = parser.parse_args(argv)
    try:
        migrate(dry_run=args.dry_run)
        return 0
    except Exception as exc:
        print(f"\n✗ {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

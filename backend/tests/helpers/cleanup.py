"""Remove QA test data after test runs."""
from __future__ import annotations

from sqlalchemy import text

from app.database import SessionLocal
from tests.helpers.factories import PATIENT_PREFIX


def cleanup_qa_data() -> dict[str, int]:
    db = SessionLocal()
    counts = {"patients": 0, "orders": 0}
    try:
        patient_ids = [
            r[0]
            for r in db.execute(
                text("SELECT id FROM patients WHERE full_name LIKE :p"),
                {"p": f"{PATIENT_PREFIX}%"},
            ).fetchall()
        ]
        counts["patients"] = len(patient_ids)
        if not patient_ids:
            return counts
        order_ids = [
            r[0]
            for r in db.execute(
                text("SELECT order_id FROM orders WHERE patient_id = ANY(:ids)"),
                {"ids": patient_ids},
            ).fetchall()
        ]
        counts["orders"] = len(order_ids)
        if order_ids:
            for sql in (
                "DELETE FROM payments WHERE order_id = ANY(:ids)",
                "DELETE FROM escalation_tickets WHERE order_test_id IN (SELECT id FROM order_tests WHERE order_id = ANY(:ids))",
                "DELETE FROM quality_issues WHERE order_id = ANY(:ids)",
                "DELETE FROM recollection_requests WHERE order_id = ANY(:ids)",
                "DELETE FROM order_tests WHERE order_id = ANY(:ids)",
                "DELETE FROM samples WHERE order_id = ANY(:ids)",
                "DELETE FROM orders WHERE order_id = ANY(:ids)",
            ):
                db.execute(text(sql), {"ids": order_ids})
        db.execute(text("DELETE FROM patients WHERE id = ANY(:ids)"), {"ids": patient_ids})
        db.commit()
        return counts
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

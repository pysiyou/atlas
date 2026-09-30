"""SQL-backed lab board snapshot service."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.lab.models.escalation import EscalationTicket
from app.domains.lab.models.quality_issue import QualityIssue
from app.domains.lab.models.recollection_request import RecollectionRequest
from app.domains.lab.models.sample import Sample
from app.domains.lab.monitor.tat import (
    assemble_board,
)
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from app.shared.contracts.enums import (
    EscalationTicketStatus,
    RecollectionRequestStatus,
    SampleStatus,
    TestStatus,
)
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session


class LabBoardService:
    """Loads stage rows and assembles the lab monitor board snapshot."""

    def __init__(self, db: Session):
        self.db = db
        self._tat_cache: dict[str, int] = {}

    def _get_turnaround(self, test_code: str) -> int:
        if test_code in self._tat_cache:
            return self._tat_cache[test_code]
        row = (
            self.db.query(CatalogTest.turnaroundTimeHours)
            .filter(CatalogTest.code == test_code)
            .first()
        )
        hours = row[0] if row else 24
        self._tat_cache[test_code] = hours
        return hours

    def _max_tat_for_codes(self, codes: list[str] | None) -> int:
        if not codes:
            return 24
        return max(self._get_turnaround(code) for code in codes)

    def compute_board_summary(self, include_supervisor: bool = True) -> dict[str, Any]:
        """SQL-backed counts for tab badges — avoids loading full queue rows."""
        from app.shared.contracts.enums import SampleStatus, TestStatus

        collection_count = (
            self.db.query(Sample.sampleId).filter(Sample.status == SampleStatus.PENDING).count()
        )
        entry_count = (
            self.db.query(OrderTest.id)
            .filter(OrderTest.status == TestStatus.SAMPLE_COLLECTED)
            .count()
        )
        validation_count = (
            self.db.query(OrderTest.id)
            .filter(
                OrderTest.status == TestStatus.RESULTED,
                OrderTest.resultValidatedAt.is_(None),
            )
            .count()
        )
        supervisor = 0
        if include_supervisor:
            supervisor = len(self._escalation_rows()) + len(self._recollection_rows())
        counts = {
            "collection": collection_count,
            "entry": entry_count,
            "validation": validation_count,
            "supervisor": supervisor,
        }
        total_active = collection_count + entry_count + validation_count
        if total_active == 0 and supervisor == 0:
            health = "healthy"
            health_message = "No active pipeline work"
            suggested_tab = None
        elif supervisor > 0:
            health = "attention"
            health_message = f"{supervisor} supervisor item(s) need review"
            suggested_tab = "validation"
        else:
            health = "attention"
            health_message = f"{total_active} active item(s) in pipeline"
            suggested_tab = (
                "collection"
                if collection_count >= entry_count and collection_count >= validation_count
                else "entry"
                if entry_count >= validation_count
                else "validation"
            )
        current = datetime.now(UTC)
        return {
            "counts": counts,
            "health": health,
            "healthMessage": health_message,
            "suggestedTab": suggested_tab,
            "totalActive": total_active,
            "computedAt": current.isoformat(),
            "todayPanel": self._today_panel_snapshot(),
            "_rows_loaded": supervisor,
        }

    def compute_board_snapshot(
        self,
        include_supervisor: bool = True,
        *,
        detail: str = "full",
    ) -> dict[str, Any]:
        if detail == "summary":
            return self.compute_board_summary(include_supervisor=include_supervisor)

        collection_rows = self._collection_rows()
        entry_rows = self._entry_rows()
        validation_rows = self._validation_rows()
        escalation_rows = self._escalation_rows() if include_supervisor else []
        recollection_rows = self._recollection_rows() if include_supervisor else []
        rows_loaded = (
            len(collection_rows)
            + len(entry_rows)
            + len(validation_rows)
            + len(escalation_rows)
            + len(recollection_rows)
        )
        snapshot = assemble_board(
            collection_rows,
            entry_rows,
            validation_rows,
            escalation_rows,
            recollection_rows,
        )
        snapshot.update({"todayPanel": self._today_panel_snapshot(), "_rows_loaded": rows_loaded})
        return snapshot

    def _today_panel_snapshot(self) -> dict[str, Any]:
        """UTC day KPIs among order tests updated today — milestone *events* today only."""
        today_start = self._utc_today_start()
        worked_today_filter = OrderTest.updatedAt >= today_start

        tests_updated_today = (
            self.db.query(func.count(OrderTest.id)).filter(worked_today_filter).scalar() or 0
        )
        tests_with_collection = (
            self.db.query(func.count(OrderTest.id))
            .filter(worked_today_filter)
            .filter(self._collection_today_predicate(today_start))
            .scalar()
            or 0
        )
        tests_with_result_entry = (
            self.db.query(func.count(OrderTest.id))
            .filter(worked_today_filter)
            .filter(self._result_entry_today_predicate(today_start))
            .scalar()
            or 0
        )
        tests_with_validation = (
            self.db.query(func.count(OrderTest.id))
            .filter(worked_today_filter)
            .filter(self._validation_today_predicate(today_start))
            .scalar()
            or 0
        )
        tests_off_normal_path = (
            self.db.query(func.count(OrderTest.id))
            .filter(worked_today_filter)
            .filter(self._off_normal_path_today_predicate(today_start))
            .scalar()
            or 0
        )

        return {
            "dayStartUtc": today_start,
            "testsUpdatedToday": tests_updated_today,
            "testsWithCollection": tests_with_collection,
            "testsWithResultEntry": tests_with_result_entry,
            "testsWithValidation": tests_with_validation,
            "testsOffNormalPath": tests_off_normal_path,
        }

    def _collection_today_predicate(self, today_start: datetime):
        """Specimen collection timestamp falls on the current UTC day."""
        collected_sample_ids = (
            self.db.query(Sample.sampleId)
            .filter(Sample.collectedAt.isnot(None))
            .filter(Sample.collectedAt >= today_start)
            .distinct()
        )
        return OrderTest.sampleId.in_(collected_sample_ids)

    @staticmethod
    def _result_entry_today_predicate(today_start: datetime):
        return and_(
            OrderTest.resultEnteredAt.isnot(None),
            OrderTest.resultEnteredAt >= today_start,
        )

    @staticmethod
    def _validation_today_predicate(today_start: datetime):
        return and_(
            OrderTest.resultValidatedAt.isnot(None),
            OrderTest.resultValidatedAt >= today_start,
        )

    def _off_normal_path_today_predicate(self, today_start: datetime):
        """Quality/rework events recorded today (not lifetime exception state)."""
        quality_test_ids = (
            self.db.query(QualityIssue.orderTestId)
            .filter(QualityIssue.orderTestId.isnot(None))
            .filter(QualityIssue.createdAt >= today_start)
            .distinct()
        )
        quality_sample_ids = (
            self.db.query(QualityIssue.sampleId)
            .filter(QualityIssue.sampleId.isnot(None))
            .filter(QualityIssue.createdAt >= today_start)
            .distinct()
        )
        rejected_sample_ids = (
            self.db.query(Sample.sampleId)
            .filter(Sample.status == SampleStatus.REJECTED)
            .filter(Sample.rejectedAt.isnot(None))
            .filter(Sample.rejectedAt >= today_start)
            .distinct()
        )
        terminal_status_today = and_(
            OrderTest.status.in_(
                (
                    TestStatus.CANCELLED,
                    TestStatus.REMOVED,
                    TestStatus.SUPERSEDED,
                    TestStatus.ESCALATED,
                )
            ),
            OrderTest.updatedAt >= today_start,
        )
        rework_created_today = and_(
            or_(
                OrderTest.isRetest.is_(True),
                OrderTest.retestOrderTestId.isnot(None),
                OrderTest.retestNumber > 0,
            ),
            OrderTest.createdAt >= today_start,
        )
        return or_(
            terminal_status_today,
            OrderTest.sampleId.in_(rejected_sample_ids),
            rework_created_today,
            OrderTest.id.in_(quality_test_ids),
            OrderTest.sampleId.in_(quality_sample_ids),
        )

    def _utc_today_start(self) -> datetime:
        today = datetime.now(UTC).date()
        return datetime.combine(today, datetime.min.time()).replace(tzinfo=UTC)

    def _active_order_test_filter(self):
        return ~OrderTest.status.in_(
            (TestStatus.CANCELLED, TestStatus.REMOVED, TestStatus.SUPERSEDED)
        )

    def _recollection_blocked_order_test_ids(self) -> set[int]:
        from app.domains.lab.quality.recollection_snapshot import (
            recollection_blocked_order_test_ids,
        )

        return recollection_blocked_order_test_ids(self.db)

    def _collection_rows(self) -> list[dict[str, Any]]:
        rows = (
            self.db.query(Sample, Order, Patient)
            .join(Order, Sample.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .filter(Sample.status == SampleStatus.PENDING)
            .all()
        )
        return [
            {
                "sample_id": sample.sampleId,
                "order_id": order.orderId,
                "patient_name": patient.fullName,
                "priority": order.priority,
                "payment_status": order.paymentStatus,
                "order_date": order.orderDate,
                "is_recollection": bool(sample.isRecollection),
                "sample_status": sample.status,
                "turnaround_hours": self._max_tat_for_codes(sample.testCodes or []),
            }
            for sample, order, patient in rows
        ]

    def _entry_rows(self) -> list[dict[str, Any]]:
        rows = (
            self.db.query(OrderTest, Order, Patient, CatalogTest, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(CatalogTest, OrderTest.testCode == CatalogTest.code)
            .outerjoin(Sample, Sample.sampleId == OrderTest.sampleId)
            .filter(OrderTest.status == TestStatus.SAMPLE_COLLECTED)
            .all()
        )
        return [
            {
                "order_test_id": ot.id,
                "order_id": order.orderId,
                "patient_name": patient.fullName,
                "priority": order.priority,
                "is_retest": bool(ot.isRetest),
                "collected_at": sample.collectedAt if sample else None,
                "order_date": order.orderDate,
                "sample_status": sample.status if sample else None,
                "sample_is_recollection": bool(sample.isRecollection) if sample else False,
                "turnaround_hours": test.turnaroundTimeHours or 24,
            }
            for ot, order, patient, test, sample in rows
        ]

    def _validation_rows(self) -> list[dict[str, Any]]:
        rows = (
            self.db.query(OrderTest, Order, Patient, CatalogTest, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(CatalogTest, OrderTest.testCode == CatalogTest.code)
            .outerjoin(Sample, Sample.sampleId == OrderTest.sampleId)
            .filter(
                OrderTest.status == TestStatus.RESULTED,
                OrderTest.resultValidatedAt.is_(None),
            )
            .all()
        )
        return [
            {
                "order_test_id": ot.id,
                "order_id": order.orderId,
                "patient_name": patient.fullName,
                "priority": order.priority,
                "is_retest": bool(ot.isRetest),
                "result_entered_at": ot.resultEnteredAt,
                "collected_at": sample.collectedAt if sample else None,
                "order_date": order.orderDate,
                "sample_status": sample.status if sample else None,
                "turnaround_hours": test.turnaroundTimeHours or 24,
                "has_critical_values": bool(ot.hasCriticalValues),
            }
            for ot, order, patient, test, sample in rows
        ]

    def _escalation_rows(self) -> list[dict[str, Any]]:
        rows = (
            self.db.query(OrderTest, Order, Patient, CatalogTest)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(CatalogTest, OrderTest.testCode == CatalogTest.code)
            .filter(OrderTest.status == TestStatus.ESCALATED)
            .all()
        )
        test_ids = [ot.id for ot, _order, _patient, _test in rows]
        tickets_by_test: dict[int, EscalationTicket] = {}
        if test_ids:
            for ticket in (
                self.db.query(EscalationTicket)
                .filter(
                    EscalationTicket.orderTestId.in_(test_ids),
                    EscalationTicket.status == EscalationTicketStatus.OPEN,
                )
                .all()
            ):
                tickets_by_test[ticket.orderTestId] = ticket
        result: list[dict[str, Any]] = []
        for ot, order, patient, test in rows:
            ticket = tickets_by_test.get(ot.id)
            result.append(
                {
                    "order_test_id": ot.id,
                    "order_id": order.orderId,
                    "patient_name": patient.fullName,
                    "priority": order.priority,
                    "is_retest": bool(ot.isRetest),
                    "result_entered_at": ot.resultEnteredAt,
                    "order_date": order.orderDate,
                    "reason_code": ticket.reasonCode.value
                    if ticket and ticket.reasonCode
                    else None,
                    "turnaround_hours": test.turnaroundTimeHours or 24,
                }
            )
        return result

    def _recollection_rows(self) -> list[dict[str, Any]]:
        rows = (
            self.db.query(RecollectionRequest, Order, Patient)
            .join(Order, RecollectionRequest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .filter(RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL)
            .all()
        )
        return [
            {
                "id": request.id,
                "order_id": order.orderId,
                "created_at": request.createdAt,
                "patient_name": patient.fullName,
                "affected_order_test_ids": request.affectedOrderTestIds or [],
                "order_test_id": request.orderTestId,
                "priority": order.priority,
            }
            for request, order, patient in rows
        ]

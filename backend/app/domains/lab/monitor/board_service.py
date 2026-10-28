"""SQL-backed lab board snapshot service."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.domains.catalog.models.catalog_test import CatalogTest
from app.domains.lab.models.escalation import EscalationTicket
from app.domains.lab.models.recollection_request import RecollectionRequest
from app.domains.lab.models.sample import Sample
from app.domains.lab.monitor.tat import (
    assemble_board,
)
from app.domains.lab.schemas.worklists import LabTodayStageSnapshot
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

    @staticmethod
    def _terminal_test_statuses() -> tuple[TestStatus, ...]:
        return (
            TestStatus.CANCELLED,
            TestStatus.REMOVED,
            TestStatus.SUPERSEDED,
            TestStatus.VALIDATED,
        )

    @staticmethod
    def _running_tests_predicate():
        return ~OrderTest.status.in_(LabBoardService._terminal_test_statuses())

    @staticmethod
    def _monitor_universe_predicate(today_start: datetime):
        """Same universe as the lab monitor worklist: updated today or still running."""
        worked_today = OrderTest.updatedAt >= today_start
        still_running = LabBoardService._running_tests_predicate()
        return or_(worked_today, still_running)

    @staticmethod
    def _at_collection_predicate():
        return OrderTest.status == TestStatus.PENDING

    @staticmethod
    def _at_entry_predicate():
        return OrderTest.status == TestStatus.SAMPLE_COLLECTED

    @staticmethod
    def _at_validation_predicate():
        return and_(
            LabBoardService._running_tests_predicate(),
            ~OrderTest.status.in_((TestStatus.PENDING, TestStatus.SAMPLE_COLLECTED)),
        )

    @staticmethod
    def _stage_percent(count: int, total: int) -> int:
        if total <= 0:
            return 0
        return min(100, round((count / total) * 100))

    def _today_panel_snapshot(self) -> dict[str, Any]:
        """Per-stage queue depth, today's milestone counts, and % of monitor universe."""
        today_start = self._utc_today_start()
        universe = self._monitor_universe_predicate(today_start)
        running = self._running_tests_predicate()

        total_tests = self.db.query(func.count(OrderTest.id)).filter(universe).scalar() or 0
        tests_updated_today = (
            self.db.query(func.count(OrderTest.id))
            .filter(OrderTest.updatedAt >= today_start)
            .scalar()
            or 0
        )

        stage_specs: tuple[tuple[str, Any, Any], ...] = (
            (
                "collection",
                and_(running, self._at_collection_predicate()),
                self._collection_today_predicate(today_start),
            ),
            (
                "entry",
                and_(running, self._at_entry_predicate()),
                self._result_entry_today_predicate(today_start),
            ),
            (
                "validation",
                self._at_validation_predicate(),
                self._validation_today_predicate(today_start),
            ),
        )

        stages: list[LabTodayStageSnapshot] = []
        for stage_key, at_stage_filter, touched_today_filter in stage_specs:
            at_stage = self.db.query(func.count(OrderTest.id)).filter(at_stage_filter).scalar() or 0
            touched_today = (
                self.db.query(func.count(OrderTest.id))
                .filter(universe)
                .filter(touched_today_filter)
                .scalar()
                or 0
            )
            stages.append(
                LabTodayStageSnapshot(
                    stage=stage_key,
                    atStage=at_stage,
                    atStagePercent=self._stage_percent(at_stage, total_tests),
                    touchedToday=touched_today,
                    touchedTodayPercent=self._stage_percent(touched_today, total_tests),
                )
            )

        return {
            "dayStartUtc": today_start,
            "totalTests": total_tests,
            "testsUpdatedToday": tests_updated_today,
            "stages": stages,
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

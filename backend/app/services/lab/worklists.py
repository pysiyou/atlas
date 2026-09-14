"""
Server-side lab worklists and command-center aggregates.

Replaces client-side filtering of full order/sample lists for lab queues.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional

from sqlalchemy.orm import Session

from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.sample import Sample
from app.models.test import Test
from app.schemas.enums import PaymentStatus, PriorityLevel, SampleStatus, TestStatus

QUEUE_AGE_WARNING_HOURS = 4
QUEUE_AGE_CRITICAL_HOURS = 8

PRIORITY_ORDER = {
    PriorityLevel.URGENT: 0,
    PriorityLevel.HIGH: 1,
    PriorityLevel.MEDIUM: 2,
    PriorityLevel.LOW: 3,
}


def _hours_since(ts: Optional[datetime]) -> float:
    if not ts:
        return 0.0
    now = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return max(0.0, (now - ts).total_seconds() / 3600.0)


def _tat_status(hours: float, turnaround_hours: int) -> Literal["fresh", "warning", "critical"]:
    warning = min(turnaround_hours * 0.5, QUEUE_AGE_WARNING_HOURS) if turnaround_hours else QUEUE_AGE_WARNING_HOURS
    critical = min(turnaround_hours, QUEUE_AGE_CRITICAL_HOURS) if turnaround_hours else QUEUE_AGE_CRITICAL_HOURS
    if hours >= critical:
        return "critical"
    if hours >= warning:
        return "warning"
    return "fresh"


def _paginate(total: int, page: int, page_size: int) -> dict[str, Any]:
    total_pages = max(1, (total + page_size - 1) // page_size)
    page = max(1, min(page, total_pages))
    return {
        "page": page,
        "pageSize": page_size,
        "total": total,
        "totalPages": total_pages,
        "hasNext": page < total_pages,
        "hasPrev": page > 1,
    }


class LabWorklistService:
    def __init__(self, db: Session):
        self.db = db
        self._tat_cache: dict[str, int] = {}

    def _get_turnaround(self, test_code: str) -> int:
        if test_code in self._tat_cache:
            return self._tat_cache[test_code]
        row = self.db.query(Test.turnaroundTimeHours).filter(Test.code == test_code).first()
        hours = row[0] if row else 24
        self._tat_cache[test_code] = hours
        return hours

    def _max_tat_for_codes(self, codes: list[str]) -> int:
        if not codes:
            return 24
        return max(self._get_turnaround(c) for c in codes)

    def list_collection(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        priority: Optional[PriorityLevel] = None,
    ) -> dict[str, Any]:
        query = (
            self.db.query(Sample, Order, Patient)
            .join(Order, Sample.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .filter(Sample.status == SampleStatus.PENDING)
        )
        if priority:
            query = query.filter(Sample.priority == priority)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                (Patient.fullName.ilike(term))
                | (Order.orderId.cast(str).ilike(term))
                | (Sample.sampleId.cast(str).ilike(term))
            )
        rows = query.all()
        items = []
        for sample, order, patient in rows:
            since = order.orderDate
            hours = _hours_since(since)
            tat = self._max_tat_for_codes(sample.testCodes or [])
            blocked = (
                "payment_unpaid"
                if order.paymentStatus != PaymentStatus.PAID
                else None
            )
            original_sample_collected_at = None
            if sample.originalSampleId:
                parent = (
                    self.db.query(Sample)
                    .filter(Sample.sampleId == sample.originalSampleId)
                    .first()
                )
                if parent:
                    original_sample_collected_at = parent.collectedAt
            items.append({
                "sampleId": sample.sampleId,
                "orderId": order.orderId,
                "patientId": patient.id,
                "patientName": patient.fullName,
                "sampleType": sample.sampleType.value if sample.sampleType else "",
                "status": sample.status,
                "priority": sample.priority,
                "paymentStatus": order.paymentStatus,
                "orderDate": order.orderDate,
                "testCodes": sample.testCodes or [],
                "isRecollection": bool(sample.isRecollection),
                "originalSampleId": sample.originalSampleId,
                "originalSampleCollectedAt": original_sample_collected_at,
                "recollectionReason": sample.recollectionReason,
                "recollectionAttempt": sample.recollectionAttempt or 1,
                "blockedReason": blocked,
                "waitingHours": round(hours, 2),
                "turnaroundHours": tat,
                "_sort_priority": PRIORITY_ORDER.get(sample.priority, 99),
                "_sort_since": since,
            })
        items.sort(key=lambda x: (x["_sort_priority"], x["_sort_since"]))
        total = len(items)
        start = (page - 1) * page_size
        page_items = items[start : start + page_size]
        for item in page_items:
            item.pop("_sort_priority", None)
            item.pop("_sort_since", None)
        return {"items": page_items, "pagination": _paginate(total, page, page_size)}

    def list_entry(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        priority: Optional[PriorityLevel] = None,
    ) -> dict[str, Any]:
        query = (
            self.db.query(OrderTest, Order, Patient, Test)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(Test, OrderTest.testCode == Test.code)
            .filter(OrderTest.status == TestStatus.SAMPLE_COLLECTED)
        )
        if priority:
            query = query.filter(Order.priority == priority)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                (Patient.fullName.ilike(term))
                | (Order.orderId.cast(str).ilike(term))
                | (Test.name.ilike(term))
                | (OrderTest.testCode.ilike(term))
            )
        rows = query.all()
        items = []
        for ot, order, patient, test in rows:
            sample = (
                self.db.query(Sample).filter(Sample.sampleId == ot.sampleId).first()
                if ot.sampleId
                else None
            )
            since = sample.collectedAt if sample and sample.collectedAt else order.orderDate
            hours = _hours_since(since)
            items.append({
                "orderTestId": ot.id,
                "orderId": order.orderId,
                "patientId": patient.id,
                "patientName": patient.fullName,
                "testCode": ot.testCode,
                "testName": test.name,
                "sampleId": ot.sampleId,
                "sampleType": test.sampleType or "",
                "priority": order.priority,
                "status": ot.status,
                "collectedAt": sample.collectedAt if sample else None,
                "orderDate": order.orderDate,
                "waitingHours": round(hours, 2),
                "turnaroundHours": test.turnaroundTimeHours,
                "isRetest": bool(ot.isRetest),
                "_sort_priority": PRIORITY_ORDER.get(order.priority, 99),
                "_sort_since": since,
            })
        items.sort(key=lambda x: (x["_sort_priority"], x["_sort_since"] or datetime.min.replace(tzinfo=timezone.utc)))
        total = len(items)
        start = (page - 1) * page_size
        page_items = items[start : start + page_size]
        for item in page_items:
            item.pop("_sort_priority", None)
            item.pop("_sort_since", None)
        return {"items": page_items, "pagination": _paginate(total, page, page_size)}

    def list_validation(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        priority: Optional[PriorityLevel] = None,
    ) -> dict[str, Any]:
        query = (
            self.db.query(OrderTest, Order, Patient, Test)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(Test, OrderTest.testCode == Test.code)
            .filter(
                OrderTest.status == TestStatus.RESULTED,
                OrderTest.resultValidatedAt.is_(None),
            )
        )
        if priority:
            query = query.filter(Order.priority == priority)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                (Patient.fullName.ilike(term))
                | (Order.orderId.cast(str).ilike(term))
                | (Test.name.ilike(term))
            )
        rows = query.all()
        items = []
        for ot, order, patient, test in rows:
            since = ot.resultEnteredAt or order.orderDate
            hours = _hours_since(since)
            items.append({
                "orderTestId": ot.id,
                "orderId": order.orderId,
                "patientId": patient.id,
                "patientName": patient.fullName,
                "testCode": ot.testCode,
                "testName": test.name,
                "sampleType": test.sampleType or "",
                "priority": order.priority,
                "status": ot.status,
                "resultEnteredAt": ot.resultEnteredAt,
                "orderDate": order.orderDate,
                "waitingHours": round(hours, 2),
                "turnaroundHours": test.turnaroundTimeHours,
                "hasCriticalValues": bool(ot.hasCriticalValues),
                "_sort_priority": PRIORITY_ORDER.get(order.priority, 99),
                "_sort_since": since,
            })
        items.sort(key=lambda x: (x["_sort_priority"], x["_sort_since"] or datetime.min.replace(tzinfo=timezone.utc)))
        total = len(items)
        start = (page - 1) * page_size
        page_items = items[start : start + page_size]
        for item in page_items:
            item.pop("_sort_priority", None)
            item.pop("_sort_since", None)
        return {"items": page_items, "pagination": _paginate(total, page, page_size)}

    def get_board(self) -> dict[str, Any]:
        collection = self.list_collection(page=1, page_size=10_000)["items"]
        entry = self.list_entry(page=1, page_size=10_000)["items"]
        validation = self.list_validation(page=1, page_size=10_000)["items"]

        escalated = (
            self.db.query(OrderTest)
            .filter(OrderTest.status == TestStatus.ESCALATED)
            .count()
        )
        from app.models.recollection_request import RecollectionRequest
        from app.schemas.enums import RecollectionRequestStatus

        recollection = (
            self.db.query(RecollectionRequest)
            .filter(RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL)
            .count()
        )

        def age_stats(rows: list[dict], since_key: str, tat_key: str = "turnaroundHours") -> dict:
            if not rows:
                return {"oldestHours": None, "averageHours": None, "warningCount": 0, "criticalCount": 0}
            hours_list = [r["waitingHours"] for r in rows]
            warning = critical = 0
            for r in rows:
                status = _tat_status(r["waitingHours"], r.get(tat_key, 24))
                if status == "warning":
                    warning += 1
                elif status == "critical":
                    critical += 1
            return {
                "oldestHours": round(max(hours_list), 2),
                "averageHours": round(sum(hours_list) / len(hours_list), 2),
                "warningCount": warning,
                "criticalCount": critical,
            }

        queue_age = {
            "collection": age_stats(collection, "orderDate"),
            "entry": age_stats(entry, "collectedAt"),
            "validation": age_stats(validation, "resultEnteredAt"),
        }

        payment_unpaid = sum(1 for r in collection if r.get("blockedReason") == "payment_unpaid")
        retest_pending = sum(1 for r in entry if r.get("isRetest"))
        blockers = {
            "paymentUnpaid": payment_unpaid,
            "retestPending": retest_pending,
            "recollectionWaiting": recollection,
            "total": payment_unpaid + retest_pending + recollection,
        }

        critical_total = sum(v["criticalCount"] for v in queue_age.values())
        warning_total = sum(v["warningCount"] for v in queue_age.values())

        if critical_total > 0:
            health, health_message, suggested = "critical", f"{critical_total} items past TAT", "validation"
        elif warning_total > 0 or blockers["total"] > 0 or escalated > 0:
            parts = []
            if warning_total:
                parts.append(f"{warning_total} approaching TAT")
            if escalated:
                parts.append(f"{escalated} supervisor review")
            if payment_unpaid:
                parts.append(f"{payment_unpaid} unpaid hold")
            health, health_message, suggested = "attention", " · ".join(parts), "collection"
        else:
            health, health_message, suggested = "healthy", "Queues within TAT", None

        return {
            "counts": {
                "collection": len(collection),
                "entry": len(entry),
                "validation": len(validation),
                "supervisor": escalated + recollection,
            },
            "queueAge": queue_age,
            "blockers": blockers,
            "health": health,
            "healthMessage": health_message,
            "suggestedTab": suggested,
        }

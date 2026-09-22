"""
Server-side lab worklists and command-center aggregates.

Replaces client-side filtering of full order/sample lists for lab queues.
"""
from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.recollection_request import RecollectionRequest
from app.models.sample import Sample
from app.models.test import Test
from app.schemas.enums import (
    EscalationTicketStatus,
    PaymentStatus,
    PriorityLevel,
    RecollectionRequestStatus,
    SampleStatus,
    TestStatus,
)
from app.models.escalation import EscalationTicket
from app.services.lab.board import BLOCKED_LABELS
from app.services.lab.board import LabBoardService
from app.services.lab.board import blocked_reason_for_work_item
from app.utils.common import parse_display_id_from_search
from sqlalchemy import String, or_
from sqlalchemy.orm import Session

PRIORITY_ORDER = {
    PriorityLevel.URGENT: 0,
    PriorityLevel.HIGH: 1,
    PriorityLevel.MEDIUM: 2,
    PriorityLevel.LOW: 3,
}

IN_PIPELINE_TEST_STATUSES = (
    TestStatus.PENDING,
    TestStatus.SAMPLE_COLLECTED,
    TestStatus.RESULTED,
    TestStatus.ESCALATED,
)

COLLECTION_SAMPLE_LOOKUP_MIN_LEN = 3


def _collection_search_filter(search_term: str):
    term = search_term.strip()
    predicates = [Patient.fullName.ilike(f"%{term}%")]
    sample_id = parse_display_id_from_search(term, "SAM")
    if sample_id is not None:
        predicates.append(Sample.sampleId == sample_id)
    compact = re.sub(r"[\s-]", "", term)
    if compact.isdigit():
        predicates.append(Sample.sampleId.cast(String).ilike(f"%{compact}%"))
    return or_(*predicates)


def _hours_since(ts: datetime | None) -> float:
    if not ts:
        return 0.0
    now = datetime.now(UTC)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=UTC)
    return max(0.0, (now - ts).total_seconds() / 3600.0)


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
        self._catalog_cache: dict[str, tuple[str | None, str | None]] = {}

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

    def _catalog_meta(self, code: str | None) -> tuple[str | None, str | None]:
        if not code:
            return None, None
        if code in self._catalog_cache:
            return self._catalog_cache[code]
        row = self.db.query(Test.name, Test.category).filter(Test.code == code).first()
        meta = (row[0], row[1]) if row else (None, None)
        self._catalog_cache[code] = meta
        return meta

    def _collection_test_display(self, codes: list[str]) -> tuple[str, str | None]:
        names: list[str] = []
        category: str | None = None
        for code in codes:
            name, cat = self._catalog_meta(code)
            if name:
                names.append(name)
            elif code:
                names.append(code)
            if category is None:
                category = cat
        if names:
            return ", ".join(names), category
        return "Sample collection", category

    def list_collection(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        priority: PriorityLevel | None = None,
    ) -> dict[str, Any]:
        search_term = search.strip() if search else ""
        if len(search_term) < COLLECTION_SAMPLE_LOOKUP_MIN_LEN:
            search_term = ""
        query = (
            self.db.query(Sample, Order, Patient)
            .join(Order, Sample.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
        )
        if search_term:
            query = query.filter(_collection_search_filter(search_term))
        else:
            query = query.filter(Sample.status == SampleStatus.PENDING)
        if priority:
            query = query.filter(Sample.priority == priority)
        rows = query.all()
        items = []
        for sample, order, patient in rows:
            since = order.orderDate
            hours = _hours_since(since)
            codes = sample.testCodes or []
            tat = self._max_tat_for_codes(codes)
            test_name, test_category = self._collection_test_display(codes)
            blocked = "payment_unpaid" if order.paymentStatus != PaymentStatus.PAID else None
            original_sample_collected_at = None
            if sample.originalSampleId:
                parent = (
                    self.db.query(Sample).filter(Sample.sampleId == sample.originalSampleId).first()
                )
                if parent:
                    original_sample_collected_at = parent.collectedAt
            items.append(
                {
                    "sampleId": sample.sampleId,
                    "orderId": order.orderId,
                    "patientId": patient.id,
                    "patientName": patient.fullName,
                    "sampleType": sample.sampleType.value if sample.sampleType else "",
                    "status": sample.status,
                    "priority": sample.priority,
                    "paymentStatus": order.paymentStatus,
                    "orderDate": order.orderDate,
                    "testCodes": codes,
                    "referringPhysician": order.referringPhysician,
                    "testName": test_name,
                    "testCategory": test_category,
                    "isRecollection": bool(sample.isRecollection),
                    "originalSampleId": sample.originalSampleId,
                    "originalSampleCollectedAt": original_sample_collected_at,
                    "recollectionReason": sample.recollectionReason,
                    "recollectionAttempt": sample.recollectionAttempt or 1,
                    "blockedReason": blocked,
                    "waitingHours": round(hours, 2),
                    "turnaroundHours": tat,
                    "actualContainerType": sample.actualContainerType,
                    "actualContainerColor": sample.actualContainerColor,
                    "collectedAt": sample.collectedAt,
                    "collectedBy": sample.collectedBy,
                    "collectedVolume": sample.collectedVolume,
                    "_sort_priority": PRIORITY_ORDER.get(sample.priority, 99),
                    "_sort_since": since,
                    "_sort_recency": sample.updatedAt or sample.collectedAt or since,
                }
            )
        if search_term:
            items.sort(
                key=lambda x: x["_sort_recency"],
                reverse=True,
            )
        else:
            items.sort(key=lambda x: (x["_sort_priority"], x["_sort_since"]))
        total = len(items)
        start = (page - 1) * page_size
        page_items = items[start : start + page_size]
        for item in page_items:
            item.pop("_sort_priority", None)
            item.pop("_sort_since", None)
            item.pop("_sort_recency", None)
        return {"items": page_items, "pagination": _paginate(total, page, page_size)}

    def _order_test_in_active_worklist(self, order_test: OrderTest, sample: Sample | None) -> bool:
        """True when the test already appears on collection, entry, or validation worklists."""
        if order_test.status == TestStatus.SAMPLE_COLLECTED:
            return True
        if order_test.status == TestStatus.RESULTED and order_test.resultValidatedAt is None:
            return True
        return (
            order_test.status == TestStatus.PENDING
            and sample is not None
            and sample.status == SampleStatus.PENDING
        )

    def _pipeline_stage_for_test(self, order_test: OrderTest) -> str:
        if order_test.status == TestStatus.PENDING:
            return "collection"
        if order_test.status == TestStatus.SAMPLE_COLLECTED:
            return "entry"
        return "validation"

    def list_dashboard_blocked(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        """Tests blocked on pending recollection approval (not surfaced by stage worklists)."""
        requests = (
            self.db.query(RecollectionRequest)
            .filter(RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL)
            .order_by(RecollectionRequest.createdAt.asc())
            .all()
        )
        if not requests:
            return {"items": [], "pagination": _paginate(0, page, page_size)}

        request_by_test_id: dict[int, RecollectionRequest] = {}
        for request in requests:
            for test_id in request.affectedOrderTestIds or []:
                if isinstance(test_id, int):
                    request_by_test_id.setdefault(test_id, request)
            if request.orderTestId is not None:
                request_by_test_id.setdefault(request.orderTestId, request)

        test_ids = list(request_by_test_id.keys())
        if not test_ids:
            return {"items": [], "pagination": _paginate(0, page, page_size)}

        rows = (
            self.db.query(OrderTest, Order, Patient, Test, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(Test, OrderTest.testCode == Test.code)
            .outerjoin(Sample, Sample.sampleId == OrderTest.sampleId)
            .filter(OrderTest.id.in_(test_ids))
            .all()
        )

        blocked_label = BLOCKED_LABELS["recollection_approval"]
        items: list[dict[str, Any]] = []
        for order_test, order, patient, test, sample in rows:
            if self._order_test_in_active_worklist(order_test, sample):
                continue
            request = request_by_test_id.get(order_test.id)
            if not request:
                continue
            since = request.createdAt or order.orderDate
            hours = _hours_since(since)
            items.append(
                {
                    "orderTestId": order_test.id,
                    "orderId": order.orderId,
                    "patientId": patient.id,
                    "patientName": patient.fullName,
                    "testCode": order_test.testCode,
                    "testName": test.name,
                    "priority": order.priority,
                    "status": order_test.status,
                    "stage": self._pipeline_stage_for_test(order_test),
                    "orderDate": order.orderDate,
                    "blockedReason": "recollection_approval",
                    "blockedLabel": blocked_label,
                    "waitingHours": round(hours, 2),
                    "referringPhysician": order.referringPhysician,
                    "testCategory": test.category,
                    "sampleType": order_test.sampleType or "",
                    "recollectionRequestId": request.id,
                    "_sort_priority": PRIORITY_ORDER.get(order.priority, 99),
                    "_sort_since": since,
                }
            )

        items.sort(
            key=lambda x: (
                x["_sort_priority"],
                x["_sort_since"] or datetime.min.replace(tzinfo=UTC),
            )
        )
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
        search: str | None = None,
        priority: PriorityLevel | None = None,
    ) -> dict[str, Any]:
        query = (
            self.db.query(OrderTest, Order, Patient, Test, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(Test, OrderTest.testCode == Test.code)
            .outerjoin(Sample, Sample.sampleId == OrderTest.sampleId)
            .filter(OrderTest.status == TestStatus.SAMPLE_COLLECTED)
        )
        if priority:
            query = query.filter(Order.priority == priority)
        search_term = search.strip() if search else ""
        if search_term:
            term = f"%{search_term}%"
            query = query.filter(
                or_(
                    Patient.fullName.ilike(term),
                    Order.orderId.cast(String).ilike(term),
                    Test.name.ilike(term),
                    OrderTest.testCode.ilike(term),
                    Sample.sampleId.cast(String).ilike(term),
                )
            )
        rows = query.all()
        items = []
        for ot, order, patient, test, sample in rows:
            since = sample.collectedAt if sample and sample.collectedAt else order.orderDate
            hours = _hours_since(since)
            items.append(
                {
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
                    "referringPhysician": order.referringPhysician,
                    "testCategory": test.category,
                    "_sort_priority": PRIORITY_ORDER.get(order.priority, 99),
                    "_sort_since": since,
                }
            )
        items.sort(
            key=lambda x: (
                x["_sort_priority"],
                x["_sort_since"] or datetime.min.replace(tzinfo=UTC),
            )
        )
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
        search: str | None = None,
        priority: PriorityLevel | None = None,
    ) -> dict[str, Any]:
        query = (
            self.db.query(OrderTest, Order, Patient, Test, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(Test, OrderTest.testCode == Test.code)
            .outerjoin(Sample, OrderTest.sampleId == Sample.sampleId)
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
        for ot, order, patient, test, sample in rows:
            since = ot.resultEnteredAt or order.orderDate
            hours = _hours_since(since)
            items.append(
                {
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
                    "testCategory": test.category,
                    "sampleId": ot.sampleId,
                    "sampleStatus": sample.status if sample else None,
                    "results": ot.results,
                    "flags": ot.flags,
                    "enteredBy": ot.enteredBy,
                    "referringPhysician": order.referringPhysician,
                    "isRetest": bool(ot.isRetest),
                    "retestOfTestId": ot.retestOfTestId,
                    "retestNumber": ot.retestNumber or 0,
                    "_sort_priority": PRIORITY_ORDER.get(order.priority, 99),
                    "_sort_since": since,
                }
            )
        items.sort(
            key=lambda x: (
                x["_sort_priority"],
                x["_sort_since"] or datetime.min.replace(tzinfo=UTC),
            )
        )
        total = len(items)
        start = (page - 1) * page_size
        page_items = items[start : start + page_size]
        for item in page_items:
            item.pop("_sort_priority", None)
            item.pop("_sort_since", None)
        return {"items": page_items, "pagination": _paginate(total, page, page_size)}

    def _utc_today_start(self) -> datetime:
        today = datetime.now(UTC).date()
        return datetime.combine(today, datetime.min.time()).replace(tzinfo=UTC)

    def _dashboard_stage(self, order_test: OrderTest) -> str:
        if order_test.status in (TestStatus.VALIDATED, TestStatus.ESCALATED):
            return "validation"
        return self._pipeline_stage_for_test(order_test)

    def _normalize_ts(self, ts: datetime | None) -> datetime | None:
        if ts is None:
            return None
        if ts.tzinfo is None:
            return ts.replace(tzinfo=UTC)
        return ts

    def _activity_at_for_dashboard(
        self,
        *,
        order_test: OrderTest,
        sample: Sample | None,
    ) -> datetime:
        """Display/sort timestamp — prefer row update, then latest workflow milestone."""
        candidates = [order_test.updatedAt]
        if sample:
            candidates.append(sample.updatedAt)
            candidates.append(sample.collectedAt)
        candidates.extend(
            [order_test.resultEnteredAt, order_test.resultValidatedAt, order_test.createdAt]
        )
        normalized = [self._normalize_ts(ts) for ts in candidates if ts is not None]
        return max(normalized) if normalized else datetime.now(UTC)

    def _blocked_label_for_dashboard(
        self,
        *,
        order_test: OrderTest,
        order: Order,
        sample: Sample | None,
        recollection_blocked: set[int],
        escalation_code: str | None,
    ) -> str | None:
        status = (
            order_test.status.value
            if hasattr(order_test.status, "value")
            else str(order_test.status)
        )
        blocked = blocked_reason_for_work_item(
            status=status,
            is_retest=bool(order_test.isRetest),
            payment_status=(
                order.paymentStatus.value
                if hasattr(order.paymentStatus, "value")
                else str(order.paymentStatus)
            ),
            sample_status=(
                sample.status.value if sample and hasattr(sample.status, "value") else None
            ),
            sample_is_recollection=bool(sample.isRecollection) if sample else False,
            escalation_reason_code=escalation_code,
        )
        if order_test.id in recollection_blocked:
            blocked = blocked or "recollection_approval"
        if not blocked:
            return None
        return BLOCKED_LABELS.get(blocked, blocked.replace("_", " ").title())

    def list_dashboard_work_today(
        self,
        *,
        user_id: int,
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        """Today's dashboard rows: in-pipeline work plus anything updated today (incl. completed)."""
        _ = user_id  # reserved for future per-user scoping
        today_start = self._utc_today_start()
        board = LabBoardService(self.db)
        recollection_blocked = board._recollection_blocked_order_test_ids()

        active_filter = ~OrderTest.status.in_(
            (TestStatus.CANCELLED, TestStatus.REMOVED, TestStatus.SUPERSEDED)
        )
        visible_today = or_(
            OrderTest.updatedAt >= today_start,
            OrderTest.status.in_(IN_PIPELINE_TEST_STATUSES),
        )

        rows = (
            self.db.query(OrderTest, Order, Patient, Test, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(Test, OrderTest.testCode == Test.code)
            .outerjoin(Sample, Sample.sampleId == OrderTest.sampleId)
            .filter(active_filter)
            .filter(visible_today)
            .all()
        )

        escalated_ids = [
            ot.id for ot, _order, _patient, _test, _sample in rows if ot.status == TestStatus.ESCALATED
        ]
        tickets_by_test: dict[int, EscalationTicket] = {}
        if escalated_ids:
            for ticket in (
                self.db.query(EscalationTicket)
                .filter(
                    EscalationTicket.orderTestId.in_(escalated_ids),
                    EscalationTicket.status == EscalationTicketStatus.OPEN,
                )
                .all()
            ):
                tickets_by_test[ticket.orderTestId] = ticket

        items: list[dict[str, Any]] = []
        for order_test, order, patient, test, sample in rows:
            activity_at = self._activity_at_for_dashboard(
                order_test=order_test,
                sample=sample,
            )
            ticket = tickets_by_test.get(order_test.id)
            escalation_code = (
                ticket.reasonCode.value if ticket and ticket.reasonCode else None
            )
            blocked_label = self._blocked_label_for_dashboard(
                order_test=order_test,
                order=order,
                sample=sample,
                recollection_blocked=recollection_blocked,
                escalation_code=escalation_code,
            )
            items.append(
                {
                    "orderTestId": order_test.id,
                    "orderId": order.orderId,
                    "patientId": patient.id,
                    "patientName": patient.fullName,
                    "testCode": order_test.testCode,
                    "testName": test.name,
                    "sampleType": test.sampleType or "",
                    "priority": order.priority,
                    "status": order_test.status,
                    "stage": self._dashboard_stage(order_test),
                    "activityAt": activity_at,
                    "orderDate": order.orderDate,
                    "referringPhysician": order.referringPhysician,
                    "testCategory": test.category,
                    "blockedLabel": blocked_label,
                    "_sort_activity": activity_at,
                }
            )

        items.sort(key=lambda row: row["_sort_activity"], reverse=True)
        total = len(items)
        start = (page - 1) * page_size
        page_items = items[start : start + page_size]
        for item in page_items:
            item.pop("_sort_activity", None)
        return {"items": page_items, "pagination": _paginate(total, page, page_size)}

    def get_board(self, include_supervisor: bool = True) -> dict[str, Any]:
        return LabBoardService(self.db).compute_board_snapshot(
            include_supervisor=include_supervisor
        )

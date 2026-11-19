from __future__ import annotations

# --- from monitor/predicates.py ---

"""Shared SQLAlchemy predicates for lab monitor and worklists."""

from datetime import datetime

from app.domains.lab.rules.service import (
    INACTIVE_LINEAGE_STATUSES,
)
from app.domains.orders.models import OrderTest
from app.shared.enums import TestStatus
from sqlalchemy import or_

TERMINAL_PIPELINE_TEST_STATUSES: tuple[TestStatus, ...] = (
    TestStatus.CANCELLED,
    TestStatus.REMOVED,
    TestStatus.SUPERSEDED,
    TestStatus.VALIDATED,
)


def running_tests_predicate():
    """Order tests still in the lab pipeline (non-terminal lifecycle)."""
    return ~OrderTest.status.in_(TERMINAL_PIPELINE_TEST_STATUSES)


def monitor_universe_predicate(today_start: datetime):
    """Union of tests updated today (UTC) and tests still running in the pipeline."""
    worked_today = OrderTest.updatedAt >= today_start
    return or_(worked_today, running_tests_predicate())


def inactive_lineage_filter():
    """Exclude superseded/removed lineage from operational lists."""
    return OrderTest.status.notin_(INACTIVE_LINEAGE_STATUSES)


# --- from monitor/queries.py ---

"""Shared SQL join skeletons for lab board snapshots and worklists."""

from app.domains.catalog.models import OrderableTest
from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from sqlalchemy.orm import Session


def collection_base_query(db: Session):
    """Sample + order + patient join used by collection board rows and worklists."""
    return (
        db.query(Sample, Order, Patient)
        .join(Order, Sample.orderId == Order.orderId)
        .join(Patient, Order.patientId == Patient.id)
    )


def order_test_stage_query(db: Session, *, include_sample: bool = True):
    """OrderTest + order + patient + catalog [+ sample] join used by stage lists.

    Entity order is part of the public contract for row unpacking:
    ``(OrderTest, Order, Patient, OrderableTest[, Sample])``.
    """
    if include_sample:
        return (
            db.query(OrderTest, Order, Patient, OrderableTest, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(OrderableTest, OrderTest.testCode == OrderableTest.code)
            .outerjoin(Sample, Sample.sampleId == OrderTest.sampleId)
        )
    return (
        db.query(OrderTest, Order, Patient, OrderableTest)
        .join(Order, OrderTest.orderId == Order.orderId)
        .join(Patient, Order.patientId == Patient.id)
        .join(OrderableTest, OrderTest.testCode == OrderableTest.code)
    )


# --- from monitor/tat.py ---

"""TAT metrics and board assembly helpers (pure functions)."""

from collections.abc import Iterable
from datetime import UTC, datetime
from typing import Any, Literal

from app.domains.catalog.models import OrderableTest
from app.domains.lab.rules.service import (
    ATTENTION_TYPE_SORT,
    PRIORITY_ATTENTION_TYPES,
    PRIORITY_WEIGHT,
    SUPERVISOR_ATTENTION_TYPES,
    attention_type_for,
    should_surface_attention,
)
from app.domains.lab.rules.service import (
    attention_label_for_reason,
    attention_reason_for_monitor_row,
)
from app.shared.enums import PriorityLevel
from app.shared.lab_contract import QUEUE_AGE_CRITICAL_HOURS, QUEUE_AGE_WARNING_HOURS
from sqlalchemy.orm import Session

TatBucket = Literal["fresh", "onTrack", "warning", "critical"]
TatStatus = Literal["fresh", "warning", "critical"]
QueueStage = Literal["collection", "entry", "validation"]

STAGE_LABELS: dict[QueueStage, str] = {
    "collection": "Collection",
    "entry": "Entry",
    "validation": "Validation",
}

ATTENTION_LIMIT = 50


def hours_since(ts: datetime | None, now: datetime | None = None) -> float:
    """Elapsed hours from *ts* to *now* (UTC). Missing timestamps yield 0."""
    if not ts:
        return 0.0
    current = now or datetime.now(UTC)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=UTC)
    if current.tzinfo is None:
        current = current.replace(tzinfo=UTC)
    return max(0.0, (current - ts).total_seconds() / 3600.0)


def tat_status(hours: float, turnaround_hours: int | None) -> TatStatus:
    """Classify wait against per-test TAT, capped at the global 4h / 8h ceilings."""
    warning = QUEUE_AGE_WARNING_HOURS
    critical = QUEUE_AGE_CRITICAL_HOURS
    if turnaround_hours and turnaround_hours > 0:
        warning = min(turnaround_hours * 0.5, QUEUE_AGE_WARNING_HOURS)
        critical = min(turnaround_hours, QUEUE_AGE_CRITICAL_HOURS)
    if hours >= critical:
        return "critical"
    if hours >= warning:
        return "warning"
    return "fresh"


def age_bucket(hours: float, turnaround_hours: int | None) -> TatBucket:
    """Four-bucket wait mix used by the Today panel (TAT-aware)."""
    status = tat_status(hours, turnaround_hours)
    if status == "critical":
        return "critical"
    if status == "warning":
        return "warning"
    if hours < 1:
        return "fresh"
    return "onTrack"


def _iso(ts: datetime | None) -> str:
    if ts is None:
        return datetime.now(UTC).isoformat()
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=UTC)
    return ts.isoformat()


def _priority_value(priority: Any) -> str:
    if isinstance(priority, PriorityLevel):
        return priority.value
    return str(priority or PriorityLevel.MEDIUM.value)


def _empty_queue_age() -> dict[str, Any]:
    return {
        "oldestHours": None,
        "sumHours": 0.0,
        "itemCount": 0,
        "warningCount": 0,
        "criticalCount": 0,
    }


def _finalize_queue_age(acc: dict[str, Any]) -> dict[str, Any]:
    count = acc["itemCount"]
    return {
        "oldestHours": round(acc["oldestHours"], 2) if acc["oldestHours"] is not None else None,
        "averageHours": round(acc["sumHours"] / count, 2) if count else None,
        "warningCount": acc["warningCount"],
        "criticalCount": acc["criticalCount"],
    }


def _accumulate_age(acc: dict[str, Any], hours: float, status: TatStatus) -> None:
    acc["itemCount"] += 1
    acc["sumHours"] += hours
    if acc["oldestHours"] is None or hours > acc["oldestHours"]:
        acc["oldestHours"] = hours
    if status == "warning":
        acc["warningCount"] += 1
    elif status == "critical":
        acc["criticalCount"] += 1


def _attention_candidate(
    *,
    stage: QueueStage,
    order_id: str,
    patient_name: str,
    priority: str,
    waiting_hours: float,
    attention_reason: str | None,
    since: datetime | None,
    order_test_ids: list[int],
    attention_type: str,
    work_item_count: int = 1,
    patient_id: str | None = None,
    sample_id: str | None = None,
    test_codes: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "id": f"{attention_type}-{order_id}-{stage}",
        "stage": stage,
        "stageLabel": STAGE_LABELS[stage],
        "orderId": order_id,
        "patientId": patient_id,
        "patientName": patient_name or "Unknown patient",
        "sampleId": sample_id,
        "testCodes": list(test_codes or []),
        "priority": priority,
        "waitingHours": round(waiting_hours, 2),
        "attentionReason": attention_reason,
        "attentionLabel": attention_label_for_reason(attention_reason),
        "queueTab": stage,
        "since": _iso(since),
        "workItemCount": work_item_count,
        "orderTestIds": order_test_ids,
        "attentionType": attention_type,
    }


def finalize_attention_items(
    candidates: list[dict[str, Any]], limit: int = ATTENTION_LIMIT
) -> tuple[list[dict[str, Any]], int]:
    """Consolidate per (type, order, tab), sort, and cap the feed."""
    merged: dict[str, dict[str, Any]] = {}
    for item in candidates:
        attention_type = item["attentionType"]
        key = f"{attention_type}-{item['orderId']}-{item['queueTab']}"
        existing = merged.get(key)
        if existing is None:
            merged[key] = {**item, "id": key, "workItemCount": item.get("workItemCount") or 1}
            continue
        item_hours = item["waitingHours"]
        existing_hours = existing["waitingHours"]
        existing_priority = existing["priority"]
        item_priority = item["priority"]
        existing["waitingHours"] = max(existing_hours, item_hours)
        if PRIORITY_WEIGHT.get(item_priority, 0) > PRIORITY_WEIGHT.get(existing_priority, 0):
            existing["priority"] = item_priority
        if item_hours > existing_hours:
            existing["since"] = item["since"]
        existing["workItemCount"] += item.get("workItemCount") or 1
        existing["orderTestIds"] = list(
            dict.fromkeys([*existing["orderTestIds"], *item["orderTestIds"]])
        )
        existing["patientId"] = existing.get("patientId") or item.get("patientId")
        existing["sampleId"] = existing.get("sampleId") or item.get("sampleId")
        existing["testCodes"] = list(
            dict.fromkeys([*(existing.get("testCodes") or []), *(item.get("testCodes") or [])])
        )

    def sort_score(item: dict[str, Any]) -> float:
        type_score = 1000 - ATTENTION_TYPE_SORT.get(item["attentionType"], 100)
        age_score = item["waitingHours"] * 10
        priority_score = PRIORITY_WEIGHT.get(item["priority"], 0) * 100
        return type_score + age_score + priority_score

    items = sorted(merged.values(), key=sort_score, reverse=True)
    total = sum(item["workItemCount"] for item in items)
    return items[:limit], total


def derive_health(
    queue_age: dict[str, dict[str, Any]],
    blockers: dict[str, int],
    attention_items: list[dict[str, Any]],
) -> dict[str, Any]:
    """Health banner copy and suggested tab."""
    critical_count = (
        queue_age["collection"]["criticalCount"]
        + queue_age["entry"]["criticalCount"]
        + queue_age["validation"]["criticalCount"]
    )
    warning_count = (
        queue_age["collection"]["warningCount"]
        + queue_age["entry"]["warningCount"]
        + queue_age["validation"]["warningCount"]
    )

    if critical_count > 0:
        stage = next(
            (
                key
                for key in ("collection", "entry", "validation")
                if queue_age[key]["criticalCount"] > 0
            ),
            "validation",
        )
        suffix = "" if critical_count == 1 else "s"
        return {
            "health": "critical",
            "healthMessage": f"{critical_count} accession{suffix} >{QUEUE_AGE_CRITICAL_HOURS}h TAT",
            "suggestedTab": stage,
        }

    supervisor_count = sum(
        1 for item in attention_items if item.get("attentionType") in SUPERVISOR_ATTENTION_TYPES
    )
    priority_count = sum(
        1 for item in attention_items if item.get("attentionType") in PRIORITY_ATTENTION_TYPES
    )

    if warning_count > 0 or blockers["total"] > 0 or supervisor_count > 0 or priority_count > 0:
        parts: list[str] = []
        if warning_count > 0:
            parts.append(f"{warning_count} >{QUEUE_AGE_WARNING_HOURS}h TAT")
        if supervisor_count > 0:
            parts.append(f"{supervisor_count} path review")
        if priority_count > 0:
            parts.append(f"{priority_count} STAT/high")
        if blockers["paymentUnpaid"] > 0:
            parts.append(f"{blockers['paymentUnpaid']} unpaid hold")
        if blockers["retestPending"] > 0:
            parts.append(f"{blockers['retestPending']} repeat pending")
        if blockers["recollectionWaiting"] > 0:
            parts.append(f"{blockers['recollectionWaiting']} redraw pending")
        top = attention_items[0] if attention_items else None
        return {
            "health": "attention",
            "healthMessage": " · ".join(parts),
            "suggestedTab": top["queueTab"] if top else None,
        }

    return {
        "health": "healthy",
        "healthMessage": "Queues within TAT",
        "suggestedTab": None,
    }


def assemble_board(
    collection_rows: list[dict[str, Any]],
    entry_rows: list[dict[str, Any]],
    validation_rows: list[dict[str, Any]],
    escalation_rows: list[dict[str, Any]],
    now: datetime | None = None,
) -> dict[str, Any]:
    """Build the full board payload from lightweight stage rows (no 10k worklist materialization)."""
    current = now or datetime.now(UTC)
    queue_age = {
        "collection": _empty_queue_age(),
        "entry": _empty_queue_age(),
        "validation": _empty_queue_age(),
    }
    age_buckets = {"fresh": 0, "onTrack": 0, "warning": 0, "critical": 0}
    priority_mix = {"urgent": 0, "high": 0, "medium": 0, "low": 0}
    blockers = {
        "paymentUnpaid": 0,
        "retestPending": 0,
        "recollectionWaiting": 0,
        "total": 0,
    }
    candidates: list[dict[str, Any]] = []

    def bump_priority(priority: str) -> None:
        if priority == PriorityLevel.URGENT.value:
            priority_mix["urgent"] += 1
        elif priority == PriorityLevel.HIGH.value:
            priority_mix["high"] += 1
        elif priority == PriorityLevel.LOW.value:
            priority_mix["low"] += 1
        else:
            priority_mix["medium"] += 1

    def track_wait(
        stage: QueueStage, since: datetime | None, tat: int | None, priority: str
    ) -> tuple[float, TatStatus, TatBucket]:
        hours = hours_since(since, current)
        status = tat_status(hours, tat)
        bucket = age_bucket(hours, tat)
        _accumulate_age(queue_age[stage], hours, status)
        age_buckets[bucket] += 1
        bump_priority(priority)
        return hours, status, bucket

    for row in collection_rows:
        since = row.get("order_date")
        priority = _priority_value(row.get("priority"))
        tat = row.get("turnaround_hours") or 24
        hours, status, _ = track_wait("collection", since, tat, priority)
        attention = attention_reason_for_monitor_row(
            "collection",
            payment_status=_enum_value(row.get("payment_status")),
            sample_status=_enum_value(row.get("sample_status")),
        )
        if attention == "payment_unpaid":
            blockers["paymentUnpaid"] += 1
        if should_surface_attention(attention, status):
            candidates.append(
                _attention_candidate(
                    stage="collection",
                    order_id=row["order_id"],
                    patient_name=row.get("patient_name") or "Unknown patient",
                    priority=priority,
                    waiting_hours=hours,
                    attention_reason=attention,
                    since=since,
                    order_test_ids=[],
                    attention_type=attention_type_for(attention, status, priority),
                    patient_id=row.get("patient_id"),
                    sample_id=row.get("sample_id"),
                    test_codes=row.get("test_codes") or [],
                )
            )

    for row in entry_rows:
        since = row.get("collected_at") or row.get("order_date")
        priority = _priority_value(row.get("priority"))
        tat = row.get("turnaround_hours") or 24
        hours, status, _ = track_wait("entry", since, tat, priority)
        attention = attention_reason_for_monitor_row(
            "entry",
            sample_status=_enum_value(row.get("sample_status")),
            escalation_reason_code=row.get("reason_code"),
        )
        order_test_id = row.get("order_test_id")
        if should_surface_attention(attention, status):
            candidates.append(
                _attention_candidate(
                    stage="entry",
                    order_id=row["order_id"],
                    patient_name=row.get("patient_name") or "Unknown patient",
                    priority=priority,
                    waiting_hours=hours,
                    attention_reason=attention,
                    since=since,
                    order_test_ids=[order_test_id] if order_test_id is not None else [],
                    attention_type=attention_type_for(attention, status, priority),
                    patient_id=row.get("patient_id"),
                    sample_id=row.get("sample_id"),
                    test_codes=row.get("test_codes") or [],
                )
            )

    for row in validation_rows:
        since = row.get("result_entered_at") or row.get("collected_at") or row.get("order_date")
        priority = _priority_value(row.get("priority"))
        tat = row.get("turnaround_hours") or 24
        hours, status, _ = track_wait("validation", since, tat, priority)
        attention = attention_reason_for_monitor_row(
            "validation",
            sample_status=_enum_value(row.get("sample_status")),
            escalation_reason_code=row.get("reason_code"),
        )
        order_test_id = row.get("order_test_id")
        if should_surface_attention(attention, status):
            candidates.append(
                _attention_candidate(
                    stage="validation",
                    order_id=row["order_id"],
                    patient_name=row.get("patient_name") or "Unknown patient",
                    priority=priority,
                    waiting_hours=hours,
                    attention_reason=attention,
                    since=since,
                    order_test_ids=[order_test_id] if order_test_id is not None else [],
                    attention_type=attention_type_for(attention, status, priority),
                    patient_id=row.get("patient_id"),
                    sample_id=row.get("sample_id"),
                    test_codes=row.get("test_codes") or [],
                )
            )

    for row in escalation_rows:
        since = row.get("result_entered_at") or row.get("order_date")
        hours = hours_since(since, current)
        status = tat_status(hours, row.get("turnaround_hours") or 24)
        priority = _priority_value(row.get("priority"))
        attention = attention_reason_for_monitor_row(
            "escalation",
            sample_status=_enum_value(row.get("sample_status")),
            escalation_reason_code=row.get("reason_code"),
        )
        if attention == "retry_limit":
            blockers["retestPending"] += 1
        order_test_id = row.get("order_test_id")
        candidates.append(
            _attention_candidate(
                stage="validation",
                order_id=row["order_id"],
                patient_name=row.get("patient_name") or "Unknown patient",
                priority=priority,
                waiting_hours=hours,
                attention_reason=attention,
                since=since,
                order_test_ids=[order_test_id] if order_test_id is not None else [],
                attention_type=attention_type_for(attention, status, priority),
                patient_id=row.get("patient_id"),
                sample_id=row.get("sample_id"),
                test_codes=row.get("test_codes") or [],
            )
        )

    blockers["total"] = (
        blockers["paymentUnpaid"] + blockers["retestPending"] + blockers["recollectionWaiting"]
    )
    attention_items, attention_total = finalize_attention_items(candidates)
    finalized_age = {
        "collection": _finalize_queue_age(queue_age["collection"]),
        "entry": _finalize_queue_age(queue_age["entry"]),
        "validation": _finalize_queue_age(queue_age["validation"]),
    }
    health = derive_health(finalized_age, blockers, attention_items)
    counts = {
        "collection": len(collection_rows),
        "entry": len(entry_rows),
        "validation": len(validation_rows),
        "supervisor": len(escalation_rows),
    }
    total_active = counts["collection"] + counts["entry"] + counts["validation"]

    return {
        "counts": counts,
        "queueAge": finalized_age,
        "blockers": blockers,
        "ageBuckets": age_buckets,
        "priorityMix": priority_mix,
        "attentionItems": attention_items,
        "attentionTotal": attention_total,
        "totalActive": total_active,
        "computedAt": current.isoformat(),
        **health,
    }


def _enum_value(value: Any) -> str | None:
    if value is None:
        return None
    return value.value if hasattr(value, "value") else str(value)


class CatalogTatResolver:
    """Resolve catalog TAT hours with optional batch warm-up."""

    DEFAULT_HOURS = 24

    def __init__(self, db: Session):
        self.db = db
        self._cache: dict[str, int] = {}

    def warmup(self, test_codes: Iterable[str]) -> None:
        missing = [code for code in set(test_codes) if code not in self._cache]
        if not missing:
            return
        rows = (
            self.db.query(OrderableTest.code, OrderableTest.turnaroundTimeHours)
            .filter(OrderableTest.code.in_(missing))
            .all()
        )
        found = {code: hours for code, hours in rows}
        for code in missing:
            self._cache[code] = found.get(code) or self.DEFAULT_HOURS

    def hours_for_code(self, test_code: str) -> int:
        if test_code in self._cache:
            return self._cache[test_code]
        row = (
            self.db.query(OrderableTest.turnaroundTimeHours)
            .filter(OrderableTest.code == test_code)
            .first()
        )
        hours = row[0] if row else self.DEFAULT_HOURS
        self._cache[test_code] = hours
        return hours

    def max_hours_for_codes(self, codes: list[str] | None) -> int:
        if not codes:
            return self.DEFAULT_HOURS
        return max(self.hours_for_code(code) for code in codes)


# --- from monitor/board_service.py ---

"""SQL-backed lab board snapshot service."""

from datetime import UTC, datetime
from typing import Any

from app.domains.lab.specimen.models import Sample
from app.domains.lab.monitor.schemas import LabTodayStageSnapshot
from app.domains.orders.models import OrderTest
from app.shared.enums import SampleStatus, TestStatus
from sqlalchemy import and_, func
from sqlalchemy.orm import Session


class LabBoardService:
    """Loads stage rows and assembles the lab monitor board snapshot."""

    def __init__(self, db: Session):
        self.db = db
        self._tat = CatalogTatResolver(db)

    def _max_tat_for_codes(self, codes: list[str] | None) -> int:
        return self._tat.max_hours_for_codes(codes)

    def compute_board_summary(self, include_supervisor: bool = True) -> dict[str, Any]:
        """SQL-backed counts for tab badges — avoids loading full queue rows."""
        from app.shared.enums import SampleStatus, TestStatus

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
            supervisor = len(self._escalation_rows())
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
        rows_loaded = (
            len(collection_rows) + len(entry_rows) + len(validation_rows) + len(escalation_rows)
        )
        snapshot = assemble_board(
            collection_rows,
            entry_rows,
            validation_rows,
            escalation_rows,
        )
        snapshot.update({"todayPanel": self._today_panel_snapshot(), "_rows_loaded": rows_loaded})
        return snapshot

    @staticmethod
    def _terminal_test_statuses() -> tuple[TestStatus, ...]:
        return TERMINAL_PIPELINE_TEST_STATUSES

    @staticmethod
    def _running_tests_predicate():
        return running_tests_predicate()

    @staticmethod
    def _monitor_universe_predicate(today_start: datetime):
        """Same universe as the lab monitor worklist: updated today or still running."""
        return monitor_universe_predicate(today_start)

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
        from app.domains.lab.rules.service import BOARD_EXCLUDED_TEST_STATUSES

        return ~OrderTest.status.in_(BOARD_EXCLUDED_TEST_STATUSES)

    def _collection_rows(self) -> list[dict[str, Any]]:
        rows = (
            collection_base_query(self.db)
            .filter(Sample.status == SampleStatus.PENDING)
            .all()
        )
        return [
            {
                "sample_id": sample.sampleId,
                "order_id": order.orderId,
                "patient_id": patient.id,
                "patient_name": patient.fullName,
                "test_codes": list(sample.testCodes or []),
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
            order_test_stage_query(self.db)
            .filter(OrderTest.status == TestStatus.SAMPLE_COLLECTED)
            .all()
        )
        return [
            {
                "order_test_id": ot.id,
                "order_id": order.orderId,
                "patient_id": patient.id,
                "patient_name": patient.fullName,
                "sample_id": sample.sampleId if sample else None,
                "test_codes": [ot.testCode] if ot.testCode else [],
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
            order_test_stage_query(self.db)
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
                "patient_id": patient.id,
                "patient_name": patient.fullName,
                "sample_id": sample.sampleId if sample else None,
                "test_codes": [ot.testCode] if ot.testCode else [],
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
            order_test_stage_query(self.db, include_sample=False)
            .filter(OrderTest.status == TestStatus.ESCALATED)
            .all()
        )
        from app.domains.lab.quality.service import load_open_tickets_by_order_test_id

        test_ids = [ot.id for ot, _order, _patient, _test in rows]
        tickets_by_test = load_open_tickets_by_order_test_id(self.db, test_ids)
        result: list[dict[str, Any]] = []
        for ot, order, patient, test in rows:
            ticket = tickets_by_test.get(ot.id)
            result.append(
                {
                    "order_test_id": ot.id,
                    "order_id": order.orderId,
                    "patient_id": patient.id,
                    "patient_name": patient.fullName,
                    "test_codes": [ot.testCode] if ot.testCode else [],
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


# --- from monitor/worklist_service.py ---

"""
Server-side lab worklists and command-center aggregates.

Replaces client-side filtering of full order/sample lists for lab queues.
"""

from datetime import UTC, date, datetime, time
from typing import Any

from app.domains.catalog.models import OrderableTest
from app.domains.lab.specimen.models import Sample
from app.domains.lab.quality.service import load_open_tickets_by_order_test_id
from app.domains.lab.rules.service import priority_rank, priority_sort_key
from app.domains.lab.rules.service import COLLECTION_WORKLIST_LINKED_EXCLUDE
from app.domains.lab.rules.service import (
    LabWorkItemContext,
    project_collection_sample,
    project_order_test_entry,
    project_order_test_pipeline,
    project_order_test_validation,
    projection_to_worklist_fields,
)
from app.domains.lab.specimen.service import linked_order_tests_by_sample_ids
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from app.domains.referent_doctors.service import referent_doctor_projection
from app.platform.cache import CacheKeys, cache_get, cache_set
from app.domains.lab.results.service import (
    format_order_test_display,
    parse_order_test_display_search,
)
from app.shared.identifiers import (
    compact_identifier,
    looks_like_accession,
    looks_like_filler,
    looks_like_mnemonic,
    looks_like_mrn,
)
from app.shared.enums import PriorityLevel, SampleStatus, TestStatus
from sqlalchemy import and_, case, desc, exists, func, or_
from sqlalchemy.orm import Session

COLLECTION_SAMPLE_LOOKUP_MIN_LEN = 3
ROUTINE_PRIORITIES = (PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH)


def resolve_worklist_priorities(
    *,
    priorities: list[PriorityLevel] | None,
    priority_group: str | None,
) -> list[PriorityLevel] | None:
    """Intersect explicit priorities with STAT/Routine aliases (urgent vs the rest)."""
    selected = list(priorities or [])
    group: tuple[PriorityLevel, ...] | None = None
    if priority_group == "stat":
        group = (PriorityLevel.URGENT,)
    elif priority_group == "routine":
        group = ROUTINE_PRIORITIES
    if selected and group:
        filtered = [item for item in selected if item in group]
        return filtered
    if selected:
        return selected
    if group:
        return list(group)
    return None


def _apply_worklist_window_filters(
    query,
    *,
    order_date_col,
    sample_type_col,
    date_from: date | None,
    date_to: date | None,
    sample_types: list[str] | None,
):
    """Restrict a worklist query by order date window and sample types."""
    if date_from:
        start = datetime.combine(date_from, time.min, tzinfo=UTC)
        query = query.filter(order_date_col >= start)
    if date_to:
        end = datetime.combine(date_to, time.max, tzinfo=UTC)
        query = query.filter(order_date_col <= end)
    if sample_types:
        query = query.filter(sample_type_col.in_(sample_types))
    return query


def _collection_search_filter(search_term: str):
    term = search_term.strip()
    parsed = parse_order_test_display_search(term)
    if parsed:
        accession, test_code = parsed
        return and_(
            Sample.sampleId == accession,
            exists().where(
                and_(
                    OrderTest.sampleId == Sample.sampleId,
                    OrderTest.testCode == test_code,
                )
            ),
        )
    predicates = [
        Patient.fullName.ilike(f"%{term}%"),
        Sample.sampleId.ilike(f"%{term}%"),
        Order.orderId.ilike(f"%{term}%"),
        Patient.id.ilike(f"%{term}%"),
    ]
    compact = compact_identifier(term)
    if looks_like_accession(term):
        predicates.append(Sample.sampleId == term.strip())
    if looks_like_filler(term):
        predicates.append(Order.orderId == compact)
    if looks_like_mrn(term):
        predicates.append(Patient.id == compact)
    return or_(*predicates)


def _order_test_worklist_search_filter(search_term: str):
    """Match MRN, filler, accession, test mnemonic, order-test display, or names."""
    term = search_term.strip()
    parsed = parse_order_test_display_search(term)
    if parsed:
        accession, test_code = parsed
        return and_(
            Sample.sampleId == accession,
            OrderTest.testCode == test_code,
        )
    predicates = [
        Patient.fullName.ilike(f"%{term}%"),
        OrderableTest.name.ilike(f"%{term}%"),
        OrderTest.testCode.ilike(f"%{term}%"),
        Sample.sampleId.ilike(f"%{term}%"),
        Order.orderId.ilike(f"%{term}%"),
        Patient.id.ilike(f"%{term}%"),
    ]
    compact = compact_identifier(term)
    if looks_like_accession(term):
        predicates.append(Sample.sampleId == term.strip())
    if looks_like_filler(term):
        predicates.append(Order.orderId == compact)
    if looks_like_mrn(term):
        predicates.append(Patient.id == compact)
    if looks_like_mnemonic(term):
        predicates.append(OrderTest.testCode == term.strip().upper())
    return or_(*predicates)


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


def _worklist_result(
    items: list[dict[str, Any]],
    total: int,
    page: int,
    page_size: int,
    *,
    rows_loaded: int,
) -> dict[str, Any]:
    return {
        "items": items,
        "pagination": _paginate(total, page, page_size),
        "rows_loaded": rows_loaded,
    }


class LabWorklistService:
    def __init__(self, db: Session):
        self.db = db
        self._tat = CatalogTatResolver(db)
        self._catalog_cache: dict[str, tuple[str | None, str | None]] = {}

    def _max_tat_for_codes(self, codes: list[str]) -> int:
        return self._tat.max_hours_for_codes(codes)

    def _catalog_meta(self, code: str | None) -> tuple[str | None, str | None]:
        if not code:
            return None, None
        if code in self._catalog_cache:
            return self._catalog_cache[code]
        row = (
            self.db.query(OrderableTest.name, OrderableTest.category)
            .filter(OrderableTest.code == code)
            .first()
        )
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

    @staticmethod
    def _linked_tests_for_collection_row(
        sample: Sample,
        order: Order,
        linked_by_sample: dict[str, list[OrderTest]],
    ) -> list[OrderTest]:
        codes = sample.testCodes or []
        return [
            ot
            for ot in linked_by_sample.get(sample.sampleId, [])
            if ot.orderId == order.orderId and ot.testCode in codes
        ]

    def _original_sample(
        self, sample: Sample, parents: dict[str, Sample] | None = None
    ) -> Sample | None:
        if not sample.originalSampleId:
            return None
        if parents is not None:
            return parents.get(sample.originalSampleId)
        return self.db.query(Sample).filter(Sample.sampleId == sample.originalSampleId).first()

    def _original_sample_collected_at(
        self, sample: Sample, parents: dict[str, Sample] | None = None
    ) -> datetime | None:
        parent = self._original_sample(sample, parents)
        return parent.collectedAt if parent else None

    def _samples_by_ids(self, sample_ids: list[str]) -> dict[str, Sample]:
        """Load samples keyed by primary key; empty input returns an empty map."""
        ids = [sample_id for sample_id in sample_ids if sample_id]
        if not ids:
            return {}
        return {
            row.sampleId: row
            for row in self.db.query(Sample).filter(Sample.sampleId.in_(ids)).all()
        }

    def _sample_lineage_fields(
        self, sample: Sample | None, parents: dict[str, Sample]
    ) -> dict[str, Any]:
        """Clinical recollection fields for order-test worklist rows."""
        if not sample:
            return {
                "sampleIsRecollection": False,
                "sampleOriginalSampleId": None,
                "sampleRecollectionAttempt": None,
            }
        return {
            "sampleIsRecollection": bool(sample.isRecollection),
            "sampleOriginalSampleId": sample.originalSampleId,
            "sampleRecollectionAttempt": sample.recollectionAttempt,
        }

    def _prior_test_display_map(self, order_tests: list[OrderTest]) -> dict[int, str]:
        """
        Map retest order-test ids to the prior line's accession/mnemonic display.

        Integer FKs stay internal; UI lineage uses the stored clinical identifiers.
        """
        prior_ids = {ot.retestOfTestId for ot in order_tests if ot.retestOfTestId}
        if not prior_ids:
            return {}
        priors = (
            self.db.query(OrderTest).filter(OrderTest.id.in_(prior_ids)).all()
        )
        prior_by_id = {row.id: row for row in priors}
        samples = self._samples_by_ids(
            [row.sampleId for row in priors if row.sampleId]
        )
        displays: dict[int, str] = {}
        for ot in order_tests:
            if not ot.retestOfTestId:
                continue
            prior = prior_by_id.get(ot.retestOfTestId)
            if not prior:
                continue
            prior_sample = samples.get(prior.sampleId) if prior.sampleId else None
            display = format_order_test_display(
                prior_sample.sampleId if prior_sample else None,
                prior.testCode,
            )
            if display and display != "-":
                displays[ot.id] = display
        return displays

    def _build_collection_worklist_item(
        self,
        *,
        sample: Sample,
        order: Order,
        patient: Patient,
        linked_tests: list[OrderTest],
        parents: dict[str, Sample] | None = None,
        include_queue_metrics: bool = True,
    ) -> dict[str, Any]:
        codes = sample.testCodes or []
        projection = project_collection_sample(
            LabWorkItemContext(
                order=order,
                sample=sample,
                linked_order_tests=linked_tests,
            )
        )
        work_item_fields = projection_to_worklist_fields(projection)
        test_name, test_category = self._collection_test_display(codes)
        since = order.orderDate
        hours = hours_since(since)
        tat = self._max_tat_for_codes(codes)
        item: dict[str, Any] = {
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
            **referent_doctor_projection(order),
            "testName": test_name,
            "testCategory": test_category,
            "isAliquot": bool(sample.isAliquot),
            "parentSampleId": sample.parentSampleId,
            "isRecollection": bool(sample.isRecollection),
            "originalSampleId": sample.originalSampleId,
            "originalSampleCollectedAt": self._original_sample_collected_at(sample, parents),
            "recollectionSampleId": sample.recollectionSampleId,
            "recollectionReason": sample.recollectionReason,
            "recollectionAttempt": sample.recollectionAttempt or 1,
            **work_item_fields,
            "waitingHours": round(hours, 2),
            "turnaroundHours": tat,
            "actualContainerType": sample.actualContainerType,
            "actualContainerColor": sample.actualContainerColor,
            "collectedAt": sample.collectedAt,
            "collectedBy": sample.collectedBy,
            "collectedVolume": sample.collectedVolume,
        }
        if include_queue_metrics:
            item["queueAgeBand"] = age_bucket(hours, tat)
            item["priorityRank"] = priority_rank(sample.priority)
        return item

    def _escalation_code(self, tickets_by_test: dict, order_test_id: int) -> str | None:
        ticket = tickets_by_test.get(order_test_id)
        if not ticket or not ticket.reasonCode:
            return None
        return ticket.reasonCode.value

    def _build_pipeline_dashboard_item(
        self,
        *,
        order_test: OrderTest,
        order: Order,
        patient: Patient,
        test: OrderableTest,
        sample: Sample | None,
        escalation_code: str | None,
    ) -> dict[str, Any]:
        updated_at = self._normalize_ts(order_test.updatedAt) or datetime.now(UTC)
        projection = project_order_test_pipeline(
            LabWorkItemContext(
                order=order,
                order_test=order_test,
                sample=sample,
                escalation_reason_code=escalation_code,
            )
        )
        work_item_fields = projection_to_worklist_fields(projection)
        return {
            "orderTestId": order_test.id,
            "orderId": order.orderId,
            "patientId": patient.id,
            "patientName": patient.fullName,
            "patientDob": patient.dateOfBirth,
            "patientGender": patient.gender,
            "testCode": order_test.testCode,
            "testName": test.name,
            "sampleType": test.sampleType or "",
            "priority": order.priority,
            "status": order_test.status,
            "stage": self._dashboard_stage(order_test),
            "activityAt": updated_at,
            "orderDate": order.orderDate,
            **referent_doctor_projection(order),
            "testCategory": test.category,
            **work_item_fields,
        }

    def _order_test_worklist_query(
        self,
        *,
        extra_filters: tuple,
        priorities: list[PriorityLevel] | None,
        date_from: date | None,
        date_to: date | None,
        sample_types: list[str] | None,
        search: str | None,
        category: str | None = None,
    ):
        query = order_test_stage_query(self.db).filter(*extra_filters)
        if priorities:
            query = query.filter(Order.priority.in_(priorities))
        if category:
            query = query.filter(OrderableTest.category == category)
        query = _apply_worklist_window_filters(
            query,
            order_date_col=Order.orderDate,
            sample_type_col=OrderableTest.sampleType,
            date_from=date_from,
            date_to=date_to,
            sample_types=sample_types,
        )
        search_term = search.strip() if search else ""
        if search_term:
            query = query.filter(_order_test_worklist_search_filter(search_term))
        return query, search_term

    def list_collection(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        priorities: list[PriorityLevel] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sample_types: list[str] | None = None,
        category: str | None = None,
    ) -> dict[str, Any]:
        search_term = search.strip() if search else ""
        if len(search_term) < COLLECTION_SAMPLE_LOOKUP_MIN_LEN:
            search_term = ""
        query = collection_base_query(self.db)
        if search_term:
            query = query.filter(_collection_search_filter(search_term))
        else:
            query = query.filter(Sample.status == SampleStatus.PENDING)
        if priorities:
            query = query.filter(Sample.priority.in_(priorities))
        if category:
            query = query.filter(
                exists().where(
                    and_(
                        OrderTest.sampleId == Sample.sampleId,
                        OrderTest.testCode == OrderableTest.code,
                        OrderableTest.category == category,
                    )
                )
            )
        query = _apply_worklist_window_filters(
            query,
            order_date_col=Order.orderDate,
            sample_type_col=Sample.sampleType,
            date_from=date_from,
            date_to=date_to,
            sample_types=sample_types,
        )
        total = query.count()
        start = (page - 1) * page_size
        if search_term:
            query = query.order_by(
                desc(Sample.updatedAt),
                desc(Sample.collectedAt),
                desc(Order.orderDate),
            )
        else:
            query = query.order_by(
                priority_sort_key(Sample.priority),
                Order.orderDate.asc(),
            )
        rows = query.offset(start).limit(page_size).all()
        parent_ids = [
            sample.originalSampleId for sample, _order, _patient in rows if sample.originalSampleId
        ]
        parents = self._samples_by_ids(parent_ids)
        all_codes: list[str] = []
        for sample, _order, _patient in rows:
            all_codes.extend(sample.testCodes or [])
        if all_codes:
            self._tat.warmup(all_codes)
        sample_ids = [sample.sampleId for sample, _order, _patient in rows]
        linked_by_sample = linked_order_tests_by_sample_ids(
            self.db,
            sample_ids,
            exclude_statuses=COLLECTION_WORKLIST_LINKED_EXCLUDE,
        )
        items = []
        for sample, order, patient in rows:
            linked_tests = self._linked_tests_for_collection_row(sample, order, linked_by_sample)
            items.append(
                self._build_collection_worklist_item(
                    sample=sample,
                    order=order,
                    patient=patient,
                    linked_tests=linked_tests,
                    parents=parents,
                )
            )
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

    def get_sample_work_context(self, sample_id: str) -> dict[str, Any]:
        """Canonical collection eligibility for one sample (deep-link / modal)."""
        from fastapi import HTTPException
        from fastapi import status as http_status

        row = collection_base_query(self.db).filter(Sample.sampleId == sample_id).first()
        if not row:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Sample {sample_id} not found",
            )
        sample, order, patient = row
        if sample.testCodes:
            self._tat.warmup(sample.testCodes)
        linked_by_sample = linked_order_tests_by_sample_ids(
            self.db,
            [sample.sampleId],
            exclude_statuses=COLLECTION_WORKLIST_LINKED_EXCLUDE,
        )
        linked_tests = self._linked_tests_for_collection_row(sample, order, linked_by_sample)
        return self._build_collection_worklist_item(
            sample=sample,
            order=order,
            patient=patient,
            linked_tests=linked_tests,
            include_queue_metrics=False,
        )

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

    def list_entry(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        priorities: list[PriorityLevel] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sample_types: list[str] | None = None,
        category: str | None = None,
    ) -> dict[str, Any]:
        query, _search_term = self._order_test_worklist_query(
            extra_filters=(OrderTest.status == TestStatus.SAMPLE_COLLECTED,),
            priorities=priorities,
            date_from=date_from,
            date_to=date_to,
            sample_types=sample_types,
            search=search,
            category=category,
        )
        total = query.count()
        start = (page - 1) * page_size
        since_col = func.coalesce(Sample.collectedAt, Order.orderDate)
        rows = (
            query.order_by(priority_sort_key(Order.priority), since_col.asc())
            .offset(start)
            .limit(page_size)
            .all()
        )
        items = []
        samples_in_page = [sample for _ot, _order, _patient, _test, sample in rows if sample]
        parents = self._samples_by_ids(
            [sample.originalSampleId for sample in samples_in_page if sample.originalSampleId]
        )
        prior_displays = self._prior_test_display_map([ot for ot, *_rest in rows])
        for ot, order, patient, test, sample in rows:
            since = sample.collectedAt if sample and sample.collectedAt else order.orderDate
            hours = hours_since(since)
            projection = project_order_test_entry(
                LabWorkItemContext(order=order, order_test=ot, sample=sample)
            )
            work_item_fields = projection_to_worklist_fields(projection)
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
                    "retestOfTestId": ot.retestOfTestId,
                    "retestNumber": ot.retestNumber or 0,
                    "priorTestDisplay": prior_displays.get(ot.id),
                    **self._sample_lineage_fields(sample, parents),
                    **referent_doctor_projection(order),
                    "testCategory": test.category,
                    **work_item_fields,
                    "queueAgeBand": None,
                    "priorityRank": priority_rank(order.priority),
                }
            )
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

    def list_validation(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        priorities: list[PriorityLevel] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sample_types: list[str] | None = None,
        category: str | None = None,
    ) -> dict[str, Any]:
        query, _search_term = self._order_test_worklist_query(
            extra_filters=(
                OrderTest.status == TestStatus.RESULTED,
                OrderTest.resultValidatedAt.is_(None),
            ),
            priorities=priorities,
            date_from=date_from,
            date_to=date_to,
            sample_types=sample_types,
            search=search,
            category=category,
        )
        total = query.count()
        start = (page - 1) * page_size
        since_col = func.coalesce(OrderTest.resultEnteredAt, Order.orderDate)
        rows = (
            query.order_by(priority_sort_key(Order.priority), since_col.asc())
            .offset(start)
            .limit(page_size)
            .all()
        )
        items = []
        samples_in_page = [sample for _ot, _order, _patient, _test, sample in rows if sample]
        parents = self._samples_by_ids(
            [sample.originalSampleId for sample in samples_in_page if sample.originalSampleId]
        )
        prior_displays = self._prior_test_display_map([ot for ot, *_rest in rows])
        for ot, order, patient, test, sample in rows:
            since = ot.resultEnteredAt or order.orderDate
            hours = hours_since(since)
            tat_band = (
                age_bucket(hours, test.turnaroundTimeHours) if test.turnaroundTimeHours else None
            )
            projection = project_order_test_validation(
                LabWorkItemContext(order=order, order_test=ot, sample=sample)
            )
            work_item_fields = projection_to_worklist_fields(projection)
            items.append(
                {
                    "orderTestId": ot.id,
                    "orderId": order.orderId,
                    "patientId": patient.id,
                    "patientName": patient.fullName,
                    "testCode": ot.testCode,
                    "testName": test.name,
                    "sampleType": test.sampleType or "",
                    "sampleId": ot.sampleId,
                    "priority": order.priority,
                    "status": ot.status,
                    "resultEnteredAt": ot.resultEnteredAt,
                    "orderDate": order.orderDate,
                    "waitingHours": round(hours, 2),
                    "turnaroundHours": test.turnaroundTimeHours,
                    "hasCriticalValues": bool(ot.hasCriticalValues),
                    "testCategory": test.category,
                    "sampleStatus": sample.status if sample else None,
                    "results": ot.results,
                    "flags": ot.flags,
                    "enteredBy": ot.enteredBy,
                    **referent_doctor_projection(order),
                    "isRetest": bool(ot.isRetest),
                    "retestOfTestId": ot.retestOfTestId,
                    "retestNumber": ot.retestNumber or 0,
                    "priorTestDisplay": prior_displays.get(ot.id),
                    **self._sample_lineage_fields(sample, parents),
                    **work_item_fields,
                    "queueAgeBand": tat_band,
                    "priorityRank": priority_rank(order.priority),
                }
            )
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

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

    @staticmethod
    def _dashboard_running_predicate():
        """Order tests still in the lab pipeline (non-terminal lifecycle)."""
        return running_tests_predicate()

    @staticmethod
    def _dashboard_monitor_rows_predicate(today_start: datetime):
        """Union of tests updated today (UTC) and tests still running in the pipeline."""
        return monitor_universe_predicate(today_start)

    def list_dashboard_work_today(
        self,
        *,
        user_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        """Lab monitor table rows: union of tests updated today (UTC) and still-running pipeline tests."""
        _ = user_id  # reserved for future per-user scoping
        today_start = self._utc_today_start()
        running = self._dashboard_running_predicate()
        stale_running = and_(running, OrderTest.updatedAt < today_start)
        stale_running_rank = case((stale_running, 1), else_=0)

        base_query = order_test_stage_query(self.db).filter(
            self._dashboard_monitor_rows_predicate(today_start)
        )
        total = base_query.count()
        start = (page - 1) * page_size
        rows = (
            base_query.order_by(desc(stale_running_rank), OrderTest.updatedAt.desc())
            .offset(start)
            .limit(page_size)
            .all()
        )

        escalated_ids = [
            ot.id
            for ot, _order, _patient, _test, _sample in rows
            if ot.status == TestStatus.ESCALATED
        ]
        tickets_by_test = load_open_tickets_by_order_test_id(self.db, escalated_ids)

        items: list[dict[str, Any]] = []
        for order_test, order, patient, test, sample in rows:
            updated_at = self._normalize_ts(order_test.updatedAt) or datetime.now(UTC)
            item = self._build_pipeline_dashboard_item(
                order_test=order_test,
                order=order,
                patient=patient,
                test=test,
                sample=sample,
                escalation_code=self._escalation_code(tickets_by_test, order_test.id),
            )
            item["_sort_updated"] = updated_at
            items.append(item)

        for item in items:
            item.pop("_sort_updated", None)
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

    def list_all_order_tests(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        priorities: list[PriorityLevel] | None = None,
        statuses: list[TestStatus] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sample_types: list[str] | None = None,
    ) -> dict[str, Any]:
        """All order tests, newest activity first (OrderTest.updatedAt)."""
        query = order_test_stage_query(self.db).filter(inactive_lineage_filter())
        if priorities:
            query = query.filter(Order.priority.in_(priorities))
        if statuses:
            query = query.filter(OrderTest.status.in_(statuses))
        if date_from:
            start = datetime.combine(date_from, time.min, tzinfo=UTC)
            query = query.filter(OrderTest.updatedAt >= start)
        if date_to:
            end = datetime.combine(date_to, time.max, tzinfo=UTC)
            query = query.filter(OrderTest.updatedAt <= end)
        if sample_types:
            query = query.filter(OrderableTest.sampleType.in_(sample_types))
        search_term = search.strip() if search else ""
        if search_term:
            query = query.filter(_order_test_worklist_search_filter(search_term))

        total = query.count()
        start = (page - 1) * page_size
        rows = query.order_by(OrderTest.updatedAt.desc()).offset(start).limit(page_size).all()

        escalated_ids = [
            ot.id
            for ot, _order, _patient, _test, _sample in rows
            if ot.status == TestStatus.ESCALATED
        ]
        tickets_by_test = load_open_tickets_by_order_test_id(self.db, escalated_ids)

        items: list[dict[str, Any]] = []
        for order_test, order, patient, test, sample in rows:
            items.append(
                self._build_pipeline_dashboard_item(
                    order_test=order_test,
                    order=order,
                    patient=patient,
                    test=test,
                    sample=sample,
                    escalation_code=self._escalation_code(tickets_by_test, order_test.id),
                )
            )
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

    def get_board(
        self,
        include_supervisor: bool = True,
        *,
        detail: str = "full",
    ) -> dict[str, Any]:
        if detail == "summary":
            scope = "supervisor" if include_supervisor else "tech"
            cache_key = f"{CacheKeys.LAB_BOARD_SUMMARY_PREFIX}:{scope}"
            cached = cache_get(cache_key)
            if cached is not None:
                return cached
            board = LabBoardService(self.db)
            summary = board.compute_board_summary(include_supervisor=include_supervisor)
            cache_set(cache_key, summary, ttl=15)
            return summary
        board = LabBoardService(self.db)
        return board.compute_board_snapshot(
            include_supervisor=include_supervisor,
            detail="full",
        )

    @staticmethod
    def expand_summary_to_board_response(summary: dict[str, Any]) -> dict[str, Any]:
        """Pad summary counts with empty monitor sections for LabBoardResponse compatibility."""
        empty_age = {
            "oldestHours": None,
            "averageHours": None,
            "warningCount": 0,
            "criticalCount": 0,
        }
        return {
            **summary,
            "queueAge": {
                "collection": empty_age,
                "entry": empty_age,
                "validation": empty_age,
            },
            "blockers": {
                "paymentUnpaid": 0,
                "retestPending": 0,
                "recollectionWaiting": 0,
                "total": 0,
            },
            "ageBuckets": {"fresh": 0, "onTrack": 0, "warning": 0, "critical": 0},
            "priorityMix": {"urgent": 0, "high": 0, "medium": 0, "low": 0},
            "attentionItems": [],
            "attentionTotal": 0,
        }

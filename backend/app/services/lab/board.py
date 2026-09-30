"""
Command-center board snapshot — single authoritative lab-state payload.

Blocker mapping (authoritative for lab worklists and monitor UI):
- payment_unpaid: unpaid collection specimen
- retest_pending: entry-queue retest
- specimen_recollection: pending collection sample that is a redraw
- recollection_approval / escalations: attention-only (counted in supervisor, not blockers)
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from app.data.lab_constants import QUEUE_AGE_CRITICAL_HOURS, QUEUE_AGE_WARNING_HOURS
from app.models.escalation import EscalationTicket
from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.quality_issue import QualityIssue
from app.models.recollection_request import RecollectionRequest
from app.models.sample import Sample
from app.models.test import Test
from app.schemas.enums import (
    EscalationTicketStatus,
    PriorityLevel,
    RecollectionRequestStatus,
    SampleStatus,
    TestStatus,
)
from app.services.lab.blockers import (
    ATTENTION_TYPE_SORT,
    PRIORITY_ATTENTION_TYPES,
    PRIORITY_WEIGHT,
    SUPERVISOR_ATTENTION_TYPES,
    attention_type_for,
    should_surface_attention,
)
from app.services.lab.eligibility import BLOCKED_LABELS, blocked_reason_for_work_item
from sqlalchemy import and_, func, or_
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
    order_id: int,
    patient_name: str,
    priority: str,
    waiting_hours: float,
    blocked_reason: str | None,
    since: datetime | None,
    order_test_ids: list[int],
    attention_type: str,
    work_item_count: int = 1,
) -> dict[str, Any]:
    return {
        "id": f"{attention_type}-{order_id}-{stage}",
        "stage": stage,
        "stageLabel": STAGE_LABELS[stage],
        "orderId": order_id,
        "patientName": patient_name or "Unknown patient",
        "priority": priority,
        "waitingHours": round(waiting_hours, 2),
        "blockedReason": blocked_reason,
        "blockedLabel": BLOCKED_LABELS.get(blocked_reason) if blocked_reason else None,
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
    recollection_rows: list[dict[str, Any]],
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
        blocked = blocked_reason_for_work_item(
            status=TestStatus.PENDING.value,
            payment_status=_enum_value(row.get("payment_status")),
            sample_status=_enum_value(row.get("sample_status")),
            sample_is_recollection=bool(row.get("is_recollection")),
        )
        if blocked == "payment_unpaid":
            blockers["paymentUnpaid"] += 1
        if blocked == "specimen_recollection":
            blockers["recollectionWaiting"] += 1
        if should_surface_attention(blocked, status):
            candidates.append(
                _attention_candidate(
                    stage="collection",
                    order_id=row["order_id"],
                    patient_name=row.get("patient_name") or "Unknown patient",
                    priority=priority,
                    waiting_hours=hours,
                    blocked_reason=blocked,
                    since=since,
                    order_test_ids=[],
                    attention_type=attention_type_for(blocked, status, priority),
                )
            )

    for row in entry_rows:
        since = row.get("collected_at") or row.get("order_date")
        priority = _priority_value(row.get("priority"))
        tat = row.get("turnaround_hours") or 24
        hours, status, _ = track_wait("entry", since, tat, priority)
        blocked = blocked_reason_for_work_item(
            status=TestStatus.SAMPLE_COLLECTED.value,
            is_retest=bool(row.get("is_retest")),
            sample_status=_enum_value(row.get("sample_status")),
            sample_is_recollection=bool(row.get("sample_is_recollection")),
            escalation_reason_code=row.get("reason_code"),
        )
        if blocked == "retest_pending":
            blockers["retestPending"] += 1
        order_test_id = row.get("order_test_id")
        if should_surface_attention(blocked, status):
            candidates.append(
                _attention_candidate(
                    stage="entry",
                    order_id=row["order_id"],
                    patient_name=row.get("patient_name") or "Unknown patient",
                    priority=priority,
                    waiting_hours=hours,
                    blocked_reason=blocked,
                    since=since,
                    order_test_ids=[order_test_id] if order_test_id is not None else [],
                    attention_type=attention_type_for(blocked, status, priority),
                )
            )

    for row in validation_rows:
        since = row.get("result_entered_at") or row.get("collected_at") or row.get("order_date")
        priority = _priority_value(row.get("priority"))
        tat = row.get("turnaround_hours") or 24
        hours, status, _ = track_wait("validation", since, tat, priority)
        blocked = blocked_reason_for_work_item(
            status=TestStatus.RESULTED.value,
            is_retest=bool(row.get("is_retest")),
            sample_status=_enum_value(row.get("sample_status")),
            escalation_reason_code=row.get("reason_code"),
        )
        order_test_id = row.get("order_test_id")
        if should_surface_attention(blocked, status):
            candidates.append(
                _attention_candidate(
                    stage="validation",
                    order_id=row["order_id"],
                    patient_name=row.get("patient_name") or "Unknown patient",
                    priority=priority,
                    waiting_hours=hours,
                    blocked_reason=blocked,
                    since=since,
                    order_test_ids=[order_test_id] if order_test_id is not None else [],
                    attention_type=attention_type_for(blocked, status, priority),
                )
            )

    for row in escalation_rows:
        since = row.get("result_entered_at") or row.get("order_date")
        hours = hours_since(since, current)
        status = tat_status(hours, row.get("turnaround_hours") or 24)
        priority = _priority_value(row.get("priority"))
        blocked = (
            blocked_reason_for_work_item(
                status=TestStatus.ESCALATED.value,
                is_retest=bool(row.get("is_retest")),
                sample_status=_enum_value(row.get("sample_status")),
                escalation_reason_code=row.get("reason_code"),
            )
            or "supervisor_review"
        )
        order_test_id = row.get("order_test_id")
        candidates.append(
            _attention_candidate(
                stage="validation",
                order_id=row["order_id"],
                patient_name=row.get("patient_name") or "Unknown patient",
                priority=priority,
                waiting_hours=hours,
                blocked_reason=blocked,
                since=since,
                order_test_ids=[order_test_id] if order_test_id is not None else [],
                attention_type=attention_type_for(blocked, status, priority),
            )
        )

    for row in recollection_rows:
        since = row.get("created_at")
        hours = hours_since(since, current)
        priority = _priority_value(row.get("priority"))
        affected = row.get("affected_order_test_ids") or []
        order_test_id = row.get("order_test_id")
        order_test_ids = (
            [int(v) for v in affected]
            if affected
            else ([order_test_id] if order_test_id is not None else [])
        )
        candidates.append(
            _attention_candidate(
                stage="validation",
                order_id=row["order_id"],
                patient_name=row.get("patient_name") or "Unknown patient",
                priority=priority,
                waiting_hours=hours,
                blocked_reason="recollection_approval",
                since=since,
                order_test_ids=order_test_ids,
                attention_type="supervisor_recollection_request",
                work_item_count=len(order_test_ids) or 1,
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
        "supervisor": len(escalation_rows) + len(recollection_rows),
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


class LabBoardService:
    """Loads stage rows and assembles the lab monitor board snapshot."""

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

    def _max_tat_for_codes(self, codes: list[str] | None) -> int:
        if not codes:
            return 24
        return max(self._get_turnaround(code) for code in codes)

    def compute_board_summary(self, include_supervisor: bool = True) -> dict[str, Any]:
        """SQL-backed counts for tab badges — avoids loading full queue rows."""
        from app.schemas.enums import SampleStatus, TestStatus

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
        from app.services.lab.recollection_snapshot import recollection_blocked_order_test_ids

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
            self.db.query(OrderTest, Order, Patient, Test, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(Test, OrderTest.testCode == Test.code)
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
            self.db.query(OrderTest, Order, Patient, Test, Sample)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(Test, OrderTest.testCode == Test.code)
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
            self.db.query(OrderTest, Order, Patient, Test)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Patient, Order.patientId == Patient.id)
            .join(Test, OrderTest.testCode == Test.code)
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

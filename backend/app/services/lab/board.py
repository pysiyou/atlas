"""
Command-center board snapshot — single authoritative lab-state payload.

Blocker mapping (aligned with frontend deriveWorkItemState):
- payment_unpaid: unpaid collection specimen
- retest_pending: entry-queue retest
- specimen_recollection: pending collection sample that is a redraw
- recollection_approval / escalations: attention-only (counted in supervisor, not blockers)
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from app.data.lab_constants import QUEUE_AGE_CRITICAL_HOURS, QUEUE_AGE_WARNING_HOURS
from app.models.escalation import EscalationTicket
from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.models.recollection_request import RecollectionRequest
from app.models.sample import Sample
from app.models.test import Test
from app.schemas.enums import (
    EscalationReasonCode,
    EscalationTicketStatus,
    PaymentStatus,
    PriorityLevel,
    RecollectionRequestStatus,
    SampleStatus,
    TestStatus,
)
from sqlalchemy import Date, cast, func
from sqlalchemy.orm import Session

ATTENTION_LIMIT = 50

TatBucket = Literal["fresh", "onTrack", "warning", "critical"]
TatStatus = Literal["fresh", "warning", "critical"]
QueueStage = Literal["collection", "entry", "validation"]

STAGE_LABELS: dict[QueueStage, str] = {
    "collection": "Collection",
    "entry": "Entry",
    "validation": "Validation",
}

PRIORITY_WEIGHT = {
    PriorityLevel.URGENT.value: 4,
    PriorityLevel.HIGH.value: 3,
    PriorityLevel.MEDIUM.value: 2,
    PriorityLevel.LOW.value: 1,
    "urgent": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}

BLOCKED_LABELS = {
    "payment_unpaid": "Payment required",
    "specimen_recollection": "Recollection required",
    "sample_rejected": "Sample rejected",
    "retest_pending": "Re-test in progress",
    "critical_value": "Critical value — supervisor review",
    "amendment_pending": "Amendment pending",
    "retry_limit": "Re-test limit reached",
    "recollection_limit": "Recollection limit reached",
    "supervisor_review": "Supervisor approval required",
    "recollection_approval": "Recollection awaiting supervisor approval",
}

BLOCKED_ATTENTION_TYPE = {
    "critical_value": "escalation_critical",
    "amendment_pending": "escalation_amendment",
    "retry_limit": "escalation_retry_limit",
    "recollection_limit": "escalation_recollection_limit",
    "supervisor_review": "supervisor_approval",
    "recollection_approval": "supervisor_recollection_request",
    "payment_unpaid": "payment_blocked",
    "sample_rejected": "sample_rejected",
    "specimen_recollection": "recollection_waiting",
    "retest_pending": "retest_in_progress",
}

ATTENTION_TYPE_SORT = {
    "escalation_critical": 10,
    "escalation_amendment": 20,
    "escalation_retry_limit": 30,
    "escalation_recollection_limit": 40,
    "supervisor_approval": 45,
    "supervisor_recollection_request": 48,
    "payment_blocked": 50,
    "sample_rejected": 60,
    "recollection_waiting": 70,
    "retest_in_progress": 80,
    "priority_urgent": 82,
    "priority_high": 84,
    "queue_overdue_critical": 90,
    "queue_overdue_warning": 100,
}

SUPERVISOR_ATTENTION_TYPES = {
    "escalation_critical",
    "escalation_amendment",
    "escalation_retry_limit",
    "escalation_recollection_limit",
    "supervisor_approval",
    "supervisor_recollection_request",
}

PRIORITY_ATTENTION_TYPES = {"priority_urgent", "priority_high"}


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


def blocked_reason_for_work_item(
    *,
    status: str,
    is_retest: bool = False,
    payment_status: str | None = None,
    sample_status: str | None = None,
    sample_is_recollection: bool = False,
    escalation_reason_code: str | None = None,
) -> str | None:
    """Mirror of frontend deriveWorkItemState blockedReason."""
    if payment_status == PaymentStatus.UNPAID.value and status in (
        TestStatus.PENDING.value,
        "pending",
    ):
        return "payment_unpaid"
    if status == TestStatus.ESCALATED.value:
        if escalation_reason_code == EscalationReasonCode.CRIT_VAL.value:
            return "critical_value"
        if escalation_reason_code == EscalationReasonCode.AMEND_RES.value:
            return "amendment_pending"
        if escalation_reason_code == EscalationReasonCode.LIMIT_HIT.value:
            return "retry_limit"
        if escalation_reason_code == EscalationReasonCode.REJ_SAMP.value:
            return "recollection_limit"
        return "supervisor_review"
    if sample_status == SampleStatus.REJECTED.value:
        return "sample_rejected"
    if sample_is_recollection and status in (TestStatus.PENDING.value, "pending"):
        return "specimen_recollection"
    if is_retest and status == TestStatus.SAMPLE_COLLECTED.value:
        return "retest_pending"
    return None


def should_surface_attention(
    blocked_reason: str | None,
    status: TatStatus,
    *,
    always: bool = False,
) -> bool:
    """Surface blocked work, TAT breaches, and always-on supervisor items. STAT-only work is excluded."""
    if always or blocked_reason:
        return True
    return status in ("warning", "critical")


def attention_type_for(
    blocked_reason: str | None,
    status: TatStatus,
    priority: str,
) -> str:
    if blocked_reason:
        return BLOCKED_ATTENTION_TYPE.get(blocked_reason, "queue_overdue_warning")
    if status == "critical":
        return "queue_overdue_critical"
    if status == "warning":
        return "queue_overdue_warning"
    if priority == PriorityLevel.URGENT.value:
        return "priority_urgent"
    if priority == PriorityLevel.HIGH.value:
        return "priority_high"
    return "queue_overdue_warning"


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
    """Loads lightweight stage rows and assembles the command-center snapshot."""

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

    def compute_board_snapshot(self, include_supervisor: bool = True) -> dict[str, Any]:
        collection_rows = self._collection_rows()
        entry_rows = self._entry_rows()
        validation_rows = self._validation_rows()
        escalation_rows = self._escalation_rows() if include_supervisor else []
        recollection_rows = self._recollection_rows() if include_supervisor else []
        snapshot = assemble_board(
            collection_rows,
            entry_rows,
            validation_rows,
            escalation_rows,
            recollection_rows,
        )
        snapshot.update(
            self._dashboard_extensions(snapshot, validation_rows, escalation_rows)
        )
        return snapshot

    def _utc_today_start(self) -> datetime:
        today = datetime.now(UTC).date()
        return datetime.combine(today, datetime.min.time()).replace(tzinfo=UTC)

    def _active_order_test_filter(self):
        return ~OrderTest.status.in_(
            (TestStatus.CANCELLED, TestStatus.REMOVED, TestStatus.SUPERSEDED)
        )

    def _orders_today_count(self) -> int:
        return (
            self.db.query(func.count(OrderTest.id))
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(Order.orderDate >= self._utc_today_start())
            .filter(self._active_order_test_filter())
            .scalar()
            or 0
        )

    def _volume_by_day(self) -> tuple[list[dict[str, Any]], int, float | None]:
        """Last 7 UTC days of order-test volume; WoW uses the prior 7-day window."""
        today = datetime.now(UTC).date()
        days = [today - timedelta(days=offset) for offset in range(13, -1, -1)]
        start = datetime.combine(days[0], datetime.min.time()).replace(tzinfo=UTC)
        day_expr = cast(func.timezone("UTC", Order.orderDate), Date)
        rows = (
            self.db.query(day_expr, func.count(OrderTest.id))
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(Order.orderDate >= start)
            .filter(self._active_order_test_filter())
            .group_by(day_expr)
            .all()
        )
        counts = {str(day): int(count) for day, count in rows}
        series = [{"date": day.isoformat(), "count": counts.get(day.isoformat(), 0)} for day in days]
        last_week = series[-7:]
        prior_week = series[:7]
        volume_total = sum(point["count"] for point in last_week)
        prior_total = sum(point["count"] for point in prior_week)
        wow = (
            None
            if prior_total == 0
            else round((volume_total - prior_total) / prior_total * 100, 1)
        )
        return last_week, volume_total, wow

    def _dashboard_extensions(
        self,
        snapshot: dict[str, Any],
        validation_rows: list[dict[str, Any]],
        escalation_rows: list[dict[str, Any]],
    ) -> dict[str, Any]:
        awaiting = snapshot["counts"]["entry"] + snapshot["counts"]["validation"]
        critical = sum(1 for row in validation_rows if row.get("has_critical_values")) + sum(
            1
            for row in escalation_rows
            if row.get("reason_code") == EscalationReasonCode.CRIT_VAL.value
        )
        buckets = snapshot["ageBuckets"]
        total_active = snapshot["totalActive"]
        tat = (
            100
            if total_active <= 0
            else round((buckets["fresh"] + buckets["onTrack"]) / total_active * 100)
        )
        volume_by_day, volume_total, wow = self._volume_by_day()
        return {
            "dashboardKpis": {
                "ordersToday": self._orders_today_count(),
                "awaitingResults": awaiting,
                "criticalValues": critical,
                "tatCompliancePercent": tat,
                "volumeTotal": volume_total,
                "volumeWowPercent": wow,
            },
            "volumeByDay": volume_by_day,
        }

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

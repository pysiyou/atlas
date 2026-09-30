"""TAT metrics and board assembly helpers (pure functions)."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from app.domains.lab.rules.blockers import (
    ATTENTION_TYPE_SORT,
    PRIORITY_ATTENTION_TYPES,
    PRIORITY_WEIGHT,
    SUPERVISOR_ATTENTION_TYPES,
    attention_type_for,
    should_surface_attention,
)
from app.domains.lab.rules.work_item_projection import (
    blocked_label_for_reason,
    blocked_reason_for_monitor_row,
)
from app.shared.contracts.enums import PriorityLevel
from app.shared.contracts.lab_constants import QUEUE_AGE_CRITICAL_HOURS, QUEUE_AGE_WARNING_HOURS

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
        "blockedLabel": blocked_label_for_reason(blocked_reason),
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
        blocked = blocked_reason_for_monitor_row(
            "collection",
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
        blocked = blocked_reason_for_monitor_row(
            "entry",
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
        blocked = blocked_reason_for_monitor_row(
            "validation",
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
        blocked = blocked_reason_for_monitor_row(
            "escalation",
            is_retest=bool(row.get("is_retest")),
            sample_status=_enum_value(row.get("sample_status")),
            escalation_reason_code=row.get("reason_code"),
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

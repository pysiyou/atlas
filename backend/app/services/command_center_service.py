"""
Command Center Service — aggregated dashboard metrics and activity timeline.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from statistics import median
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.escalation import EscalationTicket
from app.models.lab_audit import LabOperationLog
from app.models.order import Order, OrderTest
from app.models.quality_issue import QualityIssue
from app.models.recollection_request import RecollectionRequest
from app.models.sample import Sample
from app.models.test import Test
from app.models.user import User
from app.schemas.enums import (
    EscalationTicketStatus,
    RecollectionRequestStatus,
    SampleStatus,
    TestStatus,
)

ON_TIME_TARGET_PCT = 90
STAGE_TARGET_FRACTION = 0.25

STAGE_DEFINITIONS = [
    {"key": "pending", "name": "Pending"},
    {"key": "collected", "name": "Collection"},
    {"key": "processing", "name": "Processing"},
    {"key": "validation", "name": "Validation"},
]

DELAY_SOURCE_DEFINITIONS = [
    {"key": "escalations", "name": "Escalations"},
    {"key": "rework", "name": "Rework cycles"},
    {"key": "sample", "name": "Sample issues"},
]


def _hours_between(start: datetime | None, end: datetime | None) -> float | None:
    if start is None or end is None:
        return None
    return max((end - start).total_seconds() / 3600.0, 0.0)


def _percentile(values: List[float], pct: float) -> float:
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    if len(sorted_vals) == 1:
        return sorted_vals[0]
    rank = (len(sorted_vals) - 1) * (pct / 100.0)
    lower = int(rank)
    upper = min(lower + 1, len(sorted_vals) - 1)
    weight = rank - lower
    return sorted_vals[lower] + (sorted_vals[upper] - sorted_vals[lower]) * weight


def _stage_stats(values: List[float], target_hours: float) -> dict:
    if not values:
        return {
            "hours": 0.0,
            "targetHours": round(target_hours, 1),
            "minHours": 0.0,
            "maxHours": 0.0,
            "p95Hours": 0.0,
        }
    return {
        "hours": round(sum(values) / len(values), 1),
        "targetHours": round(target_hours, 1),
        "minHours": round(min(values), 1),
        "maxHours": round(max(values), 1),
        "p95Hours": round(_percentile(values, 95), 1),
    }


class CommandCenterService:
    """Aggregated metrics and timeline for the lab command center."""

    def __init__(self, db: Session):
        self.db = db

    def get_dashboard(self, hours_back: int = 24) -> dict:
        return {
            "operationsOverview": self.get_operations_overview(hours_back=hours_back),
            "categorySummary": self.get_category_summary(hours_back=hours_back),
            "stageTiming": self.get_stage_timing(hours_back=hours_back),
            "delayImpact": self.get_delay_impact(hours_back=hours_back),
            "turnaroundTime": self.get_turnaround_time(hours_back=hours_back),
            "slaPerformance": self.get_sla_performance(hours_back=hours_back),
        }

    def get_timeline_events(
        self,
        hours_back: int = 24,
        limit: int = 100,
        offset: int = 0,
    ) -> List[dict]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)

        logs = (
            self.db.query(LabOperationLog)
            .filter(LabOperationLog.performedAt >= cutoff)
            .order_by(LabOperationLog.performedAt.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        user_ids = {
            int(log.performedBy)
            for log in logs
            if log.performedBy and log.performedBy.isdigit()
        }
        user_map: dict[str, str] = {}
        if user_ids:
            users = self.db.query(User.id, User.name).filter(User.id.in_(user_ids)).all()
            user_map = {str(user.id): user.name for user in users}

        events = []
        for log in logs:
            performed_by_name = None
            if log.performedBy == "system":
                performed_by_name = "System"
            elif log.performedBy in user_map:
                performed_by_name = user_map[log.performedBy]

            events.append(
                {
                    "id": log.id,
                    "type": log.operationType,
                    "entityType": log.entityType,
                    "entityId": log.entityId,
                    "timestamp": log.performedAt.isoformat(),
                    "performedBy": log.performedBy,
                    "performedByName": performed_by_name,
                    "metadata": log.operationData or {},
                    "beforeState": log.beforeState,
                    "afterState": log.afterState,
                    "comment": log.comment,
                }
            )

        return events

    def get_timeline_count(self, hours_back: int = 24) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        return (
            self.db.query(func.count(LabOperationLog.id))
            .filter(LabOperationLog.performedAt >= cutoff)
            .scalar()
            or 0
        )

    def get_category_summary(self, hours_back: int = 24) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)

        rows = (
            self.db.query(Test.category, func.count(OrderTest.id))
            .join(Test, OrderTest.testCode == Test.code)
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(Order.createdAt >= cutoff)
            .filter(OrderTest.status != TestStatus.SUPERSEDED)
            .group_by(Test.category)
            .order_by(func.count(OrderTest.id).desc())
            .all()
        )

        total = sum(count for _, count in rows)
        categories = []
        for category, count in rows:
            percentage = round((count / total) * 100) if total else 0
            categories.append(
                {
                    "category": category,
                    "count": count,
                    "percentage": percentage,
                }
            )

        return {"total": total, "categories": categories}

    def get_operations_overview(self, hours_back: int = 24) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)

        test_statuses = (
            self.db.query(OrderTest.status, func.count(OrderTest.id))
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(Order.createdAt >= cutoff)
            .filter(OrderTest.status != TestStatus.SUPERSEDED)
            .group_by(OrderTest.status)
            .all()
        )
        status_map = {str(status.value): count for status, count in test_statuses}

        open_escalations = (
            self.db.query(func.count(EscalationTicket.id))
            .filter(EscalationTicket.status == EscalationTicketStatus.OPEN)
            .filter(EscalationTicket.createdAt >= cutoff)
            .scalar()
            or 0
        )
        resolved_escalations = (
            self.db.query(func.count(EscalationTicket.id))
            .filter(EscalationTicket.status == EscalationTicketStatus.RESOLVED)
            .filter(EscalationTicket.resolvedAt >= cutoff)
            .scalar()
            or 0
        )

        quality_issues = (
            self.db.query(func.count(QualityIssue.id))
            .filter(QualityIssue.createdAt >= cutoff)
            .scalar()
            or 0
        )

        pending_recollections = (
            self.db.query(func.count(RecollectionRequest.id))
            .filter(RecollectionRequest.status == RecollectionRequestStatus.PENDING_APPROVAL)
            .scalar()
            or 0
        )
        approved_recollections = (
            self.db.query(func.count(RecollectionRequest.id))
            .filter(RecollectionRequest.status == RecollectionRequestStatus.APPROVED)
            .filter(RecollectionRequest.reviewedAt >= cutoff)
            .scalar()
            or 0
        )
        denied_recollections = (
            self.db.query(func.count(RecollectionRequest.id))
            .filter(RecollectionRequest.status == RecollectionRequestStatus.DENIED)
            .filter(RecollectionRequest.reviewedAt >= cutoff)
            .scalar()
            or 0
        )

        return {
            "testFlow": status_map,
            "escalations": {
                "open": open_escalations,
                "resolved": resolved_escalations,
            },
            "qualityIssues": quality_issues,
            "recollectionRequests": {
                "pending": pending_recollections,
                "approved": approved_recollections,
                "denied": denied_recollections,
            },
        }

    def _validated_tests_in_window(self, hours_back: int):
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        return (
            self.db.query(OrderTest, Sample, Test, Order)
            .join(Order, OrderTest.orderId == Order.orderId)
            .join(Test, OrderTest.testCode == Test.code)
            .outerjoin(Sample, OrderTest.sampleId == Sample.sampleId)
            .filter(Order.createdAt >= cutoff)
            .filter(OrderTest.status == TestStatus.VALIDATED)
            .filter(OrderTest.resultValidatedAt.isnot(None))
            .all()
        )

    def get_stage_timing(self, hours_back: int = 24) -> dict:
        rows = self._validated_tests_in_window(hours_back)

        pending_vals: List[float] = []
        collected_vals: List[float] = []
        processing_vals: List[float] = []
        validation_vals: List[float] = []
        target_hours = 0.0
        target_count = 0

        for order_test, sample, test, _order in rows:
            target_hours += float(test.turnaroundTimeHours) * STAGE_TARGET_FRACTION
            target_count += 1

            collected_at = sample.collectedAt if sample else None
            pending = _hours_between(order_test.createdAt, collected_at)
            processing = _hours_between(collected_at, order_test.resultEnteredAt)
            validation = _hours_between(
                order_test.resultEnteredAt, order_test.resultValidatedAt
            )

            if pending is not None:
                pending_vals.append(pending)
            if collected_at is not None:
                collected_vals.append(0.0)
            if processing is not None:
                processing_vals.append(processing)
            if validation is not None:
                validation_vals.append(validation)

        default_target = round(target_hours / target_count, 1) if target_count else 0.0
        stage_values = {
            "pending": pending_vals,
            "collected": collected_vals,
            "processing": processing_vals,
            "validation": validation_vals,
        }

        stages = []
        for stage_def in STAGE_DEFINITIONS:
            key = stage_def["key"]
            stats = _stage_stats(stage_values[key], default_target)
            stages.append({"key": key, "name": stage_def["name"], **stats})

        return {"stages": stages}

    def get_turnaround_time(self, hours_back: int = 24) -> dict:
        rows = self._validated_tests_in_window(hours_back)

        tat_values: List[float] = []
        target_values: List[float] = []
        stage_totals = {
            "pending": 0.0,
            "collected": 0.0,
            "processing": 0.0,
            "validation": 0.0,
        }
        stage_counts = {key: 0 for key in stage_totals}

        for order_test, sample, test, order in rows:
            tat = _hours_between(order.createdAt, order_test.resultValidatedAt)
            if tat is None:
                continue

            tat_values.append(tat)
            target_values.append(float(test.turnaroundTimeHours))

            collected_at = sample.collectedAt if sample else None
            stage_durations = {
                "pending": _hours_between(order_test.createdAt, collected_at),
                "collected": 0.0 if collected_at else None,
                "processing": _hours_between(collected_at, order_test.resultEnteredAt),
                "validation": _hours_between(
                    order_test.resultEnteredAt, order_test.resultValidatedAt
                ),
            }

            for key, duration in stage_durations.items():
                if duration is None:
                    continue
                stage_totals[key] += duration
                stage_counts[key] += 1

        avg_target = sum(target_values) / len(target_values) if target_values else 0.0
        stage_labels = {
            "pending": "Pending",
            "collected": "Collection",
            "processing": "Processing",
            "validation": "Validation",
        }
        stages = []
        for key, label in stage_labels.items():
            count = stage_counts[key]
            hours = round(stage_totals[key] / count, 1) if count else 0.0
            stages.append({"key": key, "label": label, "hours": hours})

        return {
            "avgHours": round(sum(tat_values) / len(tat_values), 1) if tat_values else 0.0,
            "targetHours": round(avg_target, 1),
            "medianHours": round(median(tat_values), 1) if tat_values else 0.0,
            "p95Hours": round(_percentile(tat_values, 95), 1) if tat_values else 0.0,
            "minHours": round(min(tat_values), 1) if tat_values else 0.0,
            "maxHours": round(max(tat_values), 1) if tat_values else 0.0,
            "stages": stages,
        }

    def get_delay_impact(self, hours_back: int = 24) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)

        total_tests = (
            self.db.query(func.count(OrderTest.id))
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(Order.createdAt >= cutoff)
            .filter(OrderTest.status != TestStatus.SUPERSEDED)
            .scalar()
            or 0
        )

        escalation_rows = (
            self.db.query(EscalationTicket)
            .filter(EscalationTicket.createdAt >= cutoff)
            .filter(EscalationTicket.resolvedAt.isnot(None))
            .all()
        )
        escalation_delays = [
            delay
            for ticket in escalation_rows
            if (delay := _hours_between(ticket.createdAt, ticket.resolvedAt)) is not None
        ]
        escalation_count = len(escalation_delays)
        escalation_impact = sum(escalation_delays)

        retest_rows = (
            self.db.query(OrderTest)
            .join(Order, OrderTest.orderId == Order.orderId)
            .filter(Order.createdAt >= cutoff)
            .filter(OrderTest.isRetest.is_(True))
            .filter(OrderTest.resultValidatedAt.isnot(None))
            .all()
        )
        rework_delays = []
        for retest in retest_rows:
            order = retest.order
            delay = _hours_between(order.createdAt, retest.resultValidatedAt)
            if delay is not None:
                rework_delays.append(delay)
        rework_count = len(rework_delays)
        rework_impact = sum(rework_delays)

        recollection_rows = (
            self.db.query(RecollectionRequest)
            .filter(RecollectionRequest.createdAt >= cutoff)
            .filter(RecollectionRequest.reviewedAt.isnot(None))
            .all()
        )
        sample_delays = []
        for request in recollection_rows:
            delay = _hours_between(request.createdAt, request.reviewedAt)
            if delay is not None:
                sample_delays.append(delay)

        rejected_samples = (
            self.db.query(Sample)
            .join(Order, Sample.orderId == Order.orderId)
            .filter(Order.createdAt >= cutoff)
            .filter(Sample.status == SampleStatus.REJECTED)
            .filter(Sample.rejectedAt.isnot(None))
            .all()
        )
        for sample in rejected_samples:
            delay = _hours_between(sample.createdAt, sample.rejectedAt)
            if delay is not None:
                sample_delays.append(delay)

        sample_count = len(sample_delays)
        sample_impact = sum(sample_delays)

        raw_sources = [
            {
                "key": "escalations",
                "name": "Escalations",
                "count": escalation_count,
                "impactHours": round(escalation_impact, 1),
            },
            {
                "key": "rework",
                "name": "Rework cycles",
                "count": rework_count,
                "impactHours": round(rework_impact, 1),
            },
            {
                "key": "sample",
                "name": "Sample issues",
                "count": sample_count,
                "impactHours": round(sample_impact, 1),
            },
        ]

        sources = []
        for source in raw_sources:
            count = source["count"]
            impact = source["impactHours"]
            avg_delay = round(impact / count, 1) if count else 0.0
            pct_of_tests = round((count / total_tests) * 100, 1) if total_tests else 0.0
            sources.append(
                {
                    **source,
                    "avgDelayHours": avg_delay,
                    "pctOfTests": pct_of_tests,
                }
            )

        sources.sort(key=lambda item: item["impactHours"], reverse=True)
        total_impact = round(sum(source["impactHours"] for source in sources), 1)

        return {"sources": sources, "totalImpactHours": total_impact}

    def get_sla_performance(self, hours_back: int = 24) -> dict:
        rows = self._validated_tests_in_window(hours_back)

        on_time_count = 0
        delayed_count = 0
        delay_over_values: List[float] = []
        severity_counts = {"slight": 0, "moderate": 0, "severe": 0}

        for order_test, _sample, test, order in rows:
            tat = _hours_between(order.createdAt, order_test.resultValidatedAt)
            if tat is None:
                continue

            target = float(test.turnaroundTimeHours)
            if tat <= target:
                on_time_count += 1
                continue

            delayed_count += 1
            over = tat - target
            delay_over_values.append(over)

            if over <= 2:
                severity_counts["slight"] += 1
            elif over <= 6:
                severity_counts["moderate"] += 1
            else:
                severity_counts["severe"] += 1

        total_tests = on_time_count + delayed_count
        on_time_rate = round((on_time_count / total_tests) * 100) if total_tests else 0
        delayed_rate = 100 - on_time_rate if total_tests else 0

        severity_defs = [
            {"key": "slight", "label": "≤2h over"},
            {"key": "moderate", "label": "2–6h over"},
            {"key": "severe", "label": ">6h over"},
        ]
        delay_severity = []
        for severity in severity_defs:
            count = severity_counts[severity["key"]]
            pct = round((count / delayed_count) * 100) if delayed_count else 0
            delay_severity.append(
                {
                    "key": severity["key"],
                    "label": severity["label"],
                    "count": count,
                    "pct": pct,
                }
            )

        avg_delay_over = (
            round(sum(delay_over_values) / len(delay_over_values), 1)
            if delay_over_values
            else 0.0
        )

        return {
            "onTimeRate": on_time_rate,
            "onTimeTarget": ON_TIME_TARGET_PCT,
            "totalTests": total_tests,
            "onTimeCount": on_time_count,
            "delayedCount": delayed_count,
            "delayedRate": delayed_rate,
            "avgDelayOverTarget": avg_delay_over,
            "delaySeverity": delay_severity,
        }

"""Shared SQLAlchemy predicates for lab monitor and worklists."""

from __future__ import annotations

from datetime import datetime

from app.domains.lab.rules.test_status_sets import (
    INACTIVE_LINEAGE_STATUSES,
)
from app.domains.orders.models import OrderTest
from app.shared.contracts.enums import TestStatus
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

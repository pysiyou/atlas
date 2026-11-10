"""Named test status sets for lab queues, collection, and lineage filtering."""

from __future__ import annotations

from app.shared.contracts.enums import TestStatus

# Superseded/removed lines disappear from operational worklists.
INACTIVE_LINEAGE_STATUSES: tuple[TestStatus, ...] = (
    TestStatus.SUPERSEDED,
    TestStatus.REMOVED,
)

# Rollup/reporting inactive set (includes cancelled).
INACTIVE_ROLLUP_EXTRA_STATUSES: tuple[TestStatus, ...] = (TestStatus.CANCELLED,)

# Terminal outcomes excluded when listing "active" work on a sample during collection.
COLLECTION_LINKED_TEST_EXCLUDE_STATUSES: tuple[TestStatus, ...] = (
    TestStatus.SUPERSEDED,
    TestStatus.REMOVED,
    TestStatus.CANCELLED,
)

# Worklist dashboards: hide lineage-inactive tests only.
WORKLIST_EXCLUDED_TEST_STATUSES: tuple[TestStatus, ...] = INACTIVE_LINEAGE_STATUSES

# Collection worklist linked tests: also skip validated/cancelled terminal rows.
COLLECTION_WORKLIST_LINKED_EXCLUDE: tuple[TestStatus, ...] = (
    TestStatus.SUPERSEDED,
    TestStatus.REMOVED,
    TestStatus.VALIDATED,
    TestStatus.CANCELLED,
)

# Tests ignored when validating collection transitions (not cancelled — handled separately).
COLLECTION_TRANSITION_SKIP_STATUSES: frozenset[TestStatus] = frozenset(
    {
        TestStatus.SUPERSEDED,
        TestStatus.REMOVED,
        TestStatus.VALIDATED,
    }
)

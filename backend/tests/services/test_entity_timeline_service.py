"""
Unit tests for entity timeline relevance filtering and taxonomy.
"""
from __future__ import annotations

import unittest
from types import SimpleNamespace

from app.schemas.enums import LabOperationType
from app.services.timeline.taxonomy import (
    get_event_phase,
    is_entity_visible,
)
from app.services.timeline.relevance import (
    RelevanceEngine,
    SampleTimelineScope,
    TestTimelineScope,
)


def _log(
    operation_type: LabOperationType,
    entity_type: str,
    entity_id: int,
    metadata: dict | None = None,
    after_state: dict | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        operationType=operation_type,
        entityType=entity_type,
        entityId=entity_id,
        operationData=metadata or {},
        afterState=after_state,
    )


class TestEventTaxonomy(unittest.TestCase):
    def test_order_status_change_not_entity_visible(self) -> None:
        self.assertFalse(is_entity_visible(LabOperationType.ORDER_STATUS_CHANGE))

    def test_order_payment_not_entity_visible(self) -> None:
        self.assertFalse(is_entity_visible(LabOperationType.ORDER_PAYMENT_RECORDED))

    def test_result_entry_entity_visible_with_phase(self) -> None:
        self.assertTrue(is_entity_visible(LabOperationType.RESULT_ENTRY))
        self.assertEqual(get_event_phase(LabOperationType.RESULT_ENTRY), "results")

    def test_collection_quality_issue_phase(self) -> None:
        self.assertEqual(
            get_event_phase(LabOperationType.QUALITY_ISSUE_REPORTED, quality_stage="collection"),
            "specimen",
        )


class TestRelevanceEngineTestTimeline(unittest.TestCase):
    def setUp(self) -> None:
        self.scope = TestTimelineScope(
            anchor_test_id=10,
            order_test_ids={10, 11},
            sample_ids={100},
            test_codes={"CBC"},
            test_sample_map={10: 100, 11: 100},
            quality_issue_order_test_map={500: 10},
            recollection_request_map={
                1: {
                    "orderTestId": 10,
                    "affectedOrderTestIds": [10],
                    "rejectedSampleId": 100,
                    "createdSampleId": 101,
                    "createdTestId": 11,
                }
            },
        )

    def test_excludes_order_status_change(self) -> None:
        log = _log(LabOperationType.ORDER_STATUS_CHANGE, "order", 1)
        self.assertFalse(RelevanceEngine.applies_to_test_timeline(log, self.scope))

    def test_includes_own_result_entry(self) -> None:
        log = _log(
            LabOperationType.RESULT_ENTRY,
            "order_test",
            10,
            {"testCode": "CBC", "orderTestId": 10},
        )
        self.assertTrue(RelevanceEngine.applies_to_test_timeline(log, self.scope))

    def test_excludes_sibling_result_entry(self) -> None:
        log = _log(
            LabOperationType.RESULT_ENTRY,
            "order_test",
            99,
            {"testCode": "BMP", "orderTestId": 99},
        )
        self.assertFalse(RelevanceEngine.applies_to_test_timeline(log, self.scope))

    def test_includes_sample_collect_when_test_code_matches(self) -> None:
        log = _log(
            LabOperationType.SAMPLE_COLLECT,
            "sample",
            100,
            {"testCodes": ["CBC", "BMP"]},
        )
        self.assertTrue(RelevanceEngine.applies_to_test_timeline(log, self.scope))

    def test_excludes_sample_collect_for_unrelated_tube_codes(self) -> None:
        log = _log(
            LabOperationType.SAMPLE_COLLECT,
            "sample",
            100,
            {"testCodes": ["BMP"]},
        )
        self.assertFalse(RelevanceEngine.applies_to_test_timeline(log, self.scope))

    def test_includes_quality_issue_for_scoped_test(self) -> None:
        log = _log(
            LabOperationType.QUALITY_ISSUE_REPORTED,
            "quality_issue",
            500,
            {"orderTestId": 10, "stage": "validation"},
            after_state={"stage": "validation"},
        )
        self.assertTrue(RelevanceEngine.applies_to_test_timeline(log, self.scope))

    def test_legacy_recollection_approve_via_request_map(self) -> None:
        log = _log(
            LabOperationType.RECOLLECTION_REQUEST_APPROVED,
            "order",
            1,
            {"requestId": 1, "createdSampleId": 101},
        )
        self.assertTrue(RelevanceEngine.applies_to_test_timeline(log, self.scope))

    def test_legacy_recollection_denied_for_unrelated_request(self) -> None:
        log = _log(
            LabOperationType.RECOLLECTION_REQUEST_DENIED,
            "order",
            1,
            {"requestId": 99},
        )
        self.assertFalse(RelevanceEngine.applies_to_test_timeline(log, self.scope))

    def test_includes_retest_chain_validation(self) -> None:
        log = _log(
            LabOperationType.RESULT_VALIDATION_APPROVE,
            "order_test",
            11,
            {"orderTestId": 11, "testCode": "CBC"},
        )
        self.assertTrue(RelevanceEngine.applies_to_test_timeline(log, self.scope))


class TestRelevanceEngineSampleTimeline(unittest.TestCase):
    def setUp(self) -> None:
        self.scope = SampleTimelineScope(
            anchor_sample_id=100,
            sample_ids={100, 101},
            quality_issue_sample_map={500: 100},
            recollection_request_map={
                1: {
                    "orderTestId": 10,
                    "affectedOrderTestIds": [10],
                    "rejectedSampleId": 100,
                    "createdSampleId": 101,
                }
            },
        )

    def test_includes_sample_collect_on_chain(self) -> None:
        log = _log(LabOperationType.SAMPLE_COLLECT, "sample", 101, {"testCodes": ["CBC"]})
        self.assertTrue(RelevanceEngine.applies_to_sample_timeline(log, self.scope))

    def test_excludes_result_entry(self) -> None:
        log = _log(LabOperationType.RESULT_ENTRY, "order_test", 10)
        self.assertFalse(RelevanceEngine.applies_to_sample_timeline(log, self.scope))

    def test_includes_collection_quality_issue(self) -> None:
        log = _log(
            LabOperationType.QUALITY_ISSUE_REPORTED,
            "quality_issue",
            500,
            {"sampleId": 100, "stage": "collection"},
            after_state={"stage": "collection"},
        )
        self.assertTrue(RelevanceEngine.applies_to_sample_timeline(log, self.scope))

    def test_excludes_validation_quality_issue(self) -> None:
        log = _log(
            LabOperationType.QUALITY_ISSUE_REPORTED,
            "quality_issue",
            501,
            {"sampleId": 100, "stage": "validation"},
            after_state={"stage": "validation"},
        )
        self.assertFalse(RelevanceEngine.applies_to_sample_timeline(log, self.scope))

    def test_legacy_recollection_on_rejected_sample(self) -> None:
        log = _log(
            LabOperationType.RECOLLECTION_REQUEST_CREATED,
            "order",
            1,
            {"requestId": 1, "rejectedSampleId": 100},
        )
        self.assertTrue(RelevanceEngine.applies_to_sample_timeline(log, self.scope))


if __name__ == "__main__":
    unittest.main()

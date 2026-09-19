"""Sample rejection hub — audit stage and multi-test reset behavior."""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

from app.models.order import OrderTest
from app.models.sample import Sample
from app.schemas.enums import (
    ContainerTopColor,
    ContainerType,
    PriorityLevel,
    QualityStage,
    RemedyType,
    SampleStatus,
    SampleType,
    TestStatus,
)
from app.services.lab.quality import QualityIssueService
from app.services.lab.sample_rejection_context import SampleRejectionContext


def _collected_sample() -> Sample:
    return Sample(
        sampleId=10,
        orderId=1,
        sampleType=SampleType.BLOOD,
        status=SampleStatus.COLLECTED,
        testCodes=["T1", "T2"],
        requiredVolume=5.0,
        priority=PriorityLevel.LOW,
        requiredContainerTypes=[ContainerType.TUBE],
        requiredContainerColors=[ContainerTopColor.RED],
        collectedAt=datetime.now(UTC),
        collectedBy="1",
        createdBy="1",
        updatedBy="1",
    )


def _order_test(test_id: int, status: TestStatus, test_code: str = "T1") -> OrderTest:
    return OrderTest(
        id=test_id,
        orderId=1,
        testCode=test_code,
        status=status,
        priceAtOrder=10.0,
        sampleId=10,
        results={"x": 1} if status == TestStatus.RESULTED else None,
    )


def test_reject_sample_record_audit_includes_collection_stage():
    db = MagicMock()
    audit = MagicMock()
    service = QualityIssueService(db, audit, MagicMock())
    sample = _collected_sample()
    linked = [
        _order_test(1, TestStatus.RESULTED, "T1"),
        _order_test(2, TestStatus.SAMPLE_COLLECTED, "T2"),
    ]

    with patch.object(service, "_linked_tests", return_value=linked):
        service._reject_sample_record(
            sample,
            99,
            "hemolyzed",
            "bad tube",
            SampleRejectionContext(stage=QualityStage.COLLECTION),
        )

    audit.log_sample_rejection.assert_called_once()
    metadata = audit.log_sample_rejection.call_args.kwargs["metadata"]
    assert metadata["rejectionStage"] == QualityStage.COLLECTION.value
    assert metadata["notes"] == "bad tube"
    assert sample.status == SampleStatus.REJECTED
    assert linked[0].status == TestStatus.RESULTED
    assert linked[1].status == TestStatus.PENDING
    assert linked[1].results is None


def test_reject_sample_record_audit_includes_validation_stage_and_order_test():
    db = MagicMock()
    audit = MagicMock()
    service = QualityIssueService(db, audit, MagicMock())
    sample = _collected_sample()

    with patch.object(service, "_linked_tests", return_value=[]):
        service._reject_sample_record(
            sample,
            5,
            "clotted",
            None,
            SampleRejectionContext(stage=QualityStage.VALIDATION, order_test_id=42),
        )

    metadata = audit.log_sample_rejection.call_args.kwargs["metadata"]
    assert metadata["rejectionStage"] == QualityStage.VALIDATION.value
    assert metadata["orderTestId"] == 42


def test_report_sample_issue_cancel_remedy_resets_unfinished_not_cancels():
    db = MagicMock()
    audit = MagicMock()
    service = QualityIssueService(db, audit, MagicMock())
    sample = _collected_sample()

    with (
        patch.object(service, "_get_sample", return_value=sample),
        patch.object(
            QualityIssueService,
            "_sample_options",
            return_value=MagicMock(
                unfinishedTestsCount=1,
                resultedTestsCount=0,
                validatedTestsCount=0,
            ),
        ),
        patch(
            "app.services.lab.quality.RejectionCriteriaService",
        ) as criteria_cls,
        patch.object(service, "_reject_sample_record") as reject_mock,
        patch.object(service, "_record_issue", return_value=MagicMock(id=7)),
        patch("app.services.lab.quality.update_order_status"),
    ):
        criteria_cls.return_value.validate_for_tests.return_value = None
        result = service._report_sample_issue(
            10,
            1,
            "hemolyzed",
            None,
            RemedyType.CANCEL,
        )

    reject_mock.assert_called_once()
    assert reject_mock.call_args.kwargs.get("reset_unfinished") is True
    assert result.remedy == RemedyType.CANCEL
    assert "reset to await collection" in result.message

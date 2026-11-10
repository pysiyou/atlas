"""Quality issue option previews for sample and test targets."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.domains.lab.quality.rejection_criteria import RejectionCriteriaService
from app.domains.lab.schemas.lab import QualityIssueOptions
from app.platform.utils.common import is_specimen_rejection_reason
from app.platform.utils.exceptions import LabOperationError
from app.domains.orders.models import OrderTest
from app.shared.contracts.enums import (
    QualityIssueTargetType,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.shared.contracts.lab_contract import MAX_RETEST_ATTEMPTS

from .issue_chain import count_retests_in_chain
from .issue_remedy_types import SAMPLE_RESET_STATUSES, sample_unfinished_remedy_types, validation_remedy_types

if TYPE_CHECKING:
    from .issues_service import QualityIssueService


def sample_options(svc: QualityIssueService, sample_id: int) -> QualityIssueOptions:
    sample = svc.get_sample(sample_id)
    recollection_used = svc.collection.attempts_used(sample)
    recollection_remaining = svc.collection.attempts_remaining_after(sample)

    linked = svc.linked_tests(
        sample, exclude=[TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED]
    )
    resulted = sum(1 for t in linked if t.status == TestStatus.RESULTED)
    validated = sum(1 for t in linked if t.status == TestStatus.VALIDATED)
    unfinished = sum(1 for t in linked if t.status in SAMPLE_RESET_STATUSES)
    awaiting_recollection = sum(
        1 for t in linked if t.status == TestStatus.PENDING and t.sampleId == sample_id
    )

    allowed = sample_unfinished_remedy_types() if unfinished > 0 else []
    suggested = RemedyType.REQUEST_RECOLLECTION if unfinished > 0 else None

    parts: list[str] = []
    if unfinished > 0:
        parts.append(
            f"{unfinished} unfinished test(s) — request recollection or reject tube only."
        )
    if resulted > 0:
        parts.append(
            f"{resulted} unvalidated resulted test(s) will be cleared when the tube is rejected."
        )
    if validated > 0:
        parts.append(
            f"{validated} validated/released result(s) stay unchanged — amend separately if needed."
        )
    if not parts:
        parts.append("This sample will be marked rejected.")
    criteria = RejectionCriteriaService(svc.db).get_specimen_criteria_for_tests(sample.testCodes)

    return QualityIssueOptions(
        targetType=QualityIssueTargetType.SAMPLE,
        targetId=sample_id,
        orderId=sample.orderId,
        sampleId=sample_id,
        stage=QualityStage.COLLECTION,
        allowedCriteria=criteria,
        allowedRemedies=allowed,
        suggestedRemedy=suggested,
        recollectionAttemptsUsed=recollection_used,
        recollectionAttemptsRemaining=recollection_remaining,
        willEscalate=False,
        previewRemedy=suggested,
        previewMessage=" ".join(parts),
        resultedTestsCount=resulted,
        validatedTestsCount=validated,
        unfinishedTestsCount=unfinished,
        awaitingRecollectionTestsCount=awaiting_recollection,
    )


def test_options(svc: QualityIssueService, order_test_id: int) -> QualityIssueOptions:
    order_test = svc.db.query(OrderTest).filter(OrderTest.id == order_test_id).first()
    if not order_test:
        raise LabOperationError(f"Test {order_test_id} not found", status_code=404)
    if order_test.status != TestStatus.RESULTED:
        raise LabOperationError(
            "Only resulted tests can be reported at validation", status_code=400
        )

    retest_used = count_retests_in_chain(svc.db, order_test)
    retest_remaining = max(0, MAX_RETEST_ATTEMPTS - retest_used - 1)

    sample_rejected = False
    if order_test.sampleId:
        sample = svc.get_sample(order_test.sampleId)
        sample_rejected = sample.status == SampleStatus.REJECTED

    criteria_service = RejectionCriteriaService(svc.db)
    criteria = criteria_service.get_validation_criteria_for_test(order_test.testCode)
    criteria_items = criteria_service.get_validation_criteria_items_for_test(order_test.testCode)
    has_specimen = any(item.domain == "specimen" for item in criteria_items)
    has_analytical = any(item.domain == "analytical" for item in criteria_items)

    if sample_rejected:
        suggested = RemedyType.REQUEST_RECOLLECTION
        allowed = [r for r in validation_remedy_types() if r != RemedyType.RETRY_SAME_SAMPLE]
    elif has_specimen and not has_analytical and order_test.sampleId:
        suggested = RemedyType.REQUEST_RECOLLECTION
        allowed = validation_remedy_types()
    elif has_analytical and not has_specimen:
        suggested = RemedyType.RETRY_SAME_SAMPLE
        allowed = validation_remedy_types()
    else:
        suggested = RemedyType.RETRY_SAME_SAMPLE
        allowed = validation_remedy_types()

    message_parts = [
        "Rejecting sends this test to a supervisor to approve retest, recollection, or cancellation.",
    ]
    if sample_rejected:
        message_parts.append(
            "Linked sample is already rejected — supervisor may authorize recollection."
        )

    return QualityIssueOptions(
        targetType=QualityIssueTargetType.TEST,
        targetId=order_test_id,
        orderId=order_test.orderId,
        testCode=order_test.testCode,
        sampleId=order_test.sampleId,
        stage=QualityStage.VALIDATION,
        allowedCriteria=criteria,
        allowedRemedies=allowed,
        suggestedRemedy=suggested,
        retestAttemptsUsed=retest_used,
        retestAttemptsRemaining=retest_remaining,
        willEscalate=True,
        previewRemedy=suggested,
        previewMessage=" ".join(message_parts),
        hasSpecimenCriteria=has_specimen,
        hasAnalyticalCriteria=has_analytical,
        sampleRejected=sample_rejected,
    )

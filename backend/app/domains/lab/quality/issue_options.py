"""Quality issue option previews for sample and test targets."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.domains.lab.models.quality_issue import QualityIssue
from app.domains.lab.quality.rejection_criteria import RejectionCriteriaService
from app.domains.lab.schemas.lab import QualityIssueOptions
from app.domains.orders.models import OrderTest
from app.platform.utils import LabOperationError
from app.shared.contracts.enums import (
    QualityIssueTargetType,
    QualityStage,
    RemedyType,
    SampleStatus,
    TestStatus,
)
from app.shared.contracts.lab_contract import MAX_RETEST_ATTEMPTS
from sqlalchemy.orm import Session

from .remedy_support import (
    SAMPLE_RESET_STATUSES,
    sample_unfinished_remedy_types,
    validation_remedy_types,
)

if TYPE_CHECKING:
    from .issues_service import QualityIssueService


def chain_root_test(db: Session, test: OrderTest) -> OrderTest:
    """Walk retestOfTestId links to the root order-test row in the chain."""
    current = test
    while current.retestOfTestId:
        parent = db.query(OrderTest).filter(OrderTest.id == current.retestOfTestId).first()
        if not parent:
            break
        current = parent
    return current


def collect_chain_test_ids(db: Session, order_test: OrderTest) -> set[int]:
    """All order-test row IDs in the retest chain (root through active successor)."""
    root = chain_root_test(db, order_test)
    chain_ids: set[int] = {root.id}
    current = root
    while current.retestOrderTestId:
        child = db.query(OrderTest).filter(OrderTest.id == current.retestOrderTestId).first()
        if not child:
            break
        chain_ids.add(child.id)
        current = child
    return chain_ids


def count_retests_in_chain(db: Session, order_test: OrderTest) -> int:
    """Count prior RETRY_SAME_SAMPLE quality issues across the retest chain."""
    chain_ids = collect_chain_test_ids(db, order_test)
    return (
        db.query(QualityIssue)
        .filter(
            QualityIssue.orderTestId.in_(chain_ids),
            QualityIssue.remedy == RemedyType.RETRY_SAME_SAMPLE,
        )
        .count()
    )


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
    if unfinished > 0 and recollection_remaining <= 0:
        allowed = [r for r in allowed if r != RemedyType.REQUEST_RECOLLECTION]
    suggested = None
    if unfinished > 0:
        if RemedyType.REQUEST_RECOLLECTION in allowed:
            suggested = RemedyType.REQUEST_RECOLLECTION
        elif allowed:
            suggested = allowed[0]

    parts: list[str] = []
    if unfinished > 0:
        parts.append(f"{unfinished} unfinished test(s) — request recollection or reject tube only.")
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
    recollection_remaining = 0
    if order_test.sampleId:
        sample = svc.get_sample(order_test.sampleId)
        sample_rejected = sample.status == SampleStatus.REJECTED
        recollection_remaining = svc.collection.attempts_remaining_after(sample)

    criteria_service = RejectionCriteriaService(svc.db)
    criteria = criteria_service.get_validation_criteria_for_test(order_test.testCode)
    criteria_items = criteria_service.get_validation_criteria_items_for_test(order_test.testCode)
    has_specimen = any(item.domain == "specimen" for item in criteria_items)
    has_analytical = any(item.domain == "analytical" for item in criteria_items)

    allowed = list(validation_remedy_types())
    if sample_rejected or retest_remaining <= 0:
        allowed = [r for r in allowed if r != RemedyType.RETRY_SAME_SAMPLE]
    if recollection_remaining <= 0 or not order_test.sampleId:
        allowed = [r for r in allowed if r != RemedyType.REQUEST_RECOLLECTION]

    if sample_rejected and RemedyType.REQUEST_RECOLLECTION in allowed:
        suggested = RemedyType.REQUEST_RECOLLECTION
    elif has_specimen and not has_analytical and RemedyType.REQUEST_RECOLLECTION in allowed:
        suggested = RemedyType.REQUEST_RECOLLECTION
    elif RemedyType.RETRY_SAME_SAMPLE in allowed:
        suggested = RemedyType.RETRY_SAME_SAMPLE
    elif allowed:
        suggested = allowed[0]
    else:
        suggested = None

    message_parts: list[str] = []
    if sample_rejected:
        message_parts.append(
            "Linked sample is already rejected — retest on the same sample is not available."
        )
    if retest_remaining <= 0:
        message_parts.append("Re-test limit reached — recollect or cancel.")
    if recollection_remaining <= 0:
        message_parts.append("Recollection limit reached — retest or cancel.")
    if not message_parts:
        message_parts.append(
            "Choose retest on the same sample, recollection, or cancel this test."
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
        recollectionAttemptsRemaining=recollection_remaining,
        willEscalate=False,
        previewRemedy=suggested,
        previewMessage=" ".join(message_parts),
        hasSpecimenCriteria=has_specimen,
        hasAnalyticalCriteria=has_analytical,
        sampleRejected=sample_rejected,
    )

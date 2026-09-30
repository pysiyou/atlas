"""
P0 lab invariants on a real PostgreSQL session.

Transaction policy under test: LabOperationsService.run_lab_mutation (single commit + rollup).
"""
from __future__ import annotations

import threading
from datetime import UTC, datetime

import pytest
from app.models.order import OrderTest
from app.models.recollection_request import RecollectionRequest
from app.models.sample import Sample
from app.schemas.critical_values import NotifyRequest
from app.schemas.enums import (
    QualityStage,
    RecollectionRequestStatus,
    SampleStatus,
    TestStatus,
)
from app.schemas.enums import EscalationResolutionAction
from app.services.lab.analyzer_ingest import AnalyzerIngestService
from app.services.lab.workflow import LabOperationsService
from app.utils.exceptions import LabOperationError
from sqlalchemy.orm import Session, sessionmaker

from tests.factories import (
    create_order_with_pending_sample,
    create_resulted_order_test,
    seed_catalog_test,
)

pytestmark = pytest.mark.integration


def test_collect_unpaid(db: Session):
    _order, sample, order_test = create_order_with_pending_sample(db, paid=False)
    svc = LabOperationsService(db)
    with pytest.raises(LabOperationError) as exc:
        svc.collect_sample(
            sample_id=sample.sampleId,
            user_id=1,
            collected_volume=3.0,
            container_type="tube",
            container_color="purple",
        )
    assert exc.value.status_code == 402
    assert exc.value.error_code == "PAYMENT_REQUIRED"
    db.refresh(sample)
    db.refresh(order_test)
    assert sample.status == SampleStatus.PENDING
    assert order_test.status == TestStatus.PENDING


def test_collect_invalid_test_linkage(db: Session):
    _order, sample, order_test = create_order_with_pending_sample(db, paid=True)
    order_test.status = TestStatus.CANCELLED
    db.flush()
    svc = LabOperationsService(db)
    with pytest.raises(LabOperationError) as exc:
        svc.collect_sample(
            sample_id=sample.sampleId,
            user_id=1,
            collected_volume=3.0,
            container_type="tube",
            container_color="purple",
        )
    assert exc.value.status_code == 400
    assert exc.value.error_code == "INVALID_TRANSITION"
    db.refresh(sample)
    assert sample.status == SampleStatus.PENDING


def test_concurrent_validate_resulted(integration_engine):
    SessionLocal = sessionmaker(bind=integration_engine, expire_on_commit=False)
    setup = SessionLocal()
    try:
        _order, _sample, order_test = create_resulted_order_test(setup)
        ot_id = order_test.id
        setup.commit()
    finally:
        setup.close()

    results: list[str] = []
    errors: list[LabOperationError] = []

    def worker():
        conn = integration_engine.connect()
        trans = conn.begin()
        local = SessionLocal(bind=conn)
        try:
            svc = LabOperationsService(local)
            svc.validate_results(order_test_id=ot_id, user_id=1, validation_notes="ok")
            results.append("ok")
            trans.commit()
        except LabOperationError as e:
            errors.append(e)
            trans.rollback()
        finally:
            local.close()
            conn.close()

    t1 = threading.Thread(target=worker)
    t2 = threading.Thread(target=worker)
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    verify = SessionLocal()
    try:
        final = verify.query(OrderTest).filter(OrderTest.id == ot_id).first()
        assert final is not None
        assert final.status == TestStatus.VALIDATED
        assert len(results) == 1
        assert len(errors) >= 1
    finally:
        verify.close()


def test_critical_force_validate_gated(db: Session):
    from app.models.escalation import EscalationTicket
    from app.schemas.enums import EscalationReasonCode, EscalationSeverity, EscalationTicketStatus

    seed_catalog_test(db)
    _order, sample, order_test = create_order_with_pending_sample(db, paid=True)
    order_test.status = TestStatus.ESCALATED
    order_test.hasCriticalValues = True
    order_test.results = {"WBC": "50.0"}
    db.add(
        EscalationTicket(
            orderTestId=order_test.id,
            sampleId=sample.sampleId,
            reasonCode=EscalationReasonCode.CRIT_VAL,
            status=EscalationTicketStatus.OPEN,
            severity=EscalationSeverity.CRITICAL,
            createdByUserId="1",
        )
    )
    db.flush()
    svc = LabOperationsService(db)
    with pytest.raises(LabOperationError):
        svc.resolve_escalation(
            order_test_id=order_test.id,
            user_id=1,
            action=EscalationResolutionAction.FORCE_VALIDATE,
            validation_notes="nope",
            read_back_payload={"readBackConfirmed": True},
        )
    svc.notify_critical_value(
        order_test.id,
        NotifyRequest(notifiedTo="Dr Smith", notificationMethod="phone"),
        user_id=1,
    )
    svc.resolve_escalation(
        order_test_id=order_test.id,
        user_id=1,
        action=EscalationResolutionAction.FORCE_VALIDATE,
        validation_notes="ok",
        read_back_payload={
            "readBackConfirmed": True,
            "providerName": "Dr Smith",
            "providerContact": "555",
        },
    )
    db.refresh(order_test)
    assert order_test.status == TestStatus.VALIDATED


def test_recollection_approve_collect_fulfilled(db: Session):
    order, sample, order_test = create_order_with_pending_sample(db, paid=True)
    sample.status = SampleStatus.REJECTED
    db.flush()
    new_sample = Sample(
        orderId=order.orderId,
        sampleType=sample.sampleType,
        status=SampleStatus.PENDING,
        testCodes=sample.testCodes,
        requiredVolume=sample.requiredVolume,
        priority=sample.priority,
        requiredContainerTypes=sample.requiredContainerTypes,
        requiredContainerColors=sample.requiredContainerColors,
        isRecollection=True,
        originalSampleId=sample.sampleId,
        createdBy="test",
        updatedBy="test",
    )
    db.add(new_sample)
    db.flush()
    request = RecollectionRequest(
        orderId=order.orderId,
        rejectedSampleId=sample.sampleId,
        createdSampleId=new_sample.sampleId,
        status=RecollectionRequestStatus.APPROVED,
        reason="Hemolysis",
        stage=QualityStage.COLLECTION,
        testCodes=sample.testCodes or [order_test.testCode],
        affectedOrderTestIds=[order_test.id],
        requestedByUserId="1",
    )
    db.add(request)
    db.flush()
    svc = LabOperationsService(db)
    svc.collect_sample(
        sample_id=new_sample.sampleId,
        user_id=1,
        collected_volume=3.0,
        container_type="tube",
        container_color="purple",
    )
    db.refresh(request)
    assert request.status == RecollectionRequestStatus.FULFILLED


def test_analyzer_idempotency_duplicate(db: Session):
    order, sample, order_test = create_order_with_pending_sample(db, paid=True)
    sample.status = SampleStatus.COLLECTED
    order_test.status = TestStatus.SAMPLE_COLLECTED
    db.flush()
    ingest = AnalyzerIngestService(db)
    key = "test-msg-001"
    svc = LabOperationsService(db)

    def _mutate():
        ingest._claim_idempotency_key(key, order_test.id)
        return svc._results.enter_results(
            order_test_id=order_test.id,
            user_id=0,
            results={"WBC": "5.0"},
            skip_validation=True,
        )

    svc.run_lab_mutation(_mutate, order_id=order.orderId)
    with pytest.raises(LabOperationError) as exc:
        ingest._claim_idempotency_key(key, order_test.id)
    assert exc.value.status_code == 409
    assert exc.value.error_code == "DUPLICATE_INGEST"
    db.refresh(order_test)
    assert order_test.results == {"WBC": "5.0"}

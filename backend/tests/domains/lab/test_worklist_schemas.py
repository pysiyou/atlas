"""Worklist schema wire stability (camelCase JSON keys)."""

from __future__ import annotations

from datetime import UTC, datetime

from app.domains.lab.schemas.allowed_actions import LabWorklistAllowedActions
from app.domains.lab.schemas.worklists import CollectionWorklistItem, EntryWorklistItem
from app.shared.contracts.enums import PaymentStatus, PriorityLevel, SampleStatus, TestStatus


def test_collection_worklist_item_json_keys_stable():
    item = CollectionWorklistItem(
        sampleId=1,
        orderId=10,
        patientId=2,
        patientName="Patient",
        sampleType="blood",
        status=SampleStatus.PENDING,
        priority=PriorityLevel.MEDIUM,
        paymentStatus=PaymentStatus.PAID,
        orderDate=datetime.now(UTC),
        testCodes=["CBC"],
        isRecollection=False,
        waitingHours=1.0,
        turnaroundHours=24,
        allowedActions=LabWorklistAllowedActions(),
    )
    payload = item.model_dump(mode="json", by_alias=True)
    assert payload["sampleId"] == 1
    assert payload["orderId"] == 10
    assert "queueAgeBand" in CollectionWorklistItem.model_fields
    assert "allowedActions" in payload


def test_entry_worklist_item_json_keys_stable():
    item = EntryWorklistItem(
        orderTestId=99,
        orderId=10,
        patientId=2,
        patientName="Patient",
        testCode="CBC",
        testName="Complete Blood Count",
        sampleId=1,
        sampleType="blood",
        priority=PriorityLevel.MEDIUM,
        status=TestStatus.SAMPLE_COLLECTED,
        collectedAt=None,
        orderDate=datetime.now(UTC),
        waitingHours=2.0,
        turnaroundHours=24,
        isRetest=False,
        allowedActions=LabWorklistAllowedActions(),
    )
    payload = item.model_dump(mode="json", by_alias=True)
    assert payload["orderTestId"] == 99
    assert payload["testCode"] == "CBC"
    assert "allowedActions" in payload

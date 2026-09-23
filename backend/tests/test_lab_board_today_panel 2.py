"""Lab board Today panel — average hours per workflow step."""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.schemas.enums import PaymentStatus, PriorityLevel, SampleStatus, TestStatus
from app.services.lab.board import LabBoardService


def _chainable_query(*, all_rows: list | None = None) -> MagicMock:
    mock = MagicMock()
    mock.filter.return_value = mock
    mock.join.return_value = mock
    mock.outerjoin.return_value = mock
    mock.all.return_value = all_rows or []
    return mock


def test_today_panel_step_averages_shape():
    db = MagicMock()
    service = LabBoardService(db)
    today_start = datetime(2026, 9, 22, tzinfo=UTC)

    db.query.return_value = _chainable_query(all_rows=[])

    with patch.object(service, "_utc_today_start", return_value=today_start):
        result = service._today_panel_snapshot()

    assert result["dayStartUtc"] == today_start.isoformat()
    assert len(result["steps"]) == 3
    assert {step["step"] for step in result["steps"]} == {
        "collection",
        "entry",
        "validation",
    }
    for step in result["steps"]:
        assert step["averageHours"] is None
        assert step["sampleCount"] == 0


def test_accumulate_step_durations_pending_collection_wait():
    service = LabBoardService(MagicMock())
    now = datetime(2026, 9, 22, 12, 0, tzinfo=UTC)
    order = Order(
        orderId=1,
        patientId=1,
        orderDate=now - timedelta(hours=2),
        totalPrice=10.0,
        paymentStatus=PaymentStatus.PAID,
    )
    order_test = OrderTest(
        id=1,
        orderId=1,
        testCode="T1",
        status=TestStatus.PENDING,
        priceAtOrder=10.0,
    )
    sums = {"collection": 0.0, "entry": 0.0, "validation": 0.0}
    counts = {"collection": 0, "entry": 0, "validation": 0}

    service._accumulate_today_step_durations(
        order_test=order_test,
        order=order,
        sample=None,
        now=now,
        sums=sums,
        counts=counts,
    )

    assert counts["collection"] == 1
    assert counts["entry"] == 0
    assert sums["collection"] == 2.0


def test_accumulate_step_durations_full_pipeline_segments():
    service = LabBoardService(MagicMock())
    now = datetime(2026, 9, 22, 12, 0, tzinfo=UTC)
    order = Order(
        orderId=1,
        patientId=1,
        orderDate=now - timedelta(hours=5),
        totalPrice=10.0,
        paymentStatus=PaymentStatus.PAID,
    )
    order_test = OrderTest(
        id=1,
        orderId=1,
        testCode="T1",
        status=TestStatus.RESULTED,
        priceAtOrder=10.0,
        resultEnteredAt=now - timedelta(hours=1),
    )
    sample = Sample(
        sampleId=1,
        orderId=1,
        status=SampleStatus.COLLECTED,
        testCodes=["T1"],
        requiredVolume=1.0,
        priority=PriorityLevel.MEDIUM,
        collectedAt=now - timedelta(hours=3),
        createdBy="1",
        updatedBy="1",
    )
    sums = {"collection": 0.0, "entry": 0.0, "validation": 0.0}
    counts = {"collection": 0, "entry": 0, "validation": 0}

    service._accumulate_today_step_durations(
        order_test=order_test,
        order=order,
        sample=sample,
        now=now,
        sums=sums,
        counts=counts,
    )

    assert counts == {"collection": 1, "entry": 1, "validation": 1}
    assert sums["collection"] == 2.0
    assert sums["entry"] == 2.0
    assert sums["validation"] == 1.0

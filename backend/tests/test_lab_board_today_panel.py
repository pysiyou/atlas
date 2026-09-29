"""Lab board Today panel — UTC day throughput KPIs."""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

from app.schemas.enums import TestStatus
from app.services.lab.board import LabBoardService


def _scalar_query(*, value: int) -> MagicMock:
    mock = MagicMock()
    mock.filter.return_value = mock
    mock.scalar.return_value = value
    return mock


def _status_group_query(*, rows: list) -> MagicMock:
    mock = MagicMock()
    mock.filter.return_value = mock
    mock.group_by.return_value = mock
    mock.all.return_value = rows
    return mock


def _distinct_subquery() -> MagicMock:
    mock = MagicMock()
    mock.filter.return_value = mock
    mock.distinct.return_value = mock
    return mock


def test_today_panel_kpi_shape_empty():
    db = MagicMock()
    service = LabBoardService(db)
    today_start = datetime(2026, 9, 22, tzinfo=UTC)

    db.query.side_effect = [
        _scalar_query(value=0),
        _scalar_query(value=0),
        _scalar_query(value=0),
        _scalar_query(value=0),
        _scalar_query(value=0),
        _scalar_query(value=0),
        _scalar_query(value=0),
        _distinct_subquery(),
        _distinct_subquery(),
        _status_group_query(rows=[]),
    ]

    with patch.object(service, "_utc_today_start", return_value=today_start):
        result = service._today_panel_snapshot()

    assert result["dayStartUtc"] == today_start
    assert result["testsUpdatedToday"] == 0
    assert result["testsWorkedCreatedToday"] == 0
    assert result["testsWorkedCreatedCompletedToday"] == 0
    assert result["specimensCollectedToday"] == 0
    assert result["testsResultedToday"] == 0
    assert result["testsValidatedToday"] == 0
    assert result["testsSentBackToday"] == 0
    assert result["statusCounts"] == []


def test_today_panel_kpi_counts_and_status_mix():
    db = MagicMock()
    service = LabBoardService(db)
    today_start = datetime(2026, 9, 22, tzinfo=UTC)

    db.query.side_effect = [
        _scalar_query(value=12),
        _scalar_query(value=8),
        _scalar_query(value=3),
        _scalar_query(value=5),
        _scalar_query(value=7),
        _scalar_query(value=4),
        _scalar_query(value=2),
        _distinct_subquery(),
        _distinct_subquery(),
        _status_group_query(
            rows=[
                (TestStatus.VALIDATED, 4),
                (TestStatus.PENDING, 3),
                (TestStatus.CANCELLED, 1),
            ]
        ),
    ]

    with patch.object(service, "_utc_today_start", return_value=today_start):
        result = service._today_panel_snapshot()

    assert result["testsUpdatedToday"] == 12
    assert result["testsWorkedCreatedToday"] == 8
    assert result["testsWorkedCreatedCompletedToday"] == 3
    assert result["specimensCollectedToday"] == 5
    assert result["testsResultedToday"] == 7
    assert result["testsValidatedToday"] == 4
    assert result["testsSentBackToday"] == 2
    assert result["statusCounts"] == [
        {"status": TestStatus.PENDING, "count": 3},
        {"status": TestStatus.VALIDATED, "count": 4},
        {"status": TestStatus.CANCELLED, "count": 1},
    ]

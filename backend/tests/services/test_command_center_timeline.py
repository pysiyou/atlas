"""
Command center timeline — ensures order-scoped events remain visible in the global feed.
"""
from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.schemas.enums import LabOperationType
from app.services.command_center_service import CommandCenterService


class TestCommandCenterTimeline(unittest.TestCase):
    @patch("app.services.command_center_service.datetime")
    def test_timeline_includes_order_status_change(self, mock_datetime) -> None:
        mock_datetime.now.return_value = MagicMock()
        mock_datetime.side_effect = __import__("datetime").datetime

        order_log = SimpleNamespace(
            id=1,
            operationType=LabOperationType.ORDER_STATUS_CHANGE,
            entityType="order",
            entityId=42,
            performedBy="system",
            performedAt=MagicMock(isoformat=lambda: "2026-01-01T00:00:00+00:00"),
            operationData={"trigger": "automatic"},
            beforeState={"status": "in-progress"},
            afterState={"status": "completed"},
            comment=None,
        )

        db = MagicMock()
        db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [
            order_log
        ]

        service = CommandCenterService(db)
        events = service.get_timeline_events(hours_back=24, limit=10, offset=0)

        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["type"], "order_status_change")
        self.assertEqual(events[0]["entityType"], "order")
        self.assertEqual(events[0]["entityId"], 42)


if __name__ == "__main__":
    unittest.main()

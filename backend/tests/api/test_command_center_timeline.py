"""
Command center timeline API — query parameter validation.
"""
from __future__ import annotations

import unittest
from unittest.mock import MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.command_center import router
from app.core.dependencies import require_lab_tech
from app.database import get_db


class TestCommandCenterTimelineApi(unittest.TestCase):
    def setUp(self) -> None:
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_db] = lambda: MagicMock()
        app.dependency_overrides[require_lab_tech] = lambda: MagicMock()
        self.client = TestClient(app)

    def test_timeline_rejects_limit_above_max(self) -> None:
        response = self.client.get("/command-center/timeline", params={"limit": 201})
        self.assertEqual(response.status_code, 422)

    def test_timeline_rejects_negative_offset(self) -> None:
        response = self.client.get("/command-center/timeline", params={"offset": -1})
        self.assertEqual(response.status_code, 422)

    def test_timeline_accepts_valid_params(self) -> None:
        with unittest.mock.patch(
            "app.api.v1.command_center.CommandCenterService"
        ) as service_cls:
            service = service_cls.return_value
            service.get_timeline_events.return_value = []
            service.get_timeline_count.return_value = 0

            response = self.client.get(
                "/command-center/timeline",
                params={"hours_back": 24, "limit": 50, "offset": 0},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"events": [], "total": 0})


if __name__ == "__main__":
    unittest.main()

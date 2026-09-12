"""Pytest fixtures for Atlas integration tests."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

USERS = {
    "admin": ("admin", "admin123"),
    "receptionist": ("receptionist", "recept123"),
    "labtech": ("labtech", "lab123"),
    "labtech_plus": ("labtech_plus", "labplus123"),
}


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


def _login(client: TestClient, username: str, password: str) -> dict[str, str]:
    r = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="session")
def admin_headers(client: TestClient) -> dict[str, str]:
    return _login(client, *USERS["admin"])


@pytest.fixture(scope="session")
def receptionist_headers(client: TestClient) -> dict[str, str]:
    return _login(client, *USERS["receptionist"])


@pytest.fixture(scope="session")
def labtech_headers(client: TestClient) -> dict[str, str]:
    return _login(client, *USERS["labtech"])


@pytest.fixture(scope="session")
def labtech_plus_headers(client: TestClient) -> dict[str, str]:
    return _login(client, *USERS["labtech_plus"])


@pytest.fixture(scope="session")
def refresh_token(client: TestClient) -> str:
    return client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"}).json()["refresh_token"]


@pytest.fixture(scope="session", autouse=True)
def cleanup_after_session():
    yield
    from tests.helpers.cleanup import cleanup_qa_data
    cleanup_qa_data()

import uuid
from fastapi.testclient import TestClient


class TestUsers:
    def test_crud(self, client: TestClient, admin_headers: dict):
        s = uuid.uuid4().hex[:6]
        c = client.post("/api/v1/users", json={"username": f"qa_{s}", "password": "pass12345", "name": "QA", "role": "receptionist", "email": f"qa_{s}@t.com"}, headers=admin_headers)
        assert c.status_code == 201
        uid = c.json()["id"]
        assert client.get(f"/api/v1/users/{uid}", headers=admin_headers).status_code == 200
        assert client.delete(f"/api/v1/users/{uid}", headers=admin_headers).status_code == 204

    def test_lookup(self, client: TestClient, admin_headers: dict):
        assert client.get("/api/v1/users/lookup", headers=admin_headers).status_code == 200


class TestAuditCommandCenter:
    def test_audit(self, client: TestClient):
        assert client.get("/api/v1/audit/logs/count").status_code == 200

    def test_timeline(self, client: TestClient, labtech_headers: dict):
        assert client.get("/api/v1/command-center/timeline", params={"limit": 50}, headers=labtech_headers).status_code == 200

    def test_timeline_validation(self, client: TestClient, labtech_headers: dict):
        assert client.get("/api/v1/command-center/timeline", params={"limit": 201}, headers=labtech_headers).status_code == 422

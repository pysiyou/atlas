from fastapi.testclient import TestClient


class TestAuth:
    def test_login_all_roles(self, client: TestClient):
        for user, pw, role in [
            ("admin", "admin123", "administrator"),
            ("receptionist", "recept123", "receptionist"),
            ("labtech", "lab123", "lab-technician"),
            ("labtech_plus", "labplus123", "lab-technician-plus"),
        ]:
            r = client.post("/api/v1/auth/login", json={"username": user, "password": pw})
            assert r.status_code == 200
            assert r.json()["role"] == role

    def test_login_invalid(self, client: TestClient):
        assert client.post("/api/v1/auth/login", json={"username": "x", "password": "y"}).status_code == 401

    def test_me(self, client: TestClient, admin_headers: dict):
        assert client.get("/api/v1/auth/me", headers=admin_headers).status_code == 200

    def test_me_unauth(self, client: TestClient):
        assert client.get("/api/v1/auth/me").status_code == 401

    def test_refresh(self, client: TestClient, refresh_token: str):
        assert client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token}).status_code == 200

    def test_logout(self, client: TestClient):
        assert client.post("/api/v1/auth/logout").status_code == 200

    def test_health(self, client: TestClient):
        assert client.get("/health").json()["status"] == "healthy"


class TestRoleGates:
    def test_audit_public(self, client: TestClient):
        assert client.get("/api/v1/audit/logs").status_code == 200

    def test_command_center_lab_only(self, client: TestClient, receptionist_headers: dict, labtech_headers: dict):
        assert client.get("/api/v1/command-center/timeline", headers=receptionist_headers).status_code == 403
        assert client.get("/api/v1/command-center/timeline", headers=labtech_headers).status_code == 200

    def test_recollection_supervisor_only(self, client: TestClient, labtech_headers: dict, labtech_plus_headers: dict):
        assert client.get("/api/v1/lab/recollection-requests/pending", headers=labtech_headers).status_code == 403
        assert client.get("/api/v1/lab/recollection-requests/pending", headers=labtech_plus_headers).status_code == 200

    def test_analyzer_requires_key(self, client: TestClient):
        assert client.post("/api/v1/analyzer/json", json={}).status_code == 401

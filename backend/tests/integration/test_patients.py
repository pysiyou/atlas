import uuid
from fastapi.testclient import TestClient
from tests.helpers.factories import PATIENT_PREFIX, make_patient_payload


class TestPatients:
    def test_list(self, client: TestClient, admin_headers: dict):
        assert client.get("/api/v1/patients", headers=admin_headers).status_code == 200

    def test_create_read_update_delete(self, client: TestClient, admin_headers: dict):
        s = uuid.uuid4().hex[:8]
        c = client.post("/api/v1/patients", json=make_patient_payload(s), headers=admin_headers)
        assert c.status_code == 201
        pid = c.json()["id"]
        assert client.get(f"/api/v1/patients/{pid}", headers=admin_headers).status_code == 200
        assert client.put(f"/api/v1/patients/{pid}", json={"fullName": f"{PATIENT_PREFIX} Updated"}, headers=admin_headers).status_code == 200
        assert client.delete(f"/api/v1/patients/{pid}", headers=admin_headers).status_code == 204

    def test_search(self, client: TestClient, admin_headers: dict):
        s = uuid.uuid4().hex[:8]
        client.post("/api/v1/patients", json=make_patient_payload(s), headers=admin_headers)
        r = client.get("/api/v1/patients/search", params={"q": PATIENT_PREFIX}, headers=admin_headers)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_affiliation(self, client: TestClient, admin_headers: dict):
        p = make_patient_payload(uuid.uuid4().hex[:8])
        p["affiliation"] = {"duration": 12}
        assert client.post("/api/v1/patients", json=p, headers=admin_headers).status_code == 201

    def test_invalid_phone(self, client: TestClient, admin_headers: dict):
        p = make_patient_payload("bad")
        p["phone"] = "!!!"
        assert client.post("/api/v1/patients", json=p, headers=admin_headers).status_code == 422

    def test_not_found(self, client: TestClient, admin_headers: dict):
        assert client.get("/api/v1/patients/999999999", headers=admin_headers).status_code == 404

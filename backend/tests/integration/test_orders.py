import uuid
from fastapi.testclient import TestClient
from tests.helpers.catalog import ALL_TEST_CODES
from tests.helpers.factories import create_order, create_patient, pay_order_full


class TestOrders:
    def test_list(self, client: TestClient, admin_headers: dict):
        assert client.get("/api/v1/orders", headers=admin_headers).status_code == 200

    def test_single_test(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        assert o["overallStatus"] == "ordered" and len(o["tests"]) == 1

    def test_multi_same_sample(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001", "HEM002", "HEM003"])
        assert len({t.get("sampleId") for t in o["tests"]}) == 1

    def test_multi_sample_types(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001", "URINE001", "PARA005"])
        assert len({t.get("sampleId") for t in o["tests"]}) >= 2

    def test_all_priorities(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        for pr in ("low", "medium", "high", "urgent"):
            assert create_order(client, admin_headers, p["id"], ["URINE001"], priority=pr)["priority"] == pr

    def test_invalid_test(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        assert client.post("/api/v1/orders", json={"patientId": p["id"], "tests": [{"testCode": "BAD"}]}, headers=admin_headers).status_code in (400, 404, 422)

    def test_add_test(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        r = client.put(f"/api/v1/orders/{o['orderId']}", json={"tests": [{"testCode": "HEM001"}, {"testCode": "HEM002"}]}, headers=admin_headers)
        assert r.status_code == 200

    def test_payments_include(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        pay_order_full(client, admin_headers, o)
        assert client.get(f"/api/v1/orders/{o['orderId']}", params={"include": "payments"}, headers=admin_headers).json()["paymentStatus"] == "paid"

    def test_delete_unpaid(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        assert client.delete(f"/api/v1/orders/{o['orderId']}", headers=admin_headers).status_code == 204

    def test_delete_paid_blocked(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        pay_order_full(client, admin_headers, o)
        assert client.delete(f"/api/v1/orders/{o['orderId']}", headers=admin_headers).status_code in (400, 409)


def test_all_87_catalog_codes_in_db(client: TestClient, admin_headers: dict):
    codes = {t["code"] for t in client.get("/api/v1/tests", headers=admin_headers).json()}
    for code in ALL_TEST_CODES:
        assert code in codes

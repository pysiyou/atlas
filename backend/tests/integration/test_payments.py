import uuid
from fastapi.testclient import TestClient
from tests.helpers.factories import collect_sample, create_order, create_patient, get_pending_sample, pay_order_full


class TestPayments:
    def test_list(self, client: TestClient, admin_headers: dict):
        assert client.get("/api/v1/payments", headers=admin_headers).status_code == 200

    def test_full_payment(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        pay_order_full(client, admin_headers, o)
        assert client.get(f"/api/v1/orders/{o['orderId']}", headers=admin_headers).json()["paymentStatus"] == "paid"

    def test_partial(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        client.post("/api/v1/payments", json={"orderId": o["orderId"], "amount": 1, "paymentMethod": "cash"}, headers=admin_headers)
        assert client.get(f"/api/v1/orders/{o['orderId']}", headers=admin_headers).json()["paymentStatus"] == "unpaid"

    def test_overpay(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        assert client.post("/api/v1/payments", json={"orderId": o["orderId"], "amount": o["totalPrice"] + 100, "paymentMethod": "cash"}, headers=admin_headers).status_code in (400, 409, 422)

    def test_collect_blocked_unpaid(self, client: TestClient, admin_headers: dict, labtech_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        s = get_pending_sample(client, labtech_headers, o["orderId"])
        assert collect_sample(client, labtech_headers, s["sampleId"]).status_code == 402

    def test_collect_after_pay(self, client: TestClient, admin_headers: dict, labtech_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        pay_order_full(client, admin_headers, o)
        s = get_pending_sample(client, labtech_headers, o["orderId"])
        assert collect_sample(client, labtech_headers, s["sampleId"]).status_code == 200

    def test_all_payment_methods(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        for m in ("cash", "credit-card", "debit-card", "insurance", "bank-transfer", "mobile-money"):
            o = create_order(client, admin_headers, p["id"], ["URINE001"])
            assert client.post("/api/v1/payments", json={"orderId": o["orderId"], "amount": o["totalPrice"], "paymentMethod": m}, headers=admin_headers).status_code == 201

    def test_by_order(self, client: TestClient, admin_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        pay_order_full(client, admin_headers, o)
        assert len(client.get(f"/api/v1/payments/order/{o['orderId']}", headers=admin_headers).json()) >= 1

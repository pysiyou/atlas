"""API factories for integration tests."""
from __future__ import annotations

import uuid
from typing import Any

from httpx import Client

from tests.helpers.catalog import get_test_by_code

PATIENT_PREFIX = "QA-FULL-COVERAGE"


def _digits(suffix: str, n: int = 7) -> str:
    d = "".join(str(ord(c) % 10) for c in suffix)
    return (d * 3)[:n]


def make_patient_payload(suffix: str | None = None) -> dict[str, Any]:
    suffix = suffix or uuid.uuid4().hex[:8]
    return {
        "fullName": f"{PATIENT_PREFIX} {suffix}",
        "dateOfBirth": "1990-05-15",
        "gender": "male",
        "phone": f"+1555{_digits(suffix)}",
        "email": f"qa.{suffix}@atlas.test",
        "height": 175,
        "weight": 70,
        "address": {"street": "123 Test St", "city": "Testville", "postalCode": "12345"},
        "emergencyContact": {
            "fullName": "Emergency Contact",
            "relationship": "spouse",
            "phone": "+15559876543",
        },
        "medicalHistory": {"chronicConditions": [], "allergies": []},
    }


def create_patient(client: Client, headers: dict[str, str], suffix: str | None = None) -> dict[str, Any]:
    resp = client.post("/api/v1/patients", json=make_patient_payload(suffix), headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def create_order(
    client: Client,
    headers: dict[str, str],
    patient_id: int,
    test_codes: list[str],
    priority: str = "medium",
) -> dict[str, Any]:
    resp = client.post(
        "/api/v1/orders",
        json={
            "patientId": patient_id,
            "tests": [{"testCode": c} for c in test_codes],
            "priority": priority,
            "clinicalNotes": "QA test",
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def pay_order_full(client: Client, headers: dict[str, str], order: dict[str, Any]) -> None:
    resp = client.post(
        "/api/v1/payments",
        json={"orderId": order["orderId"], "amount": order["totalPrice"], "paymentMethod": "cash"},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text


def collect_sample(client: Client, headers: dict[str, str], sample_id: int, sample_type: str = "blood"):
    ct, cc = ("cup", "red") if sample_type in ("urine", "stool", "sputum") else ("tube", "purple")
    return client.patch(
        f"/api/v1/samples/{sample_id}/collect",
        json={"collectedVolume": 5.0, "actualContainerType": ct, "actualContainerColor": cc},
        headers=headers,
    )


def get_pending_sample(client: Client, headers: dict[str, str], order_id: int) -> dict[str, Any]:
    resp = client.get("/api/v1/samples", params={"orderId": order_id}, headers=headers)
    items = resp.json()
    if isinstance(items, dict):
        items = items["items"]
    pending = [s for s in items if s.get("status") == "pending"]
    assert pending, f"No pending sample for order {order_id}"
    return pending[0]


def setup_collected(
    client: Client, admin_h: dict, lab_h: dict, test_code: str, suffix: str | None = None
) -> tuple[dict, dict, dict]:
    suffix = suffix or uuid.uuid4().hex[:6]
    patient = create_patient(client, admin_h, suffix)
    order = create_order(client, admin_h, patient["id"], [test_code])
    pay_order_full(client, admin_h, order)
    sample = get_pending_sample(client, lab_h, order["orderId"])
    st = get_test_by_code(test_code).get("mapped_sample_type", "blood")
    r = collect_sample(client, lab_h, sample["sampleId"], st)
    assert r.status_code == 200, r.text
    detail = client.get(f"/api/v1/orders/{order['orderId']}", headers=admin_h).json()
    ot = next(t for t in detail["tests"] if t["testCode"] == test_code)
    return detail, ot, sample


def enter_results(client: Client, headers: dict, order_test_id: int, results: dict):
    return client.post(
        f"/api/v1/results/order-tests/{order_test_id}",
        json={"results": results, "technicianNotes": "QA"},
        headers=headers,
    )


def validate_results(client: Client, headers: dict, order_test_id: int):
    return client.post(
        f"/api/v1/results/order-tests/{order_test_id}/validate",
        json={"decision": "approved"},
        headers=headers,
    )

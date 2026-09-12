import uuid
from fastapi.testclient import TestClient
from tests.helpers.catalog import normal_results_for_test, get_test_by_code
from tests.helpers.factories import collect_sample, create_order, create_patient, get_pending_sample, pay_order_full

ANALYZER_HEADERS = {"X-Analyzer-Key": "test-key"}


class TestAnalyzer:
    def test_json_ingest(self, client: TestClient, admin_headers: dict, labtech_headers: dict):
        p = create_patient(client, admin_headers, uuid.uuid4().hex[:6])
        o = create_order(client, admin_headers, p["id"], ["HEM001"])
        pay_order_full(client, admin_headers, o)
        s = get_pending_sample(client, labtech_headers, o["orderId"])
        collect_sample(client, labtech_headers, s["sampleId"])
        results = normal_results_for_test(get_test_by_code("HEM001"))
        r = client.post(
            "/api/v1/analyzer/json",
            json={"specimen_id": str(s["sampleId"]), "test_code": "HEM001", "results": results},
            headers=ANALYZER_HEADERS,
        )
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_pending_list(self, client: TestClient):
        assert client.get("/api/v1/analyzer/pending/analyzer-1", headers=ANALYZER_HEADERS).status_code == 200

    def test_invalid_test_code(self, client: TestClient):
        r = client.post(
            "/api/v1/analyzer/json",
            json={"specimen_id": "1", "test_code": "INVALID", "results": {}},
            headers=ANALYZER_HEADERS,
        )
        assert r.status_code in (200, 400, 404)
        if r.status_code == 200:
            assert r.json()["success"] is False

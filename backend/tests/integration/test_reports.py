import uuid
from fastapi.testclient import TestClient
from tests.helpers.catalog import normal_results_for_test, get_test_by_code
from tests.helpers.factories import enter_results, setup_collected, validate_results


class TestReports:
    def test_report_requires_completed(self, client: TestClient, admin_headers: dict, labtech_headers: dict):
        order, ot, _ = setup_collected(client, admin_headers, labtech_headers, "HEM001", uuid.uuid4().hex[:6])
        assert client.post(f"/api/v1/orders/{order['orderId']}/report", headers=admin_headers).status_code in (400, 422)
        enter_results(client, labtech_headers, ot["id"], normal_results_for_test(get_test_by_code("HEM001")))
        validate_results(client, labtech_headers, ot["id"])
        assert client.post(f"/api/v1/orders/{order['orderId']}/report", headers=admin_headers).status_code == 200

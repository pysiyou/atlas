import pytest
from fastapi.testclient import TestClient
from tests.helpers.catalog import ALL_TEST_CODES, get_test_by_code


class TestCatalogApi:
    def test_list_87(self, client: TestClient, admin_headers: dict):
        assert len(client.get("/api/v1/tests", headers=admin_headers).json()) == 87

    def test_search(self, client: TestClient, admin_headers: dict):
        assert client.get("/api/v1/tests/search", params={"q": "CBC"}, headers=admin_headers).status_code == 200

    def test_not_found(self, client: TestClient, admin_headers: dict):
        assert client.get("/api/v1/tests/NOPE", headers=admin_headers).status_code == 404

    def test_affiliation_pricing(self, client: TestClient, admin_headers: dict):
        d = {p["duration"] for p in client.get("/api/v1/affiliations/pricing", headers=admin_headers).json()}
        assert d == {6, 12, 24}


@pytest.mark.parametrize("code", ALL_TEST_CODES)
def test_each_catalog_test(code: str, client: TestClient, admin_headers: dict):
    r = client.get(f"/api/v1/tests/{code}", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["code"] == code
    assert len(get_test_by_code(code).get("result_items", [])) >= 1

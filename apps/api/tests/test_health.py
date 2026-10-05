from fastapi.testclient import TestClient

from rooftop_api import __version__, settings
from rooftop_api.main import app

client = TestClient(app)


def test_health_is_ok_and_names_the_version(monkeypatch):
    monkeypatch.delenv(settings.COMMIT, raising=False)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0", "commit": None}
    assert response.json()["version"] == __version__


def test_health_names_the_commit_the_server_was_built_from(monkeypatch):
    monkeypatch.setenv(settings.COMMIT, "8a4b246")

    assert client.get("/health").json()["commit"] == "8a4b246"


def test_health_is_in_the_openapi_document():
    document = app.openapi()

    assert document["info"]["version"] == __version__
    assert document["paths"]["/health"]["get"]["operationId"] == "getHealth"
    assert "Health" in document["components"]["schemas"]

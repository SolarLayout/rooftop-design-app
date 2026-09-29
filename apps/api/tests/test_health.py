from fastapi.testclient import TestClient

from rooftop_api import __version__
from rooftop_api.main import app

client = TestClient(app)


def test_health_is_ok_and_names_the_version():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0"}
    assert response.json()["version"] == __version__


def test_health_is_in_the_openapi_document():
    document = app.openapi()

    assert document["info"]["version"] == __version__
    assert document["paths"]["/health"]["get"]["operationId"] == "getHealth"
    assert "Health" in document["components"]["schemas"]

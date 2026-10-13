"""What the tests of the API share: a client, and the demo project as a request body."""

import copy
from typing import Any

import pytest
from fastapi.testclient import TestClient

from rooftop_api.main import app
from rooftop_core.io.pvsyst import decode_pvsyst
from tools.reference import REFERENCE_PAN


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def _demo(client: TestClient) -> dict[str, Any]:
    """The demo as the API hands it out, with the engine's reference module (tools/reference.py): the
    numbers the tests pin were taken with it. tests/api/test_demo.py holds the demo as it is bundled."""
    response = client.get("/demo")
    assert response.status_code == 200
    demo = response.json()
    demo["pan_path"], demo["pan_text"] = REFERENCE_PAN.name, decode_pvsyst(REFERENCE_PAN.read_bytes())
    return demo


@pytest.fixture
def demo(_demo: dict[str, Any]) -> dict[str, Any]:
    """The demo project as the API hands it out, with the reference module. A copy: a test may change it."""
    return copy.deepcopy(_demo)


@pytest.fixture
def light_demo(demo: dict[str, Any]) -> dict[str, Any]:
    """The demo without its weather, for requests that do not need it."""
    demo["weather_json"] = None
    return demo


def error_of(response) -> dict[str, Any]:
    """The error of an answer, after a look that it has the one shape."""
    body = response.json()
    assert list(body) == ["error"]
    assert list(body["error"]) == ["code", "message", "field"]
    return body["error"]

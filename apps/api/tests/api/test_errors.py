"""Every error leaves the API in one shape: {"error": {"code", "message", "field"}}."""

import logging

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

from rooftop_api.errors import ApiError, install_error_handlers
from rooftop_core.errors import (
    EngineError,
    MissingEquipmentFile,
    RoofTooLarge,
    UnsupportedProjectFormat,
    WeatherNotLoaded,
)


class Site(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class Body(BaseModel):
    name: str
    site: Site


def _app() -> FastAPI:
    app = FastAPI()
    install_error_handlers(app)

    @app.post("/echo")
    def echo(body: Body) -> Body:
        return body

    @app.get("/refused")
    def refused() -> None:
        raise ApiError(422, "not_a_pan_file", "notes.PAN: not a PVsyst module file", field="text")

    @app.get("/too-large")
    def too_large() -> None:
        raise ApiError(413, "file_too_large", "The file is larger than 5 MB.")

    @app.get("/engine/{kind}")
    def engine(kind: str) -> None:
        raise {
            "equipment": MissingEquipmentFile(
                "The module file Big.PAN (PAN) is not included.", field="pan_path"
            ),
            "weather": WeatherNotLoaded("This project has no weather yet.", field="weather_json"),
            "format": UnsupportedProjectFormat("This project file is format 3.", field="format"),
            "roof": RoofTooLarge(48_500.0, 30_000.0, field="roof.outline"),
            "other": EngineError("The engine could not do this."),
        }[kind]

    @app.get("/broken")
    def broken() -> None:
        raise RuntimeError("secret detail of the server")

    return app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(_app(), raise_server_exceptions=False)


def test_an_api_error_keeps_its_status_code_message_and_field(client):
    response = client.get("/refused")

    assert response.status_code == 422
    assert response.json() == {
        "error": {"code": "not_a_pan_file", "message": "notes.PAN: not a PVsyst module file", "field": "text"}
    }


def test_an_error_without_a_field_says_null(client):
    response = client.get("/too-large")

    assert response.status_code == 413
    assert response.json() == {
        "error": {"code": "file_too_large", "message": "The file is larger than 5 MB.", "field": None}
    }


def test_a_value_out_of_range_names_its_field_by_its_path(client):
    response = client.post("/echo", json={"name": "roof", "site": {"lat": 91, "lon": 73.86}})

    assert response.status_code == 422
    assert response.json() == {
        "error": {
            "code": "invalid_request",
            "message": "site.lat: Input should be less than or equal to 90",
            "field": "site.lat",
        }
    }


def test_several_faults_report_the_first_and_count_the_rest(client):
    response = client.post("/echo", json={"site": {"lat": 91, "lon": 181}})

    error = response.json()["error"]
    assert response.status_code == 422
    assert error["field"] == "name"
    assert error["message"] == "name: Field required. 2 more values are refused"


def test_a_body_that_is_not_json_is_refused_in_the_same_shape(client):
    response = client.post("/echo", content=b"{not json", headers={"content-type": "application/json"})

    error = response.json()["error"]
    assert response.status_code == 422
    assert error["code"] == "invalid_request"
    assert error["field"] is None
    assert error["message"].startswith("The server cannot read what the app sent")


@pytest.mark.parametrize(
    ("kind", "code", "field"),
    [
        ("equipment", "equipment_file_missing", "pan_path"),
        ("weather", "weather_not_loaded", "weather_json"),
        ("format", "unsupported_project_format", "format"),
        ("roof", "roof_too_large", "roof.outline"),
        ("other", "engine_error", None),
    ],
)
def test_an_engine_error_passes_its_message_and_field_through(client, kind, code, field):
    response = client.get(f"/engine/{kind}")

    error = response.json()["error"]
    assert response.status_code == 422
    assert (error["code"], error["field"]) == (code, field)
    assert error["message"] in {
        "The module file Big.PAN (PAN) is not included.",
        "This project has no weather yet.",
        "This project file is format 3.",
        "This outline covers 48,500 m². SolarLayout designs one roof at a time, up to 30,000 m² "
        "(about 3 MWp). For a larger site, outline each building as its own design.",
        "The engine could not do this.",
    }


def test_a_path_that_does_not_exist_is_a_404_in_the_same_shape(client):
    response = client.get("/nowhere")

    assert response.status_code == 404
    assert response.json() == {"error": {"code": "not_found", "message": "Not Found", "field": None}}


def test_a_method_that_is_not_allowed_is_a_405_in_the_same_shape(client):
    response = client.get("/echo")

    assert response.status_code == 405
    assert response.json()["error"]["code"] == "method_not_allowed"


def test_a_fault_of_the_server_is_a_500_that_tells_no_detail_and_is_logged(client, caplog):
    with caplog.at_level(logging.ERROR, logger="rooftop_api"):
        response = client.get("/broken")

    assert response.status_code == 500
    assert response.json() == {
        "error": {
            "code": "internal_error",
            "message": "The server could not finish this step. Try again.",
            "field": None,
        }
    }
    assert "secret detail" not in response.text
    assert "secret detail of the server" in caplog.text

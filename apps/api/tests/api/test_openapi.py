"""The OpenAPI document is what the web app's types are generated from."""

import pytest

from rooftop_api.main import app

OPERATIONS = {
    ("get", "/health"): "getHealth",
    ("get", "/demo"): "getDemo",
    ("post", "/equipment/module"): "parseModule",
    ("post", "/equipment/inverter"): "parseInverter",
    ("post", "/roof/import"): "importRoof",
    ("post", "/layout"): "computeLayout",
    ("post", "/sun"): "computeSun",
    ("post", "/weather"): "loadWeather",
    ("post", "/design"): "runDesign",
    ("post", "/export/{kind}"): "exportDesign",
}


@pytest.fixture(scope="module")
def document() -> dict:
    return app.openapi()


def test_every_route_has_its_operation_id(document):
    found = {
        (method, path): operation["operationId"]
        for path, methods in document["paths"].items()
        for method, operation in methods.items()
    }

    assert found == OPERATIONS


def test_every_route_that_takes_a_body_answers_faults_in_the_one_shape(document):
    for (method, path), name in OPERATIONS.items():
        if method == "post":
            answer = document["paths"][path][method]["responses"]["422"]
            assert answer["content"]["application/json"]["schema"] == {
                "$ref": "#/components/schemas/ErrorResponse"
            }, name


def test_the_default_error_shape_of_fastapi_is_gone(document):
    assert "HTTPValidationError" not in document["components"]["schemas"]
    assert "ValidationError" not in document["components"]["schemas"]


def test_the_system_voltage_has_three_choices_and_no_default(document):
    voltage = document["components"]["schemas"]["Project"]["properties"]["system_voltage"]

    assert {"enum": [600, 1000, 1500], "type": "integer"}.items() <= voltage["anyOf"][0].items()
    assert voltage["anyOf"][1] == {"type": "null"}
    assert "default" not in voltage


def test_a_point_is_a_pair_of_numbers(document):
    outline = document["components"]["schemas"]["Roof"]["properties"]["outline"]

    assert outline["items"]["prefixItems"] == [{"type": "number"}, {"type": "number"}]
    assert (outline["items"]["minItems"], outline["items"]["maxItems"]) == (2, 2)


def test_the_weather_route_says_that_a_service_elsewhere_can_fail(document):
    answer = document["paths"]["/weather"]["post"]["responses"]["502"]

    assert answer["content"]["application/json"]["schema"] == {"$ref": "#/components/schemas/ErrorResponse"}


def test_the_design_run_is_a_stream_of_three_kinds_of_events(document):
    answer = document["paths"]["/design"]["post"]["responses"]["200"]["content"]

    assert list(answer) == ["text/event-stream"]
    data = answer["text/event-stream"]["itemSchema"]["properties"]["data"]
    assert data["contentMediaType"] == "application/json"
    assert data["contentSchema"]["discriminator"]["mapping"] == {
        "progress": "#/components/schemas/DesignProgress",
        "result": "#/components/schemas/DesignDone",
        "error": "#/components/schemas/DesignFailed",
    }
    assert "DesignResult" in document["components"]["schemas"]


def test_the_result_of_a_design_run_has_no_hours(document):
    assert "hourly" not in document["components"]["schemas"]["Energy"]["properties"]


def test_an_export_is_a_file_of_one_of_five_types(document):
    operation = document["paths"]["/export/{kind}"]["post"]

    assert operation["parameters"][0]["schema"]["enum"] == ["pdf", "dxf", "kmz", "csv", "sld"]
    assert operation["responses"]["200"]["content"] == {
        media_type: {"schema": {"type": "string", "format": "binary"}}
        for media_type in (
            "application/pdf",
            "image/vnd.dxf",
            "application/vnd.google-earth.kmz",
            "text/csv",
            "image/png",
        )
    }

"""The OpenAPI document is what the web app's types are generated from."""

import pytest

from rooftop_api.main import app

OPERATIONS = {
    ("get", "/health"): "getHealth",
    ("get", "/demo"): "getDemo",
    ("post", "/equipment/module"): "parseModule",
    ("post", "/equipment/inverter"): "parseInverter",
    ("post", "/roof/import"): "importRoof",
    ("post", "/roof/from-map"): "roofFromMap",
    ("post", "/roof/on-map"): "roofOnMap",
    ("post", "/layout"): "computeLayout",
    ("post", "/sun"): "computeSun",
    ("post", "/weather"): "loadWeather",
    ("post", "/design"): "runDesign",
    ("post", "/export/{kind}"): "exportDesign",
    ("post", "/export/report-pages"): "reportPages",
    ("post", "/project/open"): "openProject",
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


TAKE_AN_OUTLINE = (
    "/roof/import",
    "/roof/from-map",
    "/roof/on-map",
    "/layout",
    "/sun",
    "/design",
    "/export/{kind}",
    "/export/report-pages",
    "/project/open",
)


@pytest.mark.parametrize("path", TAKE_AN_OUTLINE)
def test_every_route_that_takes_an_outline_says_that_a_roof_over_the_limit_is_refused(document, path):
    description = document["paths"][path]["post"]["responses"]["422"]["description"]

    assert "roof_too_large" in description
    assert "30,000 m²" in description


@pytest.mark.parametrize("path", ["/equipment/module", "/equipment/inverter", "/weather"])
def test_a_route_without_an_outline_does_not_say_so(document, path):
    assert "roof_too_large" not in document["paths"][path]["post"]["responses"]["422"]["description"]


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


def test_an_export_is_a_file_of_one_of_seven_types(document):
    operation = document["paths"]["/export/{kind}"]["post"]

    assert operation["parameters"][0]["schema"]["enum"] == ["pdf", "dxf", "kmz", "csv", "sld", "rtd", "zip"]
    assert operation["responses"]["200"]["content"] == {
        media_type: {"schema": {"type": "string", "format": "binary"}}
        for media_type in (
            "application/pdf",
            "image/vnd.dxf",
            "application/vnd.google-earth.kmz",
            "text/csv",
            "image/png",
            "application/json",
            "application/zip",
        )
    }


def test_the_pages_of_the_report_are_json_with_a_png_in_each(document):
    operation = document["paths"]["/export/report-pages"]["post"]
    schemas = document["components"]["schemas"]

    assert operation["parameters"][0]["name"] == "day"
    assert operation["responses"]["200"]["content"] == {
        "application/json": {"schema": {"$ref": "#/components/schemas/ReportPages"}}
    }
    assert list(schemas["ReportPages"]["properties"]) == ["day", "dpi", "pages"]
    assert schemas["ReportPages"]["properties"]["day"]["format"] == "date"
    assert list(schemas["ReportPage"]["properties"]) == ["number", "title", "width", "height", "png"]
    assert schemas["ReportPage"]["properties"]["png"]["type"] == "string"

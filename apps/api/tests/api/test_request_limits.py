"""What a project may carry is set so that the largest one the API accepts still fits one request to the
deployed API, whose Lambda Function URL takes 6,291,456 bytes at most (#98, #162): to run it, and its project
file to open it."""

import json

from rooftop_api import schemas
from tests.api.conftest import error_of

LAMBDA_REQUEST_BYTES = 6_291_456  # AWS's limit, not ours: these tests hold ours under it

CSV_ROW = "2025-01-01T00:00:00+00:00,812.25,640.50,180.75,31.25,3.50,45.50,1008.20,0.21,0.00,12.50\n"


def text_of(total: int, line: str) -> str:
    """*total* characters of *line* over and over, the last one cut: a file of lines, as a CSV or a PAN is."""
    return (line * (total // len(line) + 1))[:total]


def largest(project: dict) -> dict:
    """The project with the largest CSV weather, module and inverter files the API takes, and its weather."""
    pan, ond = project["pan_text"], project["ond_text"]
    project.update(
        weather_source="csv",
        weather_csv="a-year.csv",
        weather_csv_text=text_of(schemas.MAX_CSV_TEXT, CSV_ROW),
        pan_text=pan + text_of(schemas.MAX_EQUIPMENT_TEXT - len(pan), "\n"),
        ond_text=ond + text_of(schemas.MAX_EQUIPMENT_TEXT - len(ond), "\n"),
    )
    return project


def bytes_sent(body: dict) -> int:
    """The bytes of a request's JSON in UTF-8, as the web sends it."""
    return len(json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode())


def test_the_largest_project_the_api_takes_fits_one_request_to_run_it(demo):
    project = largest(demo)

    assert schemas.Project.model_validate(project)
    assert bytes_sent(project) <= LAMBDA_REQUEST_BYTES


def test_its_project_file_fits_one_request_to_open_it(client, demo):
    written = client.post("/export/rtd", json=largest(demo))
    assert written.status_code == 200

    assert len(written.text) <= schemas.MAX_PROJECT_TEXT
    assert bytes_sent({"name": "a-roof.rtd", "text": written.text}) <= LAMBDA_REQUEST_BYTES


def test_a_weather_csv_over_the_limit_is_refused(client):
    request = {"source": "csv", "lat": 18.52, "lon": 73.86, "csv_name": "big.csv"}
    request["csv_text"] = text_of(schemas.MAX_CSV_TEXT + 1, CSV_ROW)

    response = client.post("/weather", json=request)

    assert response.status_code == 422
    assert error_of(response)["field"] == "csv_text"


def test_a_module_file_over_the_limit_is_refused(client):
    too_long = "x" * (schemas.MAX_EQUIPMENT_TEXT + 1)

    response = client.post("/equipment/module", json={"name": "big.PAN", "text": too_long})

    assert response.status_code == 422
    assert error_of(response)["field"] == "text"


def test_a_project_with_files_over_the_limits_is_refused(client, demo):
    demo["ond_text"] = "x" * (schemas.MAX_EQUIPMENT_TEXT + 1)

    response = client.post("/export/rtd", json=demo)

    assert response.status_code == 422
    assert error_of(response)["field"] == "ond_text"

"""POST /project/open: a project file (.rtd) read by the engine's own reader, with its notes on the files
that must be chosen again, and refused in words when it is no project file."""

import json

import pytest

from rooftop_api import convert, schemas
from rooftop_api.main import app
from rooftop_core.project import FORMAT_VERSION
from tests.api.conftest import error_of

NOT_A_PROJECT_FILE = "The file is not a project file (.rtd): "
PAN_NOTE = "The module file Test.PAN (PAN) is not included in this project. Choose it again."
OND_NOTE = "The inverter file Test-S.ond (OND) is not included in this project. Choose it again."
CSV_NOTE = "The CSV weather file pune-2023.csv is not included in this project. Choose it again."


def _open(client, text: str, name: str = "Pune-demo.rtd"):
    return client.post("/project/open", json={"name": name, "text": text})


def _written(request: dict) -> dict:
    """The request as a .rtd file holds it: written by the engine's one writer, read back as JSON."""
    return json.loads(convert.project_to_engine(schemas.Project.model_validate(request)).to_text())


@pytest.fixture
def format_1(demo) -> dict:
    """The demo as the desktop app wrote it before format 2: the PAN and the OND named by their paths on
    that machine, one of them written on Windows, and no text of either."""
    written = _written(demo)
    written["format"] = 1
    written.update(
        pan_path="C:\\PVsyst\\Test.PAN", pan_text="", ond_path="/home/arun/Test-S.ond", ond_text=""
    )
    return written


# ── a file that opens ────────────────────────────────────────────────────────
def test_a_format_2_file_opens_to_the_project_that_was_exported_with_no_notes(client, demo):
    exported = client.post("/export/rtd", json=demo)
    assert exported.status_code == 200

    response = _open(client, exported.text)

    assert response.status_code == 200
    opened = response.json()
    assert list(opened) == ["project", "notes"]
    assert opened["notes"] == []
    assert opened["project"] == demo


def test_a_format_1_file_opens_with_a_note_for_the_pan_and_the_ond_to_choose_again(client, format_1):
    response = _open(client, json.dumps(format_1))

    assert response.status_code == 200
    opened = response.json()
    assert opened["notes"] == [PAN_NOTE, OND_NOTE]
    project = opened["project"]
    assert project["format"] == FORMAT_VERSION
    assert (project["pan_path"], project["pan_text"]) == ("C:\\PVsyst\\Test.PAN", "")
    assert (project["ond_path"], project["ond_text"]) == ("/home/arun/Test-S.ond", "")
    assert project["roof"] == format_1["roof"]
    assert project["name"] == format_1["name"]


def test_a_format_1_file_with_a_csv_weather_by_path_adds_a_note_for_it(client, format_1):
    format_1.update(weather_source="csv", weather_csv="/home/arun/weather/pune-2023.csv", weather_csv_text="")

    response = _open(client, json.dumps(format_1))

    assert response.status_code == 200
    assert response.json()["notes"] == [PAN_NOTE, OND_NOTE, CSV_NOTE]


def test_a_csv_named_by_a_project_that_takes_its_weather_elsewhere_is_not_asked_for(client, format_1):
    format_1.update(
        weather_source="pvgis", weather_csv="/home/arun/weather/pune-2023.csv", weather_csv_text=""
    )

    response = _open(client, json.dumps(format_1))

    assert response.status_code == 200
    assert response.json()["notes"] == [PAN_NOTE, OND_NOTE]


def test_a_file_whose_equipment_is_embedded_has_no_notes_whatever_its_format(client, format_1, demo):
    format_1.update(pan_text=demo["pan_text"], ond_text=demo["ond_text"])

    response = _open(client, json.dumps(format_1))

    assert response.status_code == 200
    assert response.json()["notes"] == []


# ── a file that is refused ───────────────────────────────────────────────────
def test_a_format_this_version_does_not_read_is_refused_in_the_engines_words(client, demo):
    written = _written(demo)
    written["format"] = 3

    response = _open(client, json.dumps(written))

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "unsupported_project_format",
        "message": "This project file is format 3. This version reads formats 1 and 2. "
        "Open it with a newer version of the app.",
        "field": "format",
    }


def test_a_text_that_is_not_json_is_refused(client):
    response = _open(client, "PVObject_=pvModule\n  Version=7.2\n", name="notes.PAN")

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "project_file_unreadable",
        "message": NOT_A_PROJECT_FILE + "it is not JSON.",
        "field": "text",
    }


def test_a_json_that_is_not_an_object_is_refused(client):
    response = _open(client, "[1, 2, 3]")

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "project_file_unreadable",
        "message": NOT_A_PROJECT_FILE + "its JSON is not an object.",
        "field": "text",
    }


def test_a_json_without_a_roof_is_refused_naming_what_is_missing(client):
    response = _open(client, json.dumps({"name": "Pune demo", "array": {}}))

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "project_file_unreadable",
        "message": NOT_A_PROJECT_FILE + "it has no roof.",
        "field": "text",
    }


def test_a_json_whose_roof_cannot_be_read_is_refused(client):
    response = _open(client, json.dumps({"roof": {"outline": [[0, 0], [10, 0], [10, 5]]}}))

    assert response.status_code == 422
    error = error_of(response)
    assert (error["code"], error["field"]) == ("project_file_unreadable", "text")
    assert error["message"].startswith(NOT_A_PROJECT_FILE + "it cannot be read as one (")


def test_a_value_a_request_would_not_accept_is_refused_as_a_request_is(client, demo):
    written = _written(demo)
    written["roof"]["lat"] = 95.0

    response = _open(client, json.dumps(written))

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "project_file_unreadable",
        "message": "The project file cannot be opened: roof.lat: Input should be less than or equal to 90",
        "field": "roof.lat",
    }


def test_a_text_larger_than_a_project_file_can_be_is_refused_before_it_is_read(client):
    response = _open(client, "x" * (schemas.MAX_PROJECT_TEXT + 1))

    assert response.status_code == 422
    error = error_of(response)
    assert (error["code"], error["field"]) == ("invalid_request", "text")


# ── the document ─────────────────────────────────────────────────────────────
def test_the_openapi_document_lists_open_project_with_its_two_shapes():
    document = app.openapi()
    operation = document["paths"]["/project/open"]["post"]

    assert operation["operationId"] == "openProject"
    assert operation["requestBody"]["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/ProjectFile"
    }
    assert operation["responses"]["200"]["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/OpenedProject"
    }
    shapes = document["components"]["schemas"]
    assert list(shapes["ProjectFile"]["properties"]) == ["name", "text"]
    assert shapes["ProjectFile"]["properties"]["text"]["maxLength"] == schemas.MAX_PROJECT_TEXT
    assert list(shapes["OpenedProject"]["properties"]) == ["project", "notes"]
    assert shapes["OpenedProject"]["properties"]["project"]["$ref"] == "#/components/schemas/Project"

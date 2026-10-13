"""GET /demo: the Pune demo project, whole, as a format 2 project."""

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from rooftop_api.main import app
from rooftop_core.io.pvsyst import decode_pvsyst
from rooftop_core.project import Design, Project
from rooftop_core.resources import sample_path


@pytest.fixture(scope="module")
def bundled(client: TestClient) -> dict[str, Any]:
    """The demo exactly as GET /demo hands it out, with its bundled module (the shared fixture ``demo``
    carries the engine's reference module instead: tests/api/conftest.py)."""
    response = client.get("/demo")
    assert response.status_code == 200
    return response.json()


def test_the_demo_is_the_pune_roof_at_1500_v(demo):
    assert demo["format"] == 2
    assert demo["name"] == "Pune demo roof"
    assert demo["place_name"] == "Pune"
    assert demo["system_voltage"] == 1500
    assert (demo["roof"]["lat"], demo["roof"]["lon"]) == (18.52, 73.86)
    assert demo["roof"]["outline"] == [[90.0, 0.0], [90.0, 40.0], [0.0, 40.0], [0.0, 0.0]]
    assert [o["name"] for o in demo["roof"]["obstacles"]] == [
        "Stair room",
        "Water tank",
        "AC unit 1",
        "AC unit 2",
        "AC unit 3",
        "AC unit 4",
    ]
    assert demo["roof_input"] == {
        "mode": "rect",
        "length": 90.0,
        "width": 40.0,
        "facing": 180.0,
        "file": "",
        "dxf_units": "m",
    }


def test_the_weather_is_embedded(demo):
    weather = demo["weather_json"]

    assert (weather["source"], weather["label"]) == ("pvgis", "PVGIS TMY")
    assert all(len(weather[name]) == 8760 for name in ("time", "ghi", "dni", "dhi", "temp_air", "wind_speed"))
    assert abs(sum(weather["ghi"]) / 1000 - 1822.9) < 0.05
    assert max(elevation for _, elevation in weather["horizon"]) == 2.7


def test_the_equipment_is_embedded_under_the_names_of_its_files(bundled):
    assert bundled["pan_path"] == "waaree-bin-08-580.PAN"
    assert bundled["ond_path"] == "wattpower-wp-330ktl-h1.OND"
    assert bundled["pan_text"] == decode_pvsyst(Path(sample_path(bundled["pan_path"])).read_bytes())
    assert bundled["ond_text"] == decode_pvsyst(Path(sample_path(bundled["ond_path"])).read_bytes())


def test_the_demo_shows_its_equipment_by_its_real_names(client, bundled):
    """Decisions D24 and D117."""
    pan = {"name": bundled["pan_path"], "text": bundled["pan_text"]}
    ond = {"name": bundled["ond_path"], "text": bundled["ond_text"]}
    module = client.post("/equipment/module", json=pan)
    inverter = client.post("/equipment/inverter", json=ond)

    module, inverter = module.json()["module"], inverter.json()["inverter"]
    assert (module["manufacturer"], module["model"]) == ("Waaree Energies Ltd.", "BiN-08-580")
    assert (inverter["manufacturer"], inverter["model"]) == ("WattPower Systems Pvt.Ltd", "WP-330KTL-H1")
    assert "Test" not in bundled["pan_text"] + bundled["ond_text"]


def test_nothing_is_chosen_beyond_what_the_desktop_demo_chose(demo):
    assert demo["chosen_option"] == ""
    assert demo["custom"] is None
    assert demo["t_min_override"] is None and demo["t_max_override"] is None
    assert demo["imax_mppt_override"] is None and demo["cell_rise_c"] is None


def test_the_engine_opens_what_the_api_hands_out(bundled):
    design = Design(Project.from_json(bundled), local_files=False)

    assert design.module.pnom_w == 580 and design.inverter.pnom_kw == 275
    assert design.generate_layout().n_modules == 790
    assert len(design.load_weather().data) == 8760


def test_two_requests_give_the_same_project(client):
    assert client.get("/demo").content == client.get("/demo").content


def test_the_demo_is_in_the_openapi_document():
    operation = app.openapi()["paths"]["/demo"]["get"]

    assert operation["operationId"] == "getDemo"
    assert operation["responses"]["200"]["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/Project"
    }

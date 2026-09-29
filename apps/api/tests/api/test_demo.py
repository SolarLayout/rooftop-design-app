"""GET /demo: the Pune demo project, whole, as a format 2 project."""

from pathlib import Path

from rooftop_api.main import app
from rooftop_core.project import Design, Project
from rooftop_core.resources import sample_path


def test_the_demo_is_the_pune_roof_at_1500_v(demo):
    assert demo["format"] == 2
    assert demo["name"] == "Pune demo roof"
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


def test_the_sample_equipment_is_embedded_under_its_name(demo):
    assert (demo["pan_path"], demo["ond_path"]) == ("Test.PAN", "Test-S.ond")
    assert demo["pan_text"] == Path(sample_path("Test.PAN")).read_bytes().decode("utf-8")
    assert demo["ond_text"] == Path(sample_path("Test-S.ond")).read_bytes().decode("utf-8")


def test_nothing_is_chosen_beyond_what_the_desktop_demo_chose(demo):
    assert demo["chosen_option"] == ""
    assert demo["custom"] is None
    assert demo["t_min_override"] is None and demo["t_max_override"] is None
    assert demo["imax_mppt_override"] is None and demo["cell_rise_c"] is None


def test_the_engine_opens_what_the_api_hands_out(demo):
    design = Design(Project.from_json(demo), local_files=False)

    assert design.module.pnom_w == 560 and design.inverter.pnom_kw == 275
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

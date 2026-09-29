"""POST /sun: where the sun stands through a day, and the shadows on the roof at one hour."""

import pytest
from shapely.geometry import Polygon
from shapely.ops import unary_union

from rooftop_core.demo import demo_roof
from rooftop_core.geometry import casters_shadow, sun_solar_time
from tests.api.conftest import error_of

PUNE = {"lat": 18.52, "lon": 73.86}


def _area(polygons: list[dict]) -> float:
    return unary_union([Polygon(p["exterior"], p["holes"]) for p in polygons]).area


def test_pune_at_16h_on_the_design_day(client):
    response = client.post("/sun", json={**PUNE, "day": "design_day", "hours": [16.0]})

    assert response.status_code == 200
    body = response.json()
    assert body["day_of_year"] == 355
    (position,) = body["positions"]
    assert position["hour"] == 16.0
    assert position["elevation_deg"] == pytest.approx(18.0, abs=0.2)
    assert position["azimuth_deg"] == pytest.approx(236.6, abs=0.3)
    assert body["shadows"] is None


def test_the_positions_are_those_of_the_engine(client):
    hours = [9.0, 12.0, 15.75]

    positions = client.post("/sun", json={**PUNE, "day": 172, "hours": hours}).json()["positions"]

    assert [(p["hour"], p["elevation_deg"], p["azimuth_deg"]) for p in positions] == [
        (hour, *sun_solar_time(18.52, 172, hour)) for hour in hours
    ]


def test_sunrise_and_sunset_in_solar_time(client):
    body = client.post("/sun", json={**PUNE, "day": "design_day", "hours": [12.0]}).json()

    assert body["sunrise_h"] == pytest.approx(6.557, abs=0.005)
    assert body["sunset_h"] == pytest.approx(17.443, abs=0.005)


@pytest.mark.parametrize(("lat", "day"), [(18.52, 355), (0.0, 355), (-33.87, 172)])
def test_the_design_day_is_the_winter_solstice_of_the_hemisphere(client, lat, day):
    body = client.post("/sun", json={"lat": lat, "lon": 73.86, "day": "design_day", "hours": [12.0]}).json()

    assert body["day_of_year"] == day


def test_a_step_gives_the_day_from_midnight_to_midnight(client):
    body = client.post("/sun", json={**PUNE, "day": 80, "step_h": 0.25}).json()

    hours = [p["hour"] for p in body["positions"]]
    assert len(hours) == 97 and hours[0] == 0.0 and hours[1] == 0.25 and hours[-1] == 24.0
    up = [p["hour"] for p in body["positions"] if p["elevation_deg"] > 0]
    assert up[0] >= body["sunrise_h"] and up[-1] <= body["sunset_h"]


def test_where_the_sun_does_not_set_there_is_no_sunrise(client):
    body = client.post("/sun", json={"lat": 78.0, "lon": 15.0, "day": 172, "hours": [0.0]}).json()

    assert body["sunrise_h"] is None and body["sunset_h"] is None
    assert body["positions"][0]["elevation_deg"] > 0


@pytest.mark.parametrize("hours", [{}, {"hours": [12.0], "step_h": 1.0}])
def test_the_hours_are_asked_for_in_one_way(client, hours):
    response = client.post("/sun", json={**PUNE, "day": 80, **hours})

    assert response.status_code == 422
    assert "give either the hours or a step" in error_of(response)["message"]


@pytest.mark.parametrize(
    ("change", "field"),
    [({"lat": 91}, "lat"), ({"day": 0}, "day"), ({"day": "tomorrow"}, "day"), ({"hours": [25.0]}, "hours.0")],
)
def test_values_out_of_range_are_refused_by_their_field(client, change, field):
    response = client.post("/sun", json={**PUNE, "day": 80, "hours": [12.0], **change})

    assert response.status_code == 422
    assert error_of(response)["field"].startswith(field)


# ── shadows ──────────────────────────────────────────────────────────────────
def test_shadows_of_the_demo_at_the_end_of_the_window(client, light_demo):
    request = {**PUNE, "day": "design_day", "hours": [16.0], "shadows": {"project": light_demo, "hour": 16.0}}

    response = client.post("/sun", json=request)

    assert response.status_code == 200
    shadows = response.json()["shadows"]
    elevation, azimuth = sun_solar_time(18.52, 355, 16.0)
    assert (shadows["hour"], shadows["plane_height_m"]) == (16.0, 0.0)
    assert (shadows["elevation_deg"], shadows["azimuth_deg"]) == (elevation, azimuth)
    expected = casters_shadow(demo_roof().all_casters(), 0.0, elevation, azimuth)
    assert _area(shadows["polygons"]) == pytest.approx(expected.area, abs=1e-3)


def test_shadows_are_shorter_on_a_plane_above_the_roof(client, light_demo):
    def shadows_at(height: float) -> float:
        request = {
            **PUNE,
            "day": "design_day",
            "hours": [16.0],
            "shadows": {"project": light_demo, "hour": 16.0, "plane_height_m": height},
        }
        return _area(client.post("/sun", json=request).json()["shadows"]["polygons"])

    assert shadows_at(0.5) < shadows_at(0.0)


def test_there_are_no_shadows_while_the_sun_is_down(client, light_demo):
    request = {**PUNE, "day": "design_day", "hours": [3.0], "shadows": {"project": light_demo, "hour": 3.0}}

    shadows = client.post("/sun", json=request).json()["shadows"]

    assert shadows["elevation_deg"] < 0
    assert shadows["polygons"] == []


def test_a_roof_without_parapet_and_obstacles_casts_no_shadow(client, light_demo):
    light_demo["roof"].update(parapet_h=0.0, obstacles=[])
    request = {**PUNE, "day": "design_day", "hours": [16.0], "shadows": {"project": light_demo, "hour": 16.0}}

    assert client.post("/sun", json=request).json()["shadows"]["polygons"] == []


def test_shadows_need_no_equipment(client, light_demo):
    light_demo.update(pan_path="/nowhere/Big.PAN", pan_text="", ond_path="/nowhere/Inv.ond", ond_text="")
    request = {**PUNE, "day": "design_day", "hours": [16.0], "shadows": {"project": light_demo, "hour": 16.0}}

    assert client.post("/sun", json=request).status_code == 200

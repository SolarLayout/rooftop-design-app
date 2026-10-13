"""POST /roof/from-map: a roof outlined on the map, in WGS84, to a project in local
metres. The projection is the engine's (rooftop_core.geo); the tests make their input with it."""

import math

import pytest
from shapely.geometry import Polygon

from rooftop_core.geo import local_to_lonlat
from tests.api.conftest import error_of

PUNE = (18.52, 73.86)
# A 90 by 40 m rectangle centred on Pune, its corners counter-clockwise from the south-west, as (lon, lat).
RECTANGLE = local_to_lonlat([(-45, -20), (45, -20), (45, 20), (-45, 20)], *PUNE)


def _from_map(client, **changes):
    request = {
        "outline": [list(p) for p in RECTANGLE],
        "roof_type": "flat_tilted",
        "obstacles": [],
        **changes,
    }
    return client.post("/roof/from-map", json=request)


def _flat(points):
    return [value for point in points for value in point]


def _edges(outline):
    return [math.dist(outline[i], outline[(i + 1) % len(outline)]) for i in range(len(outline))]


def test_a_rectangle_at_pune_comes_back_in_metres_around_its_centre(client):
    response = _from_map(client)

    assert response.status_code == 200
    roof = response.json()["roof"]
    assert roof["lat"] == pytest.approx(PUNE[0], abs=1e-7)
    assert roof["lon"] == pytest.approx(PUNE[1], abs=1e-7)
    assert _edges(roof["outline"]) == pytest.approx([90, 40, 90, 40], abs=0.01)
    assert Polygon(roof["outline"]).area == pytest.approx(3600, abs=1)
    assert Polygon(roof["outline"]).centroid.coords[0] == pytest.approx((0, 0), abs=0.01)
    assert roof["source"] == "map"
    assert roof["roof_type"] == "flat_tilted"


def test_the_outline_is_counter_clockwise_whichever_way_it_was_drawn(client):
    clockwise = _from_map(client, outline=[list(p) for p in reversed(RECTANGLE)]).json()["roof"]["outline"]

    assert Polygon(clockwise).exterior.is_ccw
    corners = sorted((round(x, 3), round(y, 3)) for x, y in clockwise)
    assert _flat(corners) == pytest.approx([-45, -20, -45, 20, 45, -20, 45, 20], abs=0.01)


def test_the_answer_is_a_whole_project_with_the_defaults_of_the_api(client, demo):
    body = _from_map(client, name="Pune, Maharashtra", roof_type="flat_ew").json()

    assert body["name"] == "Pune, Maharashtra"
    assert body["roof"]["roof_type"] == "flat_ew"
    assert body["system_voltage"] is None
    assert body["chosen_option"] == ""
    assert body["roof_input"]["mode"] == "corners"
    assert body["format"] == demo["format"]
    assert set(body) == set(demo)
    # A new design starts with one module in tilt; the demo keeps its two (D69). The rest is the demo's.
    assert body["array"] == {**demo["array"], "modules_in_tilt": 1}
    assert demo["array"]["modules_in_tilt"] == 2
    assert body["losses"] == demo["losses"]
    assert body["roof"]["parapet_h"] == demo["roof"]["parapet_h"]


def test_a_sloped_roof_from_the_map_has_no_parapet_and_a_pitch_as_in_the_roof_lens(client):
    # One rule wherever Sloped is chosen (#169), as web/lib/geometry/roof-type-rule.ts gives it
    # in the Roof lens.
    roof = _from_map(client, roof_type="sloped_flush").json()["roof"]

    assert roof["roof_type"] == "sloped_flush"
    assert roof["parapet_h"] == 0
    assert roof["slope_deg"] == 10


def test_a_flat_roof_from_the_map_keeps_the_engine_s_parapet_and_no_pitch(client):
    for roof_type in ("flat_tilted", "flat_ew"):
        roof = _from_map(client, roof_type=roof_type).json()["roof"]

        assert roof["parapet_h"] == 0.9
        assert roof["slope_deg"] == 0


def test_without_a_name_the_project_is_the_untitled_roof(client):
    assert _from_map(client).json()["name"] == "Untitled roof"


def test_a_roof_entered_by_hand_about_a_place_keeps_its_source(client):
    roof = _from_map(client, source="coordinates").json()["roof"]

    assert roof["source"] == "coordinates"
    assert _edges(roof["outline"]) == pytest.approx([90, 40, 90, 40], abs=0.01)
    assert _from_map(client).json()["roof"]["source"] == "map"


def test_obstacles_drawn_on_the_map_keep_their_heights_and_become_the_shapes_of_the_engine(client):
    box = local_to_lonlat([(10, 5), (15, 5), (15, 9), (10, 9)], *PUNE)
    tank = local_to_lonlat([(30, 10)], *PUNE)
    wall = local_to_lonlat([(-40, -15), (-40, 15)], *PUNE)
    yard = local_to_lonlat([(60, -10), (70, -10), (70, 0), (65, 5), (60, 0)], *PUNE)
    obstacles = [
        {"name": "Stair room", "kind": "box", "points": [list(p) for p in box], "height": 3.0},
        {
            "name": "Water tank",
            "kind": "cylinder",
            "points": [list(p) for p in tank],
            "diameter": 2.5,
            "height": 2.0,
        },
        {"name": "", "kind": "wall", "points": [list(p) for p in wall], "height": 1.2},
        {"name": "", "kind": "building", "points": [list(p) for p in yard], "height": 8.0},
    ]

    found = _from_map(client, obstacles=obstacles).json()["roof"]["obstacles"]

    assert [(o["name"], o["kind"], o["height"]) for o in found] == [
        ("Stair room", "box", 3.0),
        ("Water tank", "cylinder", 2.0),
        ("Wall 1", "wall", 1.2),
        ("Building 1", "building", 8.0),
    ]
    stair, tank_found, wall_found, yard_found = found
    assert (stair["x"], stair["y"]) == pytest.approx((12.5, 7), abs=0.01)
    assert sorted((stair["length"], stair["width"])) == pytest.approx([4, 5], abs=0.01)
    assert (tank_found["x"], tank_found["y"], tank_found["diameter"]) == pytest.approx(
        (30, 10, 2.5), abs=0.01
    )
    assert _flat(wall_found["points"]) == pytest.approx([-40, -15, -40, 15], abs=0.01)
    assert len(yard_found["points"]) == 5


def test_an_outline_that_crosses_itself_is_refused_with_the_reason(client):
    bow_tie = [RECTANGLE[0], RECTANGLE[2], RECTANGLE[1], RECTANGLE[3]]

    response = _from_map(client, outline=[list(p) for p in bow_tie])

    assert response.status_code == 422
    error = error_of(response)
    assert error["code"] == "outline_crosses_itself"
    assert error["field"] == "outline"
    assert "cross" in error["message"]


def test_fewer_than_three_corners_are_refused(client):
    response = _from_map(client, outline=[list(p) for p in RECTANGLE[:2]])

    assert response.status_code == 422
    assert error_of(response)["field"] == "outline"


def test_a_point_that_is_no_place_on_earth_is_refused(client):
    response = _from_map(client, outline=[[73.86, 18.52], [73.87, 18.52], [200, 18.53]])

    assert response.status_code == 422
    assert error_of(response)["field"] == "outline.2.0"


def test_the_roof_is_no_longer_shown_on_the_map_by_the_api(client, demo):
    # Find is for a new roof (#238, item 33): nothing asks where a project's roof is on the map.
    assert client.post("/roof/on-map", json=demo["roof"]).status_code == 404

"""POST /layout: the modules on the roof and the read-outs next to the plan."""

import time

import pytest
from shapely.geometry import Polygon
from shapely.ops import unary_union

from tests.api.conftest import error_of
from tests.equipment import fixture_path

pytestmark = pytest.mark.slow


def test_the_read_outs_of_the_demo(client, demo):
    response = client.post("/layout", json=demo)

    assert response.status_code == 200
    readouts = response.json()["readouts"]
    assert (readouts["positions"], readouts["tables"], readouts["rows"]) == (790, 28, 6)
    assert readouts["pitch_m"] == 6.45
    assert readouts["gcr"] == pytest.approx(0.709, abs=0.0005)
    assert readouts["profile_angle_deg"] == pytest.approx(30.5, abs=0.05)
    assert readouts["roof_area_m2"] == pytest.approx(3600, abs=0.5)
    assert readouts["inside_setback_area_m2"] == pytest.approx(3344, abs=0.5)
    assert readouts["usable_area_m2"] == pytest.approx(3184, abs=0.5)
    assert readouts["keepout_area_m2"] == pytest.approx(150, abs=0.5)
    assert readouts["module_area_m2"] == pytest.approx(790 * 2.277 * 1.133, abs=0.01)


def test_the_layout_of_the_demo(client, demo):
    layout = client.post("/layout", json=demo).json()["layout"]

    assert (layout["kind"], layout["tilt"], layout["azimuth"]) == ("flat_tilted", 15.0, 180.0)
    assert (layout["n_rows"], layout["table_count"], layout["design_doy"]) == (6, 28, 355)
    assert len(layout["modules"]) == 790
    per_row = [sum(1 for m in layout["modules"] if m["row"] == row) for row in range(6)]
    assert per_row == [122, 148, 128, 110, 134, 148]
    lower_edges = sorted({min(y for _, y in m["outline"]) for m in layout["modules"] if m["line"] == 0})
    assert lower_edges == pytest.approx([1.0, 7.45, 13.9, 20.35, 26.8, 33.25], abs=1e-6)
    assert [m["idx"] for m in layout["modules"]] == list(range(790))


def test_every_module_is_a_footprint_of_four_corners_in_local_metres(client, demo):
    modules = client.post("/layout", json=demo).json()["layout"]["modules"]

    assert all(len(m["outline"]) == 4 for m in modules)
    first = Polygon(modules[0]["outline"])
    assert first.area == pytest.approx(1.133 * 2.277 * 0.9659258, abs=1e-4), (
        "seen from above, tilted by 15 degrees"
    )
    assert modules[0]["z_low"] == 0.5 and modules[0]["z_high"] == pytest.approx(
        0.5 + 2.277 * 0.2588190, abs=1e-6
    )


def test_every_keepout_names_what_casts_it(client, demo):
    keepout = client.post("/layout", json=demo).json()["layout"]["keepout"]

    assert [(k["cause"], k["obstacle"], k["obstacle_index"]) for k in keepout] == [
        ("parapet", None, None),
        ("obstacle", "Stair room", 0),
        ("obstacle", "Water tank", 1),
        ("obstacle", "AC unit 1", 2),
        ("obstacle", "AC unit 2", 3),
        ("obstacle", "AC unit 3", 4),
        ("obstacle", "AC unit 4", 5),
    ]
    assert all(k["polygons"] for k in keepout)


def test_the_keepout_parts_together_leave_150_m2_empty_inside_the_setback(client, demo):
    layout = client.post("/layout", json=demo).json()["layout"]

    shadows = unary_union(
        [Polygon(p["exterior"], p["holes"]) for k in layout["keepout"] for p in k["polygons"]]
    )
    inside = unary_union([Polygon(p["exterior"], p["holes"]) for p in layout["inner"]])

    assert shadows.intersection(inside).area == pytest.approx(150, abs=0.5)


def test_the_demo_is_answered_in_well_under_a_second(client, demo):
    client.post("/layout", json=demo)
    started = time.perf_counter()

    response = client.post("/layout", json=demo)

    seconds = time.perf_counter() - started
    assert response.status_code == 200
    assert seconds < 1.0, f"/layout took {seconds:.2f} s for the demo"


def test_a_layout_needs_neither_weather_nor_a_system_voltage(client, light_demo):
    light_demo["system_voltage"] = None

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 200
    assert response.json()["readouts"]["positions"] == 790


def test_a_project_of_nothing_but_a_roof_is_laid_out_with_the_defaults(client):
    roof = {"outline": [[0, 0], [30, 0], [30, 20], [0, 20]], "lat": 18.52, "lon": 73.86}

    response = client.post("/layout", json={"roof": roof})

    assert response.status_code == 200
    assert response.json()["readouts"]["roof_area_m2"] == pytest.approx(600.0)
    assert response.json()["readouts"]["positions"] > 100


@pytest.mark.parametrize(
    ("roof", "positions"),
    [
        ({"roof_type": "flat_ew"}, 940),
        ({"roof_type": "sloped_flush", "slope_deg": 10.0, "parapet_h": 0.0}, 1068),
    ],
)
def test_the_other_roof_types_of_the_demo(client, light_demo, roof, positions):
    light_demo["roof"].update(roof)

    body = client.post("/layout", json=light_demo).json()

    assert body["readouts"]["positions"] == positions
    assert body["layout"]["kind"] == roof["roof_type"]


def test_an_east_west_roof_has_no_profile_angle_and_at_pune_no_unit_gap_to_note(client, light_demo):
    light_demo["roof"]["roof_type"] = "flat_ew"

    body = client.post("/layout", json=light_demo).json()

    assert body["readouts"]["profile_angle_deg"] is None
    assert body["layout"]["notes"] == []


def test_allowing_shaded_positions_places_more(client, light_demo):
    light_demo["array"]["allow_shaded"] = True

    assert client.post("/layout", json=light_demo).json()["readouts"]["positions"] > 790


def test_a_setback_that_leaves_no_roof_gives_no_positions(client, light_demo):
    light_demo["roof"]["setback_m"] = 30.0

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 200
    readouts = response.json()["readouts"]
    assert (readouts["positions"], readouts["tables"], readouts["rows"]) == (0, 0, 0)
    assert readouts["inside_setback_area_m2"] == 0 and readouts["usable_area_m2"] == 0


def test_two_requests_give_the_same_answer(client, demo):
    assert client.post("/layout", json=demo).content == client.post("/layout", json=demo).content


# ── what cannot be laid out ──────────────────────────────────────────────────
def test_a_module_file_of_another_machine_must_be_chosen_again(client, light_demo):
    light_demo.update(format=1, pan_path="C:\\Users\\prasanta\\PAN\\Big.PAN", pan_text="")

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "equipment_file_missing",
        "message": "The module file Big.PAN (PAN) is not included in this project. Choose it again.",
        "field": "pan_path",
    }


def test_a_path_on_the_server_is_not_opened(client, light_demo):
    light_demo.update(pan_path=fixture_path("Test.PAN"), pan_text="")

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    assert error_of(response)["code"] == "equipment_file_missing"


def test_a_missing_inverter_file_does_not_stop_the_layout(client, light_demo):
    light_demo.update(ond_path="/home/p/Inv.ond", ond_text="")

    assert client.post("/layout", json=light_demo).status_code == 200


def test_a_pan_in_the_project_that_is_none_is_refused(client, light_demo):
    light_demo.update(pan_path="notes.PAN", pan_text="Hello\nnot a module\n")

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "not_a_pan_file",
        "message": "notes.PAN is not a module file (PAN): PNom, Voc or Isc is missing.",
        "field": "pan_text",
    }


def test_a_pan_without_the_size_of_the_module_cannot_be_laid_out(client, light_demo):
    lines = light_demo["pan_text"].splitlines()
    without = [line for line in lines if not line.strip().startswith(("Width=", "Height="))]
    assert len(without) == len(lines) - 2
    light_demo.update(pan_path="NoSize.PAN", pan_text="\r\n".join(without))

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "module_without_size",
        "message": "NoSize.PAN gives no size of the module (Width and Height). "
        "The layout needs it: choose a PAN file that has it.",
        "field": "pan_text",
    }


def test_an_outline_that_crosses_itself_is_refused(client, light_demo):
    light_demo["roof"]["outline"] = [[0, 0], [90, 40], [90, 0], [0, 40]]

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "roof_outline_crosses_itself",
        "message": "The roof outline crosses itself. Give the corners in order around the roof.",
        "field": "roof.outline",
    }


@pytest.mark.parametrize(
    "outline",
    [
        [[0, 0], [0, 40], [90, 40], [90, 0]],
        [[0, 0], [90, 0], [90, 40], [0, 40], [0, 0]],
        [[0, 0], [90, 0], [90, 0], [90, 40], [0, 40]],
    ],
    ids=["clockwise", "closed", "corner given twice"],
)
def test_an_outline_in_any_usual_form_is_the_same_roof(client, light_demo, outline):
    light_demo["roof"]["outline"] = outline

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 200
    assert response.json()["readouts"]["positions"] == 790


def test_an_outline_without_area_is_refused(client, light_demo):
    light_demo["roof"]["outline"] = [[0, 0], [10, 0], [20, 0]]

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "roof_without_area",
        "message": "The roof outline encloses no area. Give at least three corners that are not on one line.",
        "field": "roof.outline",
    }


def test_an_outline_of_two_corners_is_refused_by_its_field(client, light_demo):
    light_demo["roof"]["outline"] = [[0, 0], [10, 0]]

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    error = error_of(response)
    assert (error["code"], error["field"]) == ("invalid_request", "roof.outline")


def test_a_wall_of_one_point_is_refused_by_its_place_in_the_project(client, light_demo):
    light_demo["roof"]["obstacles"].append({"name": "Wall 1", "kind": "wall", "points": [[1, 1]]})

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    error = error_of(response)
    assert error["field"] == "roof.obstacles.6"
    assert "a wall needs at least 2 points, this one has 1" in error["message"]


def test_a_system_voltage_that_is_no_choice_is_refused(client, light_demo):
    light_demo["system_voltage"] = 800

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    assert error_of(response)["field"] == "system_voltage"


def test_a_project_format_of_the_future_is_refused(client, light_demo):
    light_demo["format"] = 3

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 422
    assert error_of(response)["field"] == "format"


def test_every_keepout_part_says_how_many_positions_it_keeps_clear(client, demo):
    keepout = client.post("/layout", json=demo).json()["layout"]["keepout"]

    by_name = {k["obstacle"] or "parapet": k["positions"] for k in keepout}
    assert all(isinstance(count, int) and count >= 0 for count in by_name.values())
    assert by_name["Stair room"] > 0
    assert sum(by_name.values()) >= 1


def test_the_readouts_say_what_the_engine_would_decide_where_it_is_told_otherwise(client, light_demo):
    # #179, item 9: with a pitch or an azimuth given, the lens said "Shade-free would be …" and "The roof edge
    # closest to the equator faces …" from the layout's own values, which are the ones given. The readouts
    # carry the engine's.
    decided = client.post("/layout", json=light_demo).json()
    light_demo["array"]["row_pitch_m"] = 7.0
    light_demo["array"]["azimuth_deg"] = 200.0
    given = client.post("/layout", json=light_demo).json()

    assert given["layout"]["pitch"] == 7.0 and given["layout"]["azimuth"] == 200.0
    assert decided["readouts"]["shade_free_pitch_m"] == decided["layout"]["pitch"]
    assert decided["readouts"]["edge_azimuth_deg"] == decided["layout"]["azimuth"] == 180.0
    assert given["readouts"]["edge_azimuth_deg"] == 180.0
    # Shade-free for the rows as they face, toward 200°: not the 7.0 m given.
    assert given["readouts"]["shade_free_pitch_m"] not in (None, 7.0)


def test_only_tilted_rows_have_a_shade_free_pitch(client, light_demo):
    light_demo["roof"]["roof_type"] = "flat_ew"

    body = client.post("/layout", json=light_demo).json()

    assert body["readouts"]["shade_free_pitch_m"] is None
    assert body["readouts"]["edge_azimuth_deg"] == 180.0

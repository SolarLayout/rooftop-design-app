"""Schema to engine and back: nothing is lost on the way, in either direction."""

import json
from dataclasses import asdict

import pytest
from shapely.geometry import GeometryCollection, LineString, MultiPolygon, Point, Polygon, box

from rooftop_api import convert, schemas
from rooftop_core.demo import demo_project, demo_roof
from rooftop_core.geometry import Obstacle, Roof
from rooftop_core.io.pvsyst import read_ond, read_pan
from rooftop_core.keepout_parts import keepout_parts
from rooftop_core.onediode import ModuleModel
from rooftop_core.placement import ArraySpec, place
from rooftop_core.project import Project
from rooftop_core.simulation import Losses
from tests.equipment import fixture_path

OBSTACLES = [
    Obstacle("Stair room", "box", x=22.5, y=18.0, length=5.0, width=4.0, rotation_deg=12.5, height=3.0),
    Obstacle("Water tank", "cylinder", x=62.0, y=24.0, diameter=2.5, height=2.0),
    Obstacle("Fire wall", "wall", points=[(1.0, 2.0), (9.0, 2.0), (9.0, 6.0)], height=1.8, thickness=0.25),
    Obstacle("Neem", "tree", x=-4.0, y=10.0, diameter=5.0, height=7.0, trunk_height=2.5),
    Obstacle(
        "Office block",
        "building",
        points=[(95.0, 0.0), (105.0, 0.0), (105.0, 12.0), (95.0, 12.0)],
        height=9.0,
    ),
]


@pytest.fixture(scope="module")
def module():
    return read_pan(fixture_path("Test.PAN"))


# ── inputs, both ways ────────────────────────────────────────────────────────
@pytest.mark.parametrize("obstacle", OBSTACLES, ids=lambda o: o.kind)
def test_an_obstacle_survives_both_ways(obstacle):
    schema = convert.obstacle_from_engine(obstacle)

    assert isinstance(schema, schemas.Obstacle)
    assert schema.model_dump() == asdict(obstacle)
    assert convert.obstacle_to_engine(schema) == obstacle


def test_a_roof_survives_both_ways():
    roof = demo_roof()
    roof.obstacles = OBSTACLES
    roof.roof_type, roof.slope_deg, roof.slope_azimuth_deg, roof.source = "sloped_flush", 10.0, 165.0, "kmz"

    schema = convert.roof_from_engine(roof)

    assert isinstance(schema, schemas.Roof)
    assert schema.outline == [(90.0, 0.0), (90.0, 40.0), (0.0, 40.0), (0.0, 0.0)]
    assert convert.roof_to_engine(schema) == roof


def test_an_array_survives_both_ways_with_and_without_its_automatic_values():
    automatic = ArraySpec()
    chosen = ArraySpec(
        azimuth_deg=172.5, row_pitch_m=6.8, design_doy=172, orientation="landscape", allow_shaded=True
    )

    for array in (automatic, chosen):
        schema = convert.array_from_engine(array)
        assert isinstance(schema, schemas.ArraySpec)
        assert convert.array_to_engine(schema) == array
    assert convert.array_from_engine(automatic).azimuth_deg is None


def test_losses_survive_both_ways():
    losses = Losses(lid_pct=1.2, uc=25.0, p_levels=(50, 84, 95), bifacial=False)

    schema = convert.losses_from_engine(losses)

    assert isinstance(schema, schemas.Losses)
    back = convert.losses_to_engine(schema)
    assert back == losses
    assert isinstance(back.p_levels, tuple)


def test_the_demo_project_survives_both_ways():
    project = demo_project()
    project.custom, project.t_min_override, project.imax_mppt_override = (27, 20, 1), 7.25, 32.5
    project.pan_path, project.pan_text = "Test.PAN", "PVObject_=pvModule\n"

    schema = convert.project_from_engine(project)

    assert isinstance(schema, schemas.Project)
    assert schema.format == 2
    assert schema.system_voltage == 1500
    assert len(schema.weather_json.ghi) == 8760
    back = convert.project_to_engine(schema)
    assert back == project
    assert isinstance(back.custom, tuple) and isinstance(back.system_voltage, float)


def test_a_project_without_voltage_weather_and_overrides_survives_both_ways():
    project = Project()

    back = convert.project_to_engine(convert.project_from_engine(project))

    assert back == project
    assert back.system_voltage is None and back.weather_json is None and back.custom is None


def test_what_the_api_answers_is_a_project_file():
    project = demo_project()

    as_json = json.loads(convert.project_from_engine(project).model_dump_json())

    assert as_json["format"] == 2
    assert Project.from_json(as_json) == project


def test_a_project_file_is_a_request_body():
    project = demo_project()
    written = json.loads(json.dumps(project.to_json()))

    schema = schemas.Project.model_validate(written)

    assert convert.project_to_engine(schema) == project


def test_a_format_1_file_is_a_request_body_too():
    project = demo_project()
    project.pan_path = "C:\\Users\\prasanta\\PAN\\Big.PAN"
    written = json.loads(json.dumps(project.to_json()))
    written["format"] = 1
    for added in ("pan_text", "ond_text", "weather_csv_text"):
        del written[added]

    schema = schemas.Project.model_validate(written)

    assert schema.format == 1 and schema.pan_text == ""
    assert convert.project_to_engine(schema) == project


# ── results, from the engine ─────────────────────────────────────────────────
def test_a_module_carries_its_fields_and_what_follows_from_them(module):
    schema = convert.module_from_engine(module)

    assert isinstance(schema, schemas.Module)
    assert (schema.manufacturer, schema.model, schema.pnom_w) == (module.manufacturer, module.model, 560)
    assert (schema.length_m, schema.width_m) == (2.277, 1.133)
    assert (schema.voc, schema.isc, schema.vmp, schema.imp) == (49.95, 14.30, 41.24, 13.58)
    assert (schema.n_diodes, schema.half_cell, schema.bifaciality, schema.lid_loss_pct) == (3, True, 0.8, 0.2)
    assert len(schema.iam_profile) == 9 and schema.iam_profile[0] == tuple(module.iam_profile[0])
    assert schema.area_m2 == pytest.approx(2.277 * 1.133)
    assert schema.is_bifacial is True
    assert schema.efficiency == pytest.approx(module.efficiency)
    assert set(asdict(module)) <= set(schema.model_dump())


def test_coefficients_say_where_they_come_from(module):
    derived = convert.coefficients_from_engine(ModuleModel(module).coefficients())

    assert derived.source == "one-diode model"
    assert derived.mu_voc_pct == pytest.approx(-0.164, abs=0.003)
    assert derived.mu_vmp_pct == pytest.approx(-0.228, abs=0.003)
    assert derived.mu_pmpp_pct == pytest.approx(-0.212, abs=0.003)


def test_coefficients_of_the_file_say_so(module):
    module.mu_voc_mv = -130.0

    from_file = convert.coefficients_from_engine(ModuleModel(module).coefficients())

    assert from_file.source == "PAN file"
    assert from_file.mu_voc_mv == -130.0


def test_an_inverter_carries_its_fields_curves_and_limits():
    inverter = read_ond(fixture_path("Test-S.ond"))

    schema = convert.inverter_from_engine(inverter)

    assert isinstance(schema, schemas.Inverter)
    assert (schema.pnom_kw, schema.n_mppt, schema.n_inputs) == (275, 6, 28)
    assert (schema.vmpp_min, schema.vmpp_max, schema.vmpp_nom, schema.vabs_max) == (500, 1500, 1080, 1500)
    assert schema.idc_max_a == 390 and schema.imax_mppt_a == 0
    assert schema.mppt_current_limit == 65.0 and schema.mppt_isc_limit == 65.0
    assert [curve.voltage for curve in schema.curves] == [930.0, 1189.0, 1300.0]
    assert schema.curves[0].points == [tuple(point) for point in inverter.curves[930.0]]
    assert schema.curve_euro_pct == inverter.curve_euro_pct


def test_a_layout_carries_its_modules_areas_and_keepout(module):
    roof, array = demo_roof(), ArraySpec()
    layout = place(roof, array, module)

    schema = convert.layout_from_engine(layout, keepout_parts(roof, array, layout))

    assert isinstance(schema, schemas.Layout)
    assert (schema.kind, schema.n_rows, schema.table_count) == ("flat_tilted", 6, 28)
    assert (schema.pitch, schema.design_doy) == (6.45, 355)
    assert schema.gcr == pytest.approx(0.709, abs=0.001)
    assert schema.psi_min_deg == pytest.approx(30.5, abs=0.1)
    assert len(schema.modules) == 790
    first, engine_first = schema.modules[0], layout.modules[0]
    assert (first.idx, first.row, first.col, first.line) == (0, 0, engine_first.col, 0)
    assert (first.tilt, first.azimuth) == (15.0, 180.0)
    assert (first.z_low, first.z_high) == (
        pytest.approx(engine_first.z_low),
        pytest.approx(engine_first.z_high),
    )
    assert len(first.outline) == 4
    assert Polygon(first.outline).area == pytest.approx(engine_first.poly.area, abs=1e-5)
    assert [(k.cause, k.obstacle, k.obstacle_index) for k in schema.keepout][:3] == [
        ("parapet", None, None),
        ("obstacle", "Stair room", 0),
        ("obstacle", "Water tank", 1),
    ]
    assert sum(Polygon(p.exterior, p.holes).area for p in schema.usable) == pytest.approx(
        layout.usable.area, abs=1e-3
    )
    assert sum(Polygon(p.exterior).area for p in schema.inner) == pytest.approx(3344, abs=1)


# ── shapes ───────────────────────────────────────────────────────────────────
def test_a_polygon_keeps_its_holes_and_drops_the_closing_point():
    shape = box(0, 0, 10, 10).difference(box(4, 4, 6, 6))

    (polygon,) = convert.polygons_from_shape(shape)

    assert len(polygon.exterior) == 4 and len(polygon.holes) == 1 and len(polygon.holes[0]) == 4
    assert Polygon(polygon.exterior, polygon.holes).area == pytest.approx(96.0)


def test_many_polygons_come_as_a_list():
    shape = MultiPolygon([box(0, 0, 1, 1), box(5, 5, 7, 7)])

    polygons = convert.polygons_from_shape(shape)

    assert [Polygon(p.exterior).area for p in polygons] == [1.0, 4.0]


def test_lines_and_points_in_a_mixed_shape_are_left_out():
    shape = GeometryCollection([box(0, 0, 1, 1), LineString([(0, 0), (5, 5)]), Point(3, 3)])

    assert len(convert.polygons_from_shape(shape)) == 1


@pytest.mark.parametrize("nothing", [None, Polygon(), MultiPolygon()])
def test_nothing_gives_an_empty_list(nothing):
    assert convert.polygons_from_shape(nothing) == []


def test_coordinates_are_rounded_to_the_micrometre():
    (polygon,) = convert.polygons_from_shape(
        Polygon([(0, 0), (7.450000000000001, 0), (7.45, 1.23456789), (0, 1)])
    )

    assert polygon.exterior == [(0.0, 0.0), (7.45, 0.0), (7.45, 1.234568), (0.0, 1.0)]


def test_an_imported_roof_becomes_a_roof_outline_with_obstacles():
    roof = Roof(outline=[(0, 0), (10, 0), (10, 5)], lat=18.52, lon=73.86, obstacles=OBSTACLES[:1])

    schema = convert.roof_from_engine(roof)

    assert schema.outline == [(0.0, 0.0), (10.0, 0.0), (10.0, 5.0)]
    assert schema.obstacles[0].name == "Stair room"

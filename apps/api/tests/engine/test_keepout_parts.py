"""The shadow keep-out, told apart by what casts it."""

import pytest
from shapely.ops import unary_union

from rooftop_core.demo import demo_roof
from rooftop_core.io.pvsyst import read_pan
from rooftop_core.keepout_parts import KeepoutPart, keepout_parts
from rooftop_core.placement import ArraySpec, place
from rooftop_core.resources import sample_path


@pytest.fixture(scope="module")
def module():
    return read_pan(sample_path("Test.PAN"))


@pytest.fixture(scope="module")
def parts(module) -> list[KeepoutPart]:
    roof = demo_roof()
    return keepout_parts(roof, ArraySpec(), place(roof, ArraySpec(), module))


def test_every_obstacle_of_the_demo_and_the_parapet_cast_a_part(parts):
    assert [(part.cause, part.obstacle_index, part.name) for part in parts] == [
        ("parapet", None, None),
        ("obstacle", 0, "Stair room"),
        ("obstacle", 1, "Water tank"),
        ("obstacle", 2, "AC unit 1"),
        ("obstacle", 3, "AC unit 2"),
        ("obstacle", 4, "AC unit 3"),
        ("obstacle", 5, "AC unit 4"),
    ]


def test_the_parts_together_are_the_keepout_of_the_layout(module, parts):
    roof = demo_roof()
    layout = place(roof, ArraySpec(), module)

    together = unary_union([part.area for part in parts])

    whole = layout.keepout.intersection(roof.polygon)
    assert together.symmetric_difference(whole).area < 1e-6
    assert together.intersection(roof.inner()).area == pytest.approx(layout.keepout_area_in_roof, abs=1e-6)


def test_every_part_lies_on_the_roof(parts):
    roof = demo_roof().polygon.buffer(1e-6)

    assert all(roof.contains(part.area) for part in parts)


def test_a_part_reaches_from_its_obstacle_away_from_the_sun(parts):
    stair_room = next(part for part in parts if part.name == "Stair room")
    footprint = demo_roof().obstacles[0].footprint()

    min_x, min_y, max_x, max_y = stair_room.area.bounds

    assert stair_room.area.contains(footprint.buffer(-1e-6))
    assert max_y > footprint.bounds[3] + 1.0, "in December the shadow in Pune falls to the north"
    assert min_y == pytest.approx(footprint.bounds[1], abs=1e-6)


def test_a_roof_without_parapet_and_obstacles_has_no_parts(module):
    roof = demo_roof()
    roof.parapet_h, roof.obstacles = 0.0, []

    assert keepout_parts(roof, ArraySpec(), place(roof, ArraySpec(), module)) == []


def test_an_obstacle_lower_than_the_modules_casts_no_part(module):
    roof = demo_roof()
    roof.parapet_h = 0.0
    roof.obstacles = roof.obstacles[:1]
    roof.obstacles[0].height = 0.3
    array = ArraySpec(clearance_m=0.5)

    assert keepout_parts(roof, array, place(roof, array, module)) == []


def test_the_parts_follow_the_design_day_of_the_layout(module):
    roof = demo_roof()
    december = keepout_parts(roof, ArraySpec(), place(roof, ArraySpec(), module))
    june_array = ArraySpec(design_doy=172)
    june = keepout_parts(roof, june_array, place(roof, june_array, module))

    assert june[1].name == december[1].name == "Stair room"
    assert june[1].area.area < december[1].area.area

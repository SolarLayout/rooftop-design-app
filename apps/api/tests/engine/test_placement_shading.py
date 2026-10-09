# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
import math

import numpy as np
import pytest

from rooftop_core.demo import demo_roof
from rooftop_core.geometry import sun_solar_time
from rooftop_core.io.pvsyst import read_pan
from rooftop_core.placement import ArraySpec, place, shade_free_pitch
from rooftop_core.shading import electrical_rule, row_fraction
from tests.equipment import fixture_path


@pytest.fixture(scope="module")
def module():
    return read_pan(fixture_path("Test.PAN"))


def test_shade_free_pitch_pune(module):
    pitch, psi = shade_free_pitch(18.52, 180, 15, 2 * 2.277 + 0.02, 9, 16, 355)
    assert psi == pytest.approx(30.5, abs=0.2)      # set by 16:00, the lowest sun in the window
    assert pitch == pytest.approx(6.44, abs=0.02)


def test_sun_at_16h_on_solstice():
    el, az = sun_solar_time(18.52, 355, 16.0)
    assert el == pytest.approx(18.0, abs=0.2) and az == pytest.approx(236.6, abs=0.3)


@pytest.mark.parametrize("rt", ["flat_tilted", "flat_ew", "sloped_flush"])
def test_modules_stay_inside_usable_area(module, rt):
    roof = demo_roof()
    roof.roof_type = rt
    if rt == "sloped_flush":
        roof.slope_deg, roof.parapet_h = 10, 0
    lay = place(roof, ArraySpec(), module)
    assert lay.n_modules > 500
    inner = roof.inner().buffer(1e-6)
    zone = lay.obstacle_zone
    for m in lay.modules:
        assert inner.contains(m.poly)
        assert m.poly.intersection(zone).area < 1e-6
        assert m.poly.intersection(lay.keepout).area < 1e-6   # shaded positions stay empty


def test_allow_shaded_places_more(module):
    roof = demo_roof()
    assert place(roof, ArraySpec(allow_shaded=True), module).n_modules > place(roof, ArraySpec(), module).n_modules


def test_rows_unshaded_inside_window_shaded_outside(module):
    lay = place(demo_roof(), ArraySpec(), module)
    for hour, shaded in ((12.0, False), (15.9, False), (17.0, True)):
        el, az = sun_solar_time(18.52, 355, hour)
        f = row_fraction(lay, np.array([el]), np.array([az]))
        assert (f.max() > 0.01) == shaded, hour


def test_electrical_rule_half_cell_portrait():
    f = np.array([0.0, 0.2, 0.6])
    assert list(electrical_rule(f, "portrait", True, 3)) == [0.0, 0.5, 1.0]
    assert list(electrical_rule(f, "portrait", False, 3)) == [0.0, 1.0, 1.0]
    assert list(electrical_rule(f, "landscape", False, 3)) == [0.0, pytest.approx(1 / 3), pytest.approx(2 / 3)]


def test_row_fraction_formula():
    # The analytic shaded length matches u* = L·(1 − P / (L (cos β + sin β / tan ψ)))
    b, L, P, psi = math.radians(15), 4.574, 6.45, math.radians(20)
    expect = 1 - P / (L * (math.cos(b) + math.sin(b) / math.tan(psi)))
    H, D = L * math.sin(b), P - L * math.cos(b)
    t = math.tan(psi)
    assert (H - D * t) / (math.sin(b) + math.cos(b) * t) / L == pytest.approx(expect)


def test_the_modules_turned_back_in_one_call_are_shapely_s_own_rotation_to_the_bit():
    from shapely.affinity import rotate
    from shapely.geometry import Point, box

    from rooftop_core.placement import rotate_all

    shapes = [box(0.3 * k, 1.1 * k, 0.3 * k + 1.13, 1.1 * k + 2.28) for k in range(40)]
    origin = Point(12.345, -6.789)
    for angle in (-37.5, 0.0, 15.0, 90.0, 180.0):
        one_by_one = [rotate(shape, angle, origin=origin) for shape in shapes]
        at_once = rotate_all(shapes, angle, origin)

        assert [shape.wkb for shape in at_once] == [shape.wkb for shape in one_by_one]


def test_flush_modules_face_the_slope_whatever_azimuth_the_array_kept(module):
    # #179, item 12: an azimuth set while the roof was flat stayed in the array when the roof became sloped, and the
    # modules faced it rather than the slope. Flush modules lie on the roof: they can face only where it slopes.
    roof = demo_roof()
    roof.roof_type, roof.slope_deg, roof.parapet_h, roof.slope_azimuth_deg = "sloped_flush", 10, 0, 200.0

    kept = place(roof, ArraySpec(azimuth_deg=90.0), module)
    unset = place(roof, ArraySpec(), module)

    assert kept.azimuth == unset.azimuth == 200.0
    assert {m.azimuth for m in kept.modules} == {200.0}
    assert kept.n_modules == unset.n_modules


def test_a_row_pitch_entered_under_the_table_s_depth_is_raised_and_says_so(module):
    # #179, item 10: a pitch under a table's depth on plan plus 0.3 m was raised without a word.
    roof = demo_roof()

    raised = place(roof, ArraySpec(row_pitch_m=1.0), module)
    kept = place(roof, ArraySpec(row_pitch_m=7.0), module)

    used = raised.slope_len * math.cos(math.radians(raised.tilt)) + 0.3  # a table's depth on plan, plus 0.3 m
    assert raised.pitch == pytest.approx(used)
    assert raised.notes == [
        f"Row pitch 1.00 m is under a table's depth on plan plus 0.3 m, so {used:.2f} m is used."
    ]
    assert kept.pitch == 7.0 and kept.notes == []

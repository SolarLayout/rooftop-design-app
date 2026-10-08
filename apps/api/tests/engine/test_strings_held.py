"""How many strings of a length the roof holds, counted without forming them: every string takes its length,
and what the rows leave is wired across rows of one orientation, so it is the positions of each orientation
divided by the length. And the three lengths the run tries: nearest the nominal MPP voltage, the longest, and
the one from the nominal up that places the most modules."""

import pytest

from rooftop_core.demo import demo_roof
from rooftop_core.io.pvsyst import read_pan
from rooftop_core.placement import ArraySpec, place
from rooftop_core.stringing import form_strings, lengths_to_try, strings_held
from tests.engine.test_strings_across_rows import a_layout
from tests.equipment import fixture_path

LENGTHS = range(1, 41)


@pytest.mark.parametrize(
    "layout",
    [
        a_layout([15] * 13),
        a_layout([8, 8], lines=2),
        a_layout([7, 9, 7], lines=2),
        a_layout([15, 15, 15, 15], tilts=[15.0, 10.0, 15.0, 10.0]),
    ],
    ids=["one line", "two lines", "two lines, uneven", "two orientations"],
)
def test_the_count_is_the_strings_formed_for_every_length(layout):
    held = strings_held(layout)

    assert [held(n) for n in LENGTHS] == [len(form_strings(layout, n)) for n in LENGTHS]


@pytest.mark.parametrize("roof_type", ["flat_tilted", "flat_ew", "sloped_flush"])
@pytest.mark.parametrize("in_tilt", [1, 2])
def test_the_count_is_the_strings_formed_on_the_demo_s_roof_of_each_type(roof_type, in_tilt):
    roof = demo_roof()
    roof.roof_type = roof_type
    if roof_type == "sloped_flush":
        roof.slope_deg, roof.parapet_h = 10, 0
    layout = place(roof, ArraySpec(modules_in_tilt=in_tilt), read_pan(fixture_path("Test.PAN")))
    held = strings_held(layout)

    assert [held(n) for n in LENGTHS] == [len(form_strings(layout, n)) for n in LENGTHS]


def held_from(counts: dict[int, int]):
    return lambda n: counts.get(n, 0)


def test_the_length_that_places_the_most_modules_takes_the_place_of_the_longest_but_one():
    # 160 positions: 16 fills them; 15 leaves 10, 19 leaves 8.
    held = held_from({15: 10, 16: 10, 18: 8, 19: 8})

    assert lengths_to_try(n_min=5, n_max=19, nominal=15, held=held) == [19, 16, 15]


def test_a_tie_in_modules_placed_goes_to_the_length_nearest_the_nominal():
    # 120 positions: 15 and 20 both fill them; 15 is nearer the nominal, 14.
    held = held_from({14: 8, 15: 8, 20: 6})

    assert lengths_to_try(n_min=10, n_max=20, nominal=14, held=held) == [20, 15, 14]


def test_a_length_shorter_than_the_nominal_is_not_tried_however_many_modules_it_places():
    # The demo's roof with 50 kW inverters: 10 in series places all 790, in 79 strings at about 410 V
    # against the nominal's 620 V; 16 places 784 in 49.
    held = held_from({10: 79, 15: 52, 16: 49, 19: 41})

    assert lengths_to_try(n_min=5, n_max=19, nominal=15, held=held) == [19, 16, 15]


def test_when_the_longest_places_the_most_the_longest_but_one_is_tried_as_well():
    held = held_from({29: 28, 28: 27, 26: 29})  # 29 places 812; 28, 756; 26, 754

    assert lengths_to_try(n_min=14, n_max=29, nominal=26, held=held) == [29, 28, 26]


def test_a_range_of_one_length_is_tried_once():
    assert lengths_to_try(n_min=12, n_max=12, nominal=12, held=held_from({12: 3})) == [12]

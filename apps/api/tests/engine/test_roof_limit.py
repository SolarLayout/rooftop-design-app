"""One roof at a time, up to 30,000 m² (plan/phase-11-plan.md, decision 11): the engine's check, its words."""

import re

import pytest

from rooftop_core.demo import demo_roof, rectangle
from rooftop_core.errors import EngineError, RoofTooLarge
from rooftop_core.geometry import ROOF_AREA_LIMIT_M2, require_roof_within_limit

AT_THE_LIMIT = rectangle(300.0, 100.0)
# The rectangle at the limit with one square metre more at its north-west corner.
ONE_OVER = [(0.0, 0.0), (300.0, 0.0), (300.0, 100.0), (1.0, 100.0), (1.0, 101.0), (0.0, 101.0)]
WORDS = (
    "This outline covers 48,500 m². SolarLayout designs one roof at a time, up to 30,000 m² (about 3 MWp). "
    "For a larger site, outline each building as its own design."
)


def test_the_limit_is_thirty_thousand_square_metres():
    assert ROOF_AREA_LIMIT_M2 == 30_000.0


def test_a_roof_at_the_limit_passes():
    require_roof_within_limit(AT_THE_LIMIT)


def test_the_demo_passes():
    require_roof_within_limit(demo_roof().outline)


def test_one_square_metre_over_is_refused_naming_the_area_and_the_limit():
    with pytest.raises(RoofTooLarge) as caught:
        require_roof_within_limit(ONE_OVER)

    error = caught.value
    assert isinstance(error, EngineError)
    assert (error.area_m2, error.limit_m2) == (30_001.0, 30_000.0)
    assert str(error).startswith("This outline covers 30,001 m². ")


def test_the_words_of_the_decision():
    with pytest.raises(RoofTooLarge, match="^" + re.escape(WORDS) + "$"):
        require_roof_within_limit(rectangle(485.0, 100.0))


def test_a_fraction_of_a_square_metre_over_is_told_as_the_next_whole_one():
    with pytest.raises(RoofTooLarge) as caught:
        require_roof_within_limit(rectangle(300.001, 100.0))

    assert str(caught.value).startswith("This outline covers 30,001 m². ")


def test_the_field_is_the_outline_unless_the_caller_names_another():
    with pytest.raises(RoofTooLarge) as by_default:
        require_roof_within_limit(ONE_OVER)
    with pytest.raises(RoofTooLarge) as named:
        require_roof_within_limit(ONE_OVER, field="roof.outline")

    assert by_default.value.field == "outline"
    assert named.value.field == "roof.outline"


def test_the_outline_is_taken_as_the_roof_takes_it():
    """A closed or a clockwise outline has the area the Roof gives it."""
    closed = [*AT_THE_LIMIT, AT_THE_LIMIT[0]]
    clockwise = list(reversed(AT_THE_LIMIT))

    require_roof_within_limit(closed)
    require_roof_within_limit(clockwise)
    with pytest.raises(RoofTooLarge):
        require_roof_within_limit(list(reversed(ONE_OVER)))

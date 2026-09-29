"""The sun of one day in solar time: where it stands, and when it rises and sets."""

import pytest

from rooftop_core.geometry import sun_solar_time
from rooftop_core.sunpath import SunPosition, day_of_year, hours_by_step, sun_positions, sunrise_sunset

PUNE = 18.52
WINTER_SOLSTICE_NORTH, WINTER_SOLSTICE_SOUTH = 355, 172


def test_the_design_day_is_the_winter_solstice_of_the_hemisphere():
    assert day_of_year(None, PUNE) == WINTER_SOLSTICE_NORTH
    assert day_of_year(None, -33.87) == WINTER_SOLSTICE_SOUTH
    assert day_of_year(None, 0.0) == WINTER_SOLSTICE_NORTH


def test_a_day_that_is_given_is_kept():
    assert day_of_year(80, PUNE) == 80
    assert day_of_year(80, -33.87) == 80


def test_pune_at_16h_on_the_solstice():
    (position,) = sun_positions(PUNE, WINTER_SOLSTICE_NORTH, [16.0])

    assert position.hour == 16.0
    assert position.elevation_deg == pytest.approx(18.0, abs=0.2)
    assert position.azimuth_deg == pytest.approx(236.6, abs=0.3)


def test_positions_are_those_of_the_engine_in_the_order_asked():
    hours = [9.0, 12.0, 15.75]

    positions = sun_positions(PUNE, WINTER_SOLSTICE_NORTH, hours)

    assert positions == [SunPosition(h, *sun_solar_time(PUNE, WINTER_SOLSTICE_NORTH, h)) for h in hours]


def test_sunrise_and_sunset_in_pune_on_the_solstice():
    sunrise, sunset = sunrise_sunset(PUNE, WINTER_SOLSTICE_NORTH)

    assert sunrise == pytest.approx(6.557, abs=0.005)
    assert sunset == pytest.approx(17.443, abs=0.005)
    assert sun_solar_time(PUNE, WINTER_SOLSTICE_NORTH, sunrise)[0] == pytest.approx(0.0, abs=1e-6)
    assert sun_solar_time(PUNE, WINTER_SOLSTICE_NORTH, sunset)[0] == pytest.approx(0.0, abs=1e-6)


def test_on_the_equinox_the_day_is_twelve_hours():
    sunrise, sunset = sunrise_sunset(PUNE, 81)

    assert sunrise == pytest.approx(6.0, abs=0.01)
    assert sunset == pytest.approx(18.0, abs=0.01)


@pytest.mark.parametrize(("lat", "doy"), [(78.0, 355), (78.0, 172), (-78.0, 172)])
def test_where_the_sun_does_not_rise_or_set_there_is_no_sunrise(lat, doy):
    assert sunrise_sunset(lat, doy) is None


def test_hours_by_step_cover_the_day_from_midnight_to_midnight():
    assert hours_by_step(6.0) == [0.0, 6.0, 12.0, 18.0, 24.0]
    quarter_hours = hours_by_step(0.25)
    assert len(quarter_hours) == 97
    assert quarter_hours[:3] == [0.0, 0.25, 0.5] and quarter_hours[-1] == 24.0


def test_a_step_that_does_not_divide_the_day_stops_before_midnight():
    assert hours_by_step(5.0) == [0.0, 5.0, 10.0, 15.0, 20.0]


@pytest.mark.parametrize("step", [0.0, -1.0])
def test_a_step_must_be_more_than_nothing(step):
    with pytest.raises(ValueError, match="The step must be more than 0 hours."):
        hours_by_step(step)

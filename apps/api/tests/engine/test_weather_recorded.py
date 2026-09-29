"""The two downloads, run on answers recorded from the real services."""

from dataclasses import replace

import numpy as np
import pandas as pd
import pytest

from rooftop_core import weather as wx
from tests.recorded import OVER_THE_SEA, PUNE, recorded

pytestmark = pytest.mark.slow


def _as_stored(weather: wx.Weather) -> wx.Weather:
    """The weather as it comes back from a project file: rounded to two decimals."""
    return wx.Weather.from_json(weather.to_json())


def test_pvgis_for_pune_is_the_bundled_sample(services, pune_weather):
    weather = wx.fetch_pvgis(*PUNE, cache=wx.MemoryWeatherCache())

    stored = _as_stored(weather)
    pd.testing.assert_frame_equal(stored.data, pune_weather.data)
    assert replace(stored, data=None) == replace(pune_weather, data=None)
    assert [url.rsplit("/", 1)[1] for url, _ in services.asked] == ["tmy", "printhorizon"]


def test_pvgis_gives_a_year_on_one_calendar_and_the_horizon_from_north(services):
    weather = wx.fetch_pvgis(*PUNE, cache=wx.MemoryWeatherCache())

    assert len(weather.data) == 8760
    assert weather.data.index.is_monotonic_increasing and weather.data.index.is_unique
    assert (str(weather.data.index[0]), str(weather.data.index[-1])) == (
        "2019-01-01 00:00:00+00:00",
        "2019-12-31 23:00:00+00:00",
    )
    assert len(weather.horizon) == 48
    assert [bearing for bearing, _ in weather.horizon] == [7.5 * i for i in range(48)]
    assert max(height for _, height in weather.horizon) == 2.7


def test_pvgis_without_data_for_the_site_says_so_in_its_own_words(services):
    with pytest.raises(RuntimeError) as error:
        wx.fetch_pvgis(*OVER_THE_SEA, cache=wx.MemoryWeatherCache())

    assert str(error.value) == (
        're.jrc.ec.europa.eu answered 400: {"message":"Location over the sea. '
        'Please, select another location","status":400}'
    )
    assert isinstance(error.value, wx.WeatherServiceError)
    assert (error.value.host, error.value.status) == ("re.jrc.ec.europa.eu", 400)
    assert error.value.said == "Location over the sea. Please, select another location"


def test_nasa_for_pune_gives_the_year_asked_for_without_a_horizon(services):
    weather = wx.fetch_nasa(*PUNE, cache=wx.MemoryWeatherCache())

    assert (weather.source, weather.label, weather.horizon) == ("nasa", "NASA POWER 2023", [])
    assert len(weather.data) == 8760
    assert (str(weather.data.index[0]), str(weather.data.index[-1])) == (
        "2023-01-01 00:00:00+00:00",
        "2023-12-31 23:00:00+00:00",
    )
    assert np.isfinite(weather.data.to_numpy()).all()
    assert (weather.data[["ghi", "dni", "dhi"]] >= 0).to_numpy().all()
    (_, asked), *others = services.asked
    assert others == []
    assert (asked["start"], asked["end"], asked["time-standard"]) == ("20230101", "20231231", "UTC")


def test_nasa_hours_are_the_values_of_the_answer(services):
    weather = wx.fetch_nasa(*PUNE, cache=wx.MemoryWeatherCache())

    answer = recorded("nasa-power-pune-2023.json.gz")["properties"]["parameter"]
    columns = {
        "ghi": "ALLSKY_SFC_SW_DWN",
        "dni": "ALLSKY_SFC_SW_DNI",
        "dhi": "ALLSKY_SFC_SW_DIFF",
        "temp_air": "T2M",
        "wind_speed": "WS10M",
    }
    for column, parameter in columns.items():
        in_order = [value for _, value in sorted(answer[parameter].items())]
        assert list(weather.data[column]) == in_order, column

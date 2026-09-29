"""Weather from CSV text, a download cache that lives in memory, and no download that was not asked for."""

from dataclasses import replace
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib
import pytest

from rooftop_core import weather as wx
from rooftop_core.demo import demo_project
from rooftop_core.errors import WeatherNotLoaded
from rooftop_core.project import Design

CSV = """# a day of made-up weather
time,GHI,DNI,DHI,Temp,Wind
2023-06-01 00:00,0,0,0,24.0,1.0
2023-06-01 01:00,0,0,0,23.5,1.2
2023-06-01 02:00,80,120,50,24.5,1.4
2023-06-01 03:00,310,480,90,26.0,1.8
2023-06-01 04:00,560,640,120,28.0,2.0
2023-06-01 05:00,770,720,140,30.0,2.2
2023-06-01 06:00,900,760,150,31.5,2.5
2023-06-01 07:00,930,770,155,32.0,2.4
"""
CSV_WITHOUT_DNI_AND_DHI = "\n".join(
    ",".join(line.split(",")[:2] + line.split(",")[4:]) if "," in line else line for line in CSV.splitlines()
)


class Recorder:
    """Stands in for a function that must not be called, or counts the calls of one that may be."""

    def __init__(self, result=None, forbidden: bool = False):
        self.calls: list[tuple] = []
        self.result = result
        self.forbidden = forbidden

    def __call__(self, *args, **kwargs):
        self.calls.append(args)
        if self.forbidden:
            raise AssertionError(f"called although nobody asked for a download: {args}")
        return self.result(*args, **kwargs) if callable(self.result) else self.result


def _pvgis_answer(url: str, params: dict, timeout: float = 60.0) -> dict:
    """What PVGIS answers, cut down to one day."""
    if url.endswith("/printhorizon"):
        return {"outputs": {"horizon_profile": [{"A": -180.0, "H_hor": 1.5}, {"A": 0.0, "H_hor": 2.7}]}}
    hours = pd.date_range("2007-01-01", periods=24, freq="h", tz="UTC")
    rows = [
        {
            "time(UTC)": t.strftime("%Y%m%d:%H%M"),
            "G(h)": 100.0 + i,
            "Gb(n)": 50.0,
            "Gd(h)": 40.0,
            "T2m": 20.0 + i / 10,
            "WS10m": 2.0,
        }
        for i, t in enumerate(hours)
    ]
    return {"outputs": {"tmy_hourly": rows}}


@pytest.fixture
def no_download(monkeypatch):
    """Every way to the network is closed, and says so when it is tried."""
    closed = Recorder(forbidden=True)
    for name in ("fetch_pvgis", "fetch_nasa", "pvgis_horizon", "_get_json"):
        monkeypatch.setattr(wx, name, closed)
    return closed


@pytest.fixture
def pvgis(monkeypatch, tmp_path):
    """A PVGIS that answers from memory. A cache on disk, if there were one, would land in tmp_path."""
    answer = Recorder(result=_pvgis_answer)
    monkeypatch.setattr(wx, "_get_json", answer)
    monkeypatch.setattr(wx, "CACHE_DIR", tmp_path / "cache", raising=False)
    monkeypatch.setattr(Path, "home", lambda: tmp_path / "home")
    return answer


# ── CSV ──────────────────────────────────────────────────────────────────────
def test_csv_text_gives_what_the_file_gives(tmp_path):
    path = tmp_path / "site.csv"
    path.write_text(CSV, encoding="utf-8")

    from_path = wx.read_csv(path, 18.52, 73.86)
    from_text = wx.parse_csv(CSV, 18.52, 73.86, name="site.csv")

    pd.testing.assert_frame_equal(from_text.data, from_path.data)
    assert replace(from_text, data=None) == replace(from_path, data=None)
    assert (from_text.source, from_text.label) == ("csv", "site.csv")
    assert list(from_text.data["ghi"])[:4] == [0, 0, 80, 310]
    assert from_text.t_max == 32.0


def test_csv_text_keeps_the_beam_and_diffuse_columns_it_has():
    data = wx.parse_csv(CSV, 18.52, 73.86).data

    assert list(data["dni"])[2:4] == [120, 480]
    assert list(data["dhi"])[2:4] == [50, 90]


def test_csv_text_with_irradiance_alone_is_split_into_beam_and_diffuse():
    data = wx.parse_csv(CSV_WITHOUT_DNI_AND_DHI, 18.52, 73.86).data

    assert list(data.columns) == ["ghi", "dni", "dhi", "temp_air", "wind_speed"]
    assert len(data) == 8
    assert (data["dni"] >= 0).all() and (data["dhi"] >= 0).all()
    assert (data["dhi"] <= data["ghi"]).all()
    assert list(data["dni"])[:2] == [0, 0] and list(data["dhi"])[:2] == [0, 0]
    assert (data["dni"].iloc[2:] > 0).all() and (data["dhi"].iloc[2:] > 0).all()


def test_the_split_places_the_sun_at_the_middle_of_the_hour():
    data = wx.parse_csv(CSV_WITHOUT_DNI_AND_DHI, 18.52, 73.86).data

    middle = data.index + pd.Timedelta(minutes=30)
    zenith = pvlib.solarposition.get_solarposition(middle, 18.52, 73.86)["zenith"].to_numpy()
    rebuilt = data["dhi"].to_numpy() + data["dni"].to_numpy() * np.cos(np.radians(zenith))

    assert rebuilt == pytest.approx(data["ghi"].to_numpy(), abs=1e-6)


def test_the_split_leaves_the_other_columns_as_the_file_has_them():
    whole = wx.parse_csv(CSV, 18.52, 73.86)
    split = wx.parse_csv(CSV_WITHOUT_DNI_AND_DHI, 18.52, 73.86)

    pd.testing.assert_frame_equal(
        split.data[["ghi", "temp_air", "wind_speed"]], whole.data[["ghi", "temp_air", "wind_speed"]]
    )
    assert replace(split, data=None) == replace(whole, data=None)


def test_a_year_of_irradiance_alone_is_split_hour_by_hour(pune_weather):
    hours = pune_weather.data
    text = "time,ghi,temp_air,wind_speed\n" + "\n".join(
        f"{t:%Y-%m-%d %H:%M},{row.ghi},{row.temp_air},{row.wind_speed}" for t, row in hours.iterrows()
    )

    split = wx.parse_csv(text, pune_weather.lat, pune_weather.lon).data

    assert list(split.index) == list(hours.index)
    assert split["ghi"].to_numpy() == pytest.approx(hours["ghi"].to_numpy())
    assert (split["dni"] >= 0).all() and (split["dhi"] >= 0).all()
    assert (split["dhi"] <= split["ghi"] + 1e-9).all()

    middle = split.index + pd.Timedelta(minutes=30)
    zenith = pvlib.solarposition.get_solarposition(middle, pune_weather.lat, pune_weather.lon)["zenith"]
    sun_up = (zenith < 85).to_numpy()
    rebuilt = split["dhi"] + split["dni"] * np.cos(np.radians(zenith.to_numpy()))
    assert rebuilt[sun_up].to_numpy() == pytest.approx(split["ghi"][sun_up].to_numpy(), abs=1e-6)
    assert (split["dni"][(zenith > 87).to_numpy()] == 0).all()

    # The split of Erbs as the engine gives it today, kept so that it cannot change unnoticed. It is
    # not what PVGIS has for the same hours (beam 1,999.6, diffuse 549.9 kWh/m2): the model differs.
    assert split["dni"].sum() / 1000 == pytest.approx(1435.4, abs=0.1)
    assert split["dhi"].sum() / 1000 == pytest.approx(822.7, abs=0.1)


def test_csv_text_without_a_name_is_labelled_as_a_csv_file():
    assert wx.parse_csv(CSV, 18.52, 73.86).label == "CSV file"


def test_csv_text_without_irradiance_is_refused_by_name():
    with pytest.raises(ValueError) as error:
        wx.parse_csv("time,Temp\n2023-06-01 00:00,24.0\n", 18.52, 73.86, name="site.csv")

    assert str(error.value).startswith("site.csv: no column named any of ghi, ")


def test_load_reads_csv_from_text_without_a_path(no_download):
    weather = wx.load("csv", 18.52, 73.86, csv_text=CSV)

    assert len(weather.data) == 8
    assert no_download.calls == []


def test_load_without_any_csv_asks_for_one():
    with pytest.raises(ValueError, match="Choose a CSV weather file."):
        wx.load("csv", 18.52, 73.86)


# ── the cache ────────────────────────────────────────────────────────────────
def test_memory_cache_gives_back_an_equal_weather_that_is_its_own(pune_weather):
    cache = wx.MemoryWeatherCache()
    cache.put("pune", pune_weather)

    got = cache.get("pune")

    assert got is not pune_weather and got.data is not pune_weather.data
    pd.testing.assert_frame_equal(got.data, pune_weather.data)
    assert replace(got, data=None) == replace(pune_weather, data=None)
    assert cache.get("somewhere else") is None


def test_memory_cache_is_not_changed_through_what_it_gave_back(pune_weather):
    cache = wx.MemoryWeatherCache()
    cache.put("pune", pune_weather)

    given = cache.get("pune").data
    given.iloc[0, 0] = -1.0

    pd.testing.assert_frame_equal(cache.get("pune").data, pune_weather.data)


def test_memory_cache_drops_the_entry_used_longest_ago(pune_weather):
    cache = wx.MemoryWeatherCache(max_entries=2)
    cache.put("a", pune_weather)
    cache.put("b", pune_weather)
    cache.get("a")
    cache.put("c", pune_weather)

    assert cache.get("b") is None
    assert cache.get("a") is not None and cache.get("c") is not None


def test_the_default_cache_lives_in_memory():
    assert isinstance(wx.DEFAULT_CACHE, wx.MemoryWeatherCache)
    assert not hasattr(wx, "CACHE_DIR")


def test_a_download_is_cached_in_the_cache_given_and_nothing_is_written(pvgis, tmp_path):
    cache = wx.MemoryWeatherCache()

    first = wx.fetch_pvgis(18.52, 73.86, cache=cache)
    asked = len(pvgis.calls)
    second = wx.fetch_pvgis(18.52, 73.86, cache=cache)

    assert asked == 2  # the weather and the horizon
    assert len(pvgis.calls) == asked
    pd.testing.assert_frame_equal(second.data, first.data)
    assert first.horizon == [(0.0, 1.5), (180.0, 2.7)]
    assert list(tmp_path.iterdir()) == []


def test_a_download_can_be_forced_past_the_cache(pvgis):
    cache = wx.MemoryWeatherCache()
    wx.fetch_pvgis(18.52, 73.86, cache=cache)

    wx.fetch_pvgis(18.52, 73.86, use_cache=False, cache=cache)

    assert len(pvgis.calls) == 4


def test_another_site_is_another_download(pvgis):
    cache = wx.MemoryWeatherCache()
    wx.fetch_pvgis(18.52, 73.86, cache=cache)

    wx.fetch_pvgis(19.07, 72.88, cache=cache)

    assert len(pvgis.calls) == 4


def test_load_hands_the_cache_to_the_download(pvgis):
    cache = wx.MemoryWeatherCache()

    wx.load("pvgis", 18.52, 73.86, cache=cache)
    wx.load("pvgis", 18.52, 73.86, cache=cache)

    assert len(pvgis.calls) == 2


# ── the design ───────────────────────────────────────────────────────────────
def test_loading_the_demo_never_downloads(no_download):
    design = Design(demo_project())

    weather = design.load_weather()

    assert (weather.source, weather.label) == ("pvgis", "PVGIS TMY")
    assert len(weather.data) == 8760
    assert no_download.calls == []


def test_a_project_without_weather_waits_for_it_instead_of_downloading(no_download):
    project = demo_project()
    project.weather_json = None
    design = Design(project)

    with pytest.raises(WeatherNotLoaded) as error:
        design.load_weather()

    assert str(error.value) == (
        "This project has no weather for 18.5200, 73.8600 yet. Load the PVGIS TMY weather first."
    )
    assert error.value.field == "weather_json"
    assert no_download.calls == []
    assert design.weather is None and project.weather_json is None


def test_weather_of_another_site_is_not_used_and_not_replaced_unasked(no_download):
    project = demo_project()
    project.roof.lat, project.roof.lon = 19.07, 72.88
    design = Design(project)

    with pytest.raises(WeatherNotLoaded) as error:
        design.load_weather()

    assert str(error.value) == (
        "The weather in this project is PVGIS TMY for 18.5200, 73.8600, not for this site or source. "
        "Load the PVGIS TMY weather for 19.0700, 72.8800."
    )
    assert no_download.calls == []


def test_prepare_does_not_download_either(no_download):
    project = demo_project()
    project.weather_json = None
    design = Design(project)

    with pytest.raises(WeatherNotLoaded):
        design.prepare()

    assert no_download.calls == []


def test_a_download_that_was_asked_for_is_embedded_in_the_project(pvgis):
    project = demo_project()
    project.weather_json = None
    design = Design(project)

    weather = design.load_weather(download=True, cache=wx.MemoryWeatherCache())

    assert len(pvgis.calls) == 2
    assert len(weather.data) == 24
    assert project.weather_json["source"] == "pvgis"
    assert len(project.weather_json["ghi"]) == 24


def test_csv_weather_embedded_as_text_is_read_without_a_file(no_download):
    project = demo_project()
    project.weather_json = None
    project.weather_source = "csv"
    project.weather_csv = "C:/Users/someone/site.csv"
    project.weather_csv_text = CSV
    design = Design(project)

    weather = design.load_weather()

    assert (weather.source, weather.label) == ("csv", "site.csv")
    assert project.weather_json["label"] == "site.csv"
    assert no_download.calls == []


def test_csv_weather_with_irradiance_alone_loads_into_a_design(no_download):
    project = demo_project()
    project.weather_json = None
    project.weather_source = "csv"
    project.weather_csv = "site.csv"
    project.weather_csv_text = CSV_WITHOUT_DNI_AND_DHI
    design = Design(project)

    weather = design.load_weather()

    assert len(weather.data) == 8
    assert sum(project.weather_json["dni"]) > 0 and sum(project.weather_json["dhi"]) > 0
    assert no_download.calls == []


def test_the_cache_can_be_used_by_many_at_once(pune_weather):
    from concurrent.futures import ThreadPoolExecutor

    cache = wx.MemoryWeatherCache(max_entries=3)
    small = replace(pune_weather, data=pune_weather.data.iloc[:24])

    def use(number: int) -> None:
        for turn in range(200):
            cache.put(f"site {(number + turn) % 7}", small)
            cache.get(f"site {(number * turn) % 7}")

    with ThreadPoolExecutor(max_workers=8) as pool:
        for done in [pool.submit(use, number) for number in range(8)]:
            done.result()

    assert sum(cache.get(f"site {i}") is not None for i in range(7)) == 3

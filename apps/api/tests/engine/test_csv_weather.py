"""A CSV weather file is checked before it is used: what the reader would let through in silence."""

import pytest

from rooftop_core import csv_weather
from rooftop_core import weather as wx
from rooftop_core.errors import UnusableWeatherFile

CSV = """time,GHI,DNI,DHI,Temp,Wind
2023-06-01 00:00,0,0,0,24.0,1.0
2023-06-01 01:00,0,0,0,23.5,1.2
2023-06-01 02:00,80,120,50,24.5,1.4
"""


def _year(columns: str, row: str, hours: int = 8760) -> str:
    start = wx.pd.Timestamp("2023-01-01")
    lines = [f"{start + wx.pd.Timedelta(hours=h):%Y-%m-%d %H:%M},{row}" for h in range(hours)]
    return f"time,{columns}\n" + "\n".join(lines) + "\n"


def test_a_good_file_is_the_weather_the_reader_gives():
    read = csv_weather.read(CSV, 18.52, 73.86, "site.csv")

    wx.pd.testing.assert_frame_equal(read.weather.data, wx.parse_csv(CSV, 18.52, 73.86, name="site.csv").data)
    assert (read.weather.source, read.weather.label) == ("csv", "site.csv")


def test_a_whole_year_with_beam_and_diffuse_has_nothing_to_note():
    assert csv_weather.read(_year("ghi,dni,dhi", "100,80,40"), 18.52, 73.86, "site.csv").notes == []


def test_a_leap_year_is_a_year():
    assert csv_weather.read(_year("ghi,dni,dhi", "100,80,40", 8784), 18.52, 73.86, "site.csv").notes == []


def test_fewer_hours_than_a_year_are_noted():
    assert csv_weather.read(CSV, 18.52, 73.86, "site.csv").notes == [
        "site.csv has 3 hours, not the 8,760 of a year. Energy of a year needs every hour of it."
    ]


def test_the_split_of_the_irradiance_is_noted():
    notes = csv_weather.read(_year("ghi", "100"), 18.52, 73.86, "site.csv").notes

    assert notes == [
        "site.csv has no beam and diffuse irradiance. They were worked out from the global irradiance "
        "(Erbs model), which is less exact than measured values."
    ]


def test_gaps_in_the_temperature_are_filled_as_the_reader_does():
    rows = [
        "time,ghi,dni,dhi,temp",
        "2023-06-01 00:00,1,1,1,20",
        "2023-06-01 01:00,1,1,1,",
        "2023-06-01 02:00,1,1,1,22",
    ]
    text = "\n".join(rows)

    assert list(csv_weather.read(text, 18.52, 73.86, "site.csv").weather.data["temp_air"]) == [20, 21, 22]


@pytest.mark.parametrize(
    ("text", "message"),
    [
        ("", "Choose a CSV weather file."),
        ("  \n", "Choose a CSV weather file."),
        (
            "time,Temp\n2023-06-01 00:00,24.0\n",
            "site.csv: no column named any of ghi, g(h), gh, global_horizontal, allsky_sfc_sw_dwn, "
            "irradiance",
        ),
        ("time,ghi\n", "site.csv has no hours: below its header there is no row."),
        (
            "time,ghi\nyesterday,100\n2023-06-01 01:00,200\nlater,300\n",
            "site.csv: the time cannot be read in 2 rows, the first of them row 1 (yesterday). "
            "Write it as 2023-06-01 13:00, in UTC.",
        ),
        (
            "time,ghi\n2023-06-01 00:00,100\n2023-06-01 01:00,200\n2023-06-01 00:00,300\n",
            "site.csv: 1 hour is there more than once, the first of them 2023-06-01 00:00. "
            "Every hour may be there once.",
        ),
        (
            "time,ghi,wind\n2023-06-01 00:00,100,\n2023-06-01 01:00,200,2\n",
            "site.csv: wind_speed has no value in 1 row, the first of them row 1. Fill the gaps, or "
            "leave the column out.",
        ),
        (
            "time,ghi,temp\n2023-06-01 00:00,100,warm\n2023-06-01 01:00,200,hot\n",
            "site.csv: temp_air has no value in 2 rows, the first of them row 1. Fill the gaps, or "
            "leave the column out.",
        ),
    ],
)
def test_a_file_that_cannot_be_used_is_refused_with_the_reason(text, message):
    with pytest.raises(UnusableWeatherFile) as error:
        csv_weather.read(text, 18.52, 73.86, "site.csv")

    assert str(error.value) == message
    assert error.value.field == "weather_csv_text"


def test_every_hour_of_what_is_read_has_every_value():
    weather = csv_weather.read(_year("ghi", "100"), 18.52, 73.86).weather

    assert wx.np.isfinite(weather.data.to_numpy()).all()
    assert weather.data.index.is_unique and not weather.data.index.hasnans

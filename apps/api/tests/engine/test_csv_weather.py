"""A CSV weather file is checked before it is used: what the reader would let through in silence."""

import pytest

from rooftop_core import csv_weather
from rooftop_core import weather as wx
from rooftop_core.errors import UnusableWeatherFile

EVERY_COLUMN = "ghi,dni,dhi,temp,wind"
A_ROW = "100,80,40,25,2"


def _year(columns: str, row: str, hours: int = 8760) -> str:
    start = wx.pd.Timestamp("2023-01-01")
    lines = [f"{start + wx.pd.Timedelta(hours=h):%Y-%m-%d %H:%M},{row}" for h in range(hours)]
    return f"time,{columns}\n" + "\n".join(lines) + "\n"


def test_a_good_file_is_the_weather_the_reader_gives():
    text = _year(EVERY_COLUMN, A_ROW)
    read = csv_weather.read(text, 18.52, 73.86, "site.csv")

    wx.pd.testing.assert_frame_equal(
        read.weather.data, wx.parse_csv(text, 18.52, 73.86, name="site.csv").data
    )
    assert (read.weather.source, read.weather.label) == ("csv", "site.csv")


def test_a_whole_year_with_every_column_has_nothing_to_note():
    assert csv_weather.read(_year(EVERY_COLUMN, A_ROW), 18.52, 73.86, "site.csv").notes == []


def test_a_leap_year_is_a_year():
    assert csv_weather.read(_year(EVERY_COLUMN, A_ROW, 8784), 18.52, 73.86, "site.csv").notes == []


# #179, item 20: the energy of a year, PR, the P-values and 25 years are worked out from the hours given, so a
# file that is not a whole year would give figures of a year that are not.
@pytest.mark.parametrize(("hours", "said"), [(3, "3 hours"), (1, "1 hour"), (8759, "8,759 hours")])
def test_a_file_that_is_not_a_whole_year_is_refused(hours, said):
    with pytest.raises(UnusableWeatherFile) as error:
        csv_weather.read(_year(EVERY_COLUMN, A_ROW, hours), 18.52, 73.86, "site.csv")

    assert str(error.value) == (
        f"site.csv has {said}. A year has 8,760, a leap year 8,784. Give a whole year."
    )
    assert error.value.field == "weather_csv_text"


# The words of the notes, approved by the owner (plan/phase-08-plan.md, decision 14).
ERBS_NOTE = (
    "site.csv has no beam and diffuse irradiance. The app works them out from the global irradiance, "
    "less exactly than a measurement (Erbs model)."
)
TEMPERATURE_NOTE = (
    "site.csv has no air temperature. The app takes 25 °C for all hours and sizes the strings for "
    "25 °C. In the Strings step, enter the site's lowest and highest ambient."
)
WIND_NOTE = "site.csv has no wind speed. The app takes 1 m/s for all hours."


def test_a_file_of_time_and_irradiance_alone_has_the_three_notes_in_this_order():
    notes = csv_weather.read(_year("ghi", "100"), 18.52, 73.86, "site.csv").notes

    assert notes == [ERBS_NOTE, TEMPERATURE_NOTE, WIND_NOTE]


def test_a_file_without_wind_alone_has_the_wind_note_alone():
    notes = csv_weather.read(_year("ghi,dni,dhi,temp", "100,80,40,25"), 18.52, 73.86, "site.csv").notes

    assert notes == [WIND_NOTE]


def test_a_file_without_temperature_alone_has_the_temperature_note_alone():
    notes = csv_weather.read(_year("ghi,dni,dhi,wind", "100,80,40,2"), 18.52, 73.86, "site.csv").notes

    assert notes == [TEMPERATURE_NOTE]


def test_the_notes_name_the_file():
    notes = csv_weather.read(_year("ghi", "100"), 18.52, 73.86, "pune-ghi.csv").notes

    assert [note.split(" has no ")[0] for note in notes] == ["pune-ghi.csv"] * 3


def test_the_notes_change_no_number():
    text = _year("ghi", "100")

    wx.pd.testing.assert_frame_equal(
        csv_weather.read(text, 18.52, 73.86, "site.csv").weather.data, wx.parse_csv(text, 18.52, 73.86).data
    )


def test_gaps_in_the_temperature_are_filled_as_the_reader_does():
    year = _year("ghi,dni,dhi,temp", "1,1,1,20").splitlines()
    year[2] = year[2].rsplit(",", 1)[0] + ","  # the second hour has no temperature
    year[3] = year[3].rsplit(",", 1)[0] + ",22"

    temperatures = csv_weather.read("\n".join(year), 18.52, 73.86, "site.csv").weather.data["temp_air"]

    assert list(temperatures[:3]) == [20, 21, 22]


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
        ("time,ghi\n", "site.csv has a header and no rows of hours."),
        (
            "time,ghi\nyesterday,100\n2023-06-01 01:00,200\nlater,300\n",
            "site.csv: the app cannot read the time in 2 rows. The first is on line 2: yesterday. "
            "Write it as 2023-06-01 13:00, in UTC.",
        ),
        (
            "time,ghi\n2023-06-01 00:00,100\n2023-06-01 01:00,200\n2023-06-01 00:00,300\n",
            "site.csv: 1 hour appears more than once. The first is 2023-06-01 00:00. Keep each hour once.",
        ),
        (
            "time,ghi,wind\n2023-06-01 00:00,100,\n2023-06-01 01:00,200,2\n",
            "site.csv: wind is empty in 1 row. The first is on line 2. Fill the gaps, or "
            "leave the column out.",
        ),
        (
            "time,ghi,temp\n2023-06-01 00:00,100,warm\n2023-06-01 01:00,200,hot\n",
            "site.csv: temp is empty in 2 rows. The first is on line 2. Fill the gaps, or "
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


# ── rows of less than an hour (Phase 13: the simulation takes a row as an hour) ─────────────────────────
def _rows_every(minutes: int, hours: int, value_of) -> str:
    """A file with a row every *minutes* for *hours* hours, the values *value_of*(hour, row of the hour)."""
    start = wx.pd.Timestamp("2023-06-01")
    lines = []
    for h in range(hours):
        for k in range(60 // minutes):
            t = start + wx.pd.Timedelta(hours=h, minutes=k * minutes)
            lines.append(f"{t:%Y-%m-%d %H:%M},{value_of(h, k)}")
    return f"time,{EVERY_COLUMN}\n" + "\n".join(lines) + "\n"


def test_rows_of_fifteen_minutes_are_averaged_into_the_hour_they_begin_in():
    text = _rows_every(15, 3, lambda h, k: f"{100 * h + 10 * k},{50 * h},{20 * h},{25 + k},{1 + h}")

    weather = wx.parse_csv(text, 18.52, 73.86, name="site.csv")

    assert len(weather.data) == 3
    assert list(weather.data.index.strftime("%H:%M")) == ["00:00", "01:00", "02:00"]
    assert list(weather.data["ghi"]) == [15.0, 115.0, 215.0]  # the mean of +0, +10, +20, +30
    assert list(weather.data["temp_air"]) == [26.5, 26.5, 26.5]
    assert list(weather.data["wind_speed"]) == [1.0, 2.0, 3.0]


def test_rows_that_repeat_each_hour_give_the_hourly_weather_exactly():
    hourly = _rows_every(60, 24, lambda h, k: f"{40 * h},{30 * h},{10 * h},{20 + h},{h / 10}")
    quarters = _rows_every(15, 24, lambda h, k: f"{40 * h},{30 * h},{10 * h},{20 + h},{h / 10}")

    wx.pd.testing.assert_frame_equal(
        wx.parse_csv(quarters, 18.52, 73.86, name="q.csv").data,
        wx.parse_csv(hourly, 18.52, 73.86, name="h.csv").data,
        check_dtype=False,  # an hourly file of whole numbers stays integer; an average is a float
    )


def test_a_file_of_rows_under_an_hour_says_so_and_an_hourly_one_does_not():
    quarters = csv_weather.read(_rows_every(15, 8760, lambda h, k: A_ROW), 18.52, 73.86, "site.csv")
    hourly = csv_weather.read(_year(EVERY_COLUMN, A_ROW), 18.52, 73.86, "site.csv")

    assert quarters.notes[0] == (
        "site.csv gives the weather in steps of 15 minutes. The app averages the rows of each hour: "
        "the run takes one row an hour."
    )
    assert not any("minutes" in note for note in hourly.notes)


def test_without_beam_and_diffuse_the_hours_are_split_after_they_are_averaged():
    columns, value = "ghi,temp,wind", lambda h, k: f"{0 if h < 6 else 600},25,1"
    start = wx.pd.Timestamp("2023-06-01")
    quarter_lines = [
        f"{start + wx.pd.Timedelta(minutes=15 * i):%Y-%m-%d %H:%M},{value(i // 4, i % 4)}" for i in range(48)
    ]
    hour_lines = [f"{start + wx.pd.Timedelta(hours=h):%Y-%m-%d %H:%M},{value(h, 0)}" for h in range(12)]

    quarters = wx.parse_csv(f"time,{columns}\n" + "\n".join(quarter_lines) + "\n", 18.52, 73.86)
    hours = wx.parse_csv(f"time,{columns}\n" + "\n".join(hour_lines) + "\n", 18.52, 73.86)

    wx.pd.testing.assert_frame_equal(quarters.data, hours.data, check_dtype=False)


# ── what the reader made of a cell in silence (#179, item 19) ──────────────────────────────────────────────
def _year_with(columns: str, row: str, changes: dict[int, str]) -> str:
    """A year of *row*, the rows numbered in *changes* (1: the first below the header) given instead."""
    lines = _year(columns, row).splitlines()
    for number, values in changes.items():
        lines[number] = lines[number].split(",", 1)[0] + "," + values
    return "\n".join(lines) + "\n"


@pytest.mark.parametrize(
    ("changes", "message"),
    [
        (
            {2: ",80,40,25,2", 9: "n/a,80,40,25,2"},
            "site.csv: ghi is empty in 2 rows. The first is on line 3. "
            "Fill the gaps in the irradiance column.",
        ),
        (
            {5: "100,,40,25,2"},
            "site.csv: dni is empty in 1 row. The first is on line 6. Fill the gaps, or leave out "
            "both beam and diffuse.",
        ),
    ],
)
def test_irradiance_with_no_value_is_refused_not_taken_as_zero(changes, message):
    with pytest.raises(UnusableWeatherFile) as error:
        csv_weather.read(_year_with(EVERY_COLUMN, A_ROW, changes), 18.52, 73.86, "site.csv")

    assert str(error.value) == message
    assert error.value.field == "weather_csv_text"


def test_irradiance_below_zero_is_taken_as_zero_and_noted():
    read = csv_weather.read(
        _year_with(EVERY_COLUMN, A_ROW, {1: "-2,0,-1,25,2", 2: "-1,0,0,25,2"}), 18.52, 73.86, "site.csv"
    )

    assert read.notes == ["site.csv has irradiance below zero in 2 rows. The app takes it as 0."]
    assert (read.weather.data[["ghi", "dhi"]].iloc[:2].to_numpy() == 0).all()


def test_gaps_in_the_temperature_are_filled_and_noted():
    read = csv_weather.read(_year_with(EVERY_COLUMN, A_ROW, {3: "100,80,40,,2"}), 18.52, 73.86, "site.csv")

    assert read.notes == [
        "site.csv has no air temperature in 1 row. The app takes it from the hours on either side."
    ]


# ── the refusals point at the file as the user sees it (#179, item 21) ─────────────────────────────────────
def test_a_gap_is_named_by_the_file_s_own_column_and_its_line_comments_and_header_counted():
    text = "# Station 7, Pune\n# 2023, UTC\ntime,ghi,Wind\n2023-06-01 00:00,100,1\n2023-06-01 01:00,200,\n"

    with pytest.raises(UnusableWeatherFile) as error:
        csv_weather.read(text, 18.52, 73.86, "site.csv")

    assert str(error.value) == (
        "site.csv: Wind is empty in 1 row. The first is on line 5. Fill the gaps, or leave the column out."
    )

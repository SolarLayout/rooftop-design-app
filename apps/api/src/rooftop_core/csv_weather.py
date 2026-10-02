"""CSV weather, checked before it is used.

The reader (weather.parse_csv) takes what it gets: a time it cannot read becomes no time, a gap in the
wind stays a gap, an hour may be there twice. Each of these ends in results that are wrong without a
word. Here the file is refused instead, with the row and what to do about it.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from . import weather as wx
from .errors import UnusableWeatherFile

FIELD = "weather_csv_text"
HOURS_OF_A_YEAR = (8760, 8784)


@dataclass
class CsvWeather:
    weather: wx.Weather
    notes: list[str] = field(default_factory=list)  # what the user should know about this file


def read(text: str, lat: float, lon: float, name: str = "", tz_offset_h: float = 0.0) -> CsvWeather:
    """The weather of a CSV text, or UnusableWeatherFile with the reason.

    *name* names the file in the result, the notes and the errors.
    """
    label = name or wx.SOURCE_LABELS["csv"]
    if not text.strip():
        raise UnusableWeatherFile("Choose a CSV weather file.", field=FIELD)
    try:
        raw = wx.csv_table(text)
        _check(raw, label, tz_offset_h)
        weather = wx.parse_csv(text, lat, lon, tz_offset_h, name)
    except UnusableWeatherFile:
        raise
    except (ValueError, csv.Error, pd.errors.ParserError) as error:
        message = str(error)
        if not message.startswith(f"{label}: "):
            message = f"{label} cannot be read as a table of hours: {message}."
        raise UnusableWeatherFile(message, field=FIELD) from error
    _check_values(weather, raw, label)
    return CsvWeather(weather, _notes(weather, raw, label))


def _check(raw: pd.DataFrame, label: str, tz_offset_h: float) -> None:
    """What can be seen before the reader runs. Missing columns are left to the reader, which names them."""
    time = wx.csv_column(raw, wx.CSV_COLUMNS["time"])
    if time is None or wx.csv_column(raw, wx.CSV_COLUMNS["ghi"]) is None:
        return
    if len(raw) == 0:
        raise UnusableWeatherFile(f"{label} has no hours: below its header there is no row.", field=FIELD)
    times = wx.csv_times(time, tz_offset_h)
    unread = times.isna().to_numpy()
    if unread.any():
        first = int(np.argmax(unread))
        raise UnusableWeatherFile(
            f"{label}: the time cannot be read in {_rows(int(unread.sum()))}, the first of them row "
            f"{first + 1} ({str(time.iloc[first]).strip()}). Write it as 2023-06-01 13:00, in UTC.",
            field=FIELD,
        )
    repeated = times[times.duplicated(keep="first")]
    if len(repeated):
        hours = repeated.nunique()
        raise UnusableWeatherFile(
            f"{label}: {hours} {'hour is' if hours == 1 else 'hours are'} there more than once, the first "
            f"of them {repeated.iloc[0]:%Y-%m-%d %H:%M}. Every hour may be there once.",
            field=FIELD,
        )


def _check_values(weather: wx.Weather, raw: pd.DataFrame, label: str) -> None:
    """Every hour needs every value. The reader fills some gaps itself; what is left is a fault."""
    for column in weather.data.columns:
        if np.isfinite(weather.data[column].to_numpy()).all():
            continue
        given = wx.csv_column(raw, wx.CSV_COLUMNS[column])
        missing = pd.to_numeric(given, errors="coerce").isna().to_numpy()
        raise UnusableWeatherFile(
            f"{label}: {column} has no value in {_rows(int(missing.sum()))}, the first of them row "
            f"{int(np.argmax(missing)) + 1}. Fill the gaps, or leave the column out.",
            field=FIELD,
        )


def _notes(weather: wx.Weather, raw: pd.DataFrame, label: str) -> list[str]:
    notes = []
    if any(wx.csv_column(raw, wx.CSV_COLUMNS[column]) is None for column in ("dni", "dhi")):
        notes.append(
            f"{label} has no beam and diffuse irradiance. They were worked out from the global "
            "irradiance (Erbs model), which is less exact than measured values."
        )
    # The reader takes 25 °C and 1 m/s for a column that is missing (weather.parse_csv). Strings sized at
    # 25 °C can be longer than the site's cold allows, so the note says what to do about it.
    if wx.csv_column(raw, wx.CSV_COLUMNS["temp_air"]) is None:
        notes.append(
            f"{label} has no air temperature. 25 °C was taken for every hour, so the strings are sized for "
            "25 °C. Enter the site's lowest and highest ambient in the Strings lens."
        )
    if wx.csv_column(raw, wx.CSV_COLUMNS["wind_speed"]) is None:
        notes.append(f"{label} has no wind speed. 1 m/s was taken for every hour.")
    if len(weather.data) not in HOURS_OF_A_YEAR:
        notes.append(
            f"{label} has {len(weather.data):,} {'hour' if len(weather.data) == 1 else 'hours'}, not the "
            "8,760 of a year. Energy of a year needs every hour of it."
        )
    return notes


def _rows(count: int) -> str:
    return f"{count:,} {'row' if count == 1 else 'rows'}"

"""CSV weather, checked before it is used.

The reader (weather.parse_csv) takes what it gets: a time it cannot read becomes no time, a gap in the
wind stays a gap, an hour may be there twice. Each of these ends in results that are wrong without a
word. Here the file is refused instead, with what to do about it: the column by the file's own header, and
the line of the file as an editor numbers it, the header and the comments counted (#179, item 21).
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
    lines = _lines_of_rows(text)
    try:
        raw = wx.csv_table(text)
        _check(raw, label, tz_offset_h, lines)
        _check_irradiance(raw, label, lines)
        weather = wx.parse_csv(text, lat, lon, tz_offset_h, name)
    except UnusableWeatherFile:
        raise
    except (ValueError, csv.Error, pd.errors.ParserError) as error:
        message = str(error)
        if not message.startswith(f"{label}: "):
            message = f"{label} cannot be read as a table of hours: {message}."
        raise UnusableWeatherFile(message, field=FIELD) from error
    _check_values(weather, raw, label, lines)
    _check_a_whole_year(weather, label)
    return CsvWeather(weather, _notes(weather, raw, label))


def _lines_of_rows(text: str) -> list[int]:
    """The line of the file, from 1, of each row of the table csv_table reads: the lines that are blank or
    begin with # are left out, and the first line left is the header."""
    kept = [
        n
        for n, line in enumerate(text.splitlines(), start=1)
        if line.strip() and not line.lstrip().startswith("#")
    ]
    return kept[1:]


def _line(lines: list[int], row: int) -> int:
    """The line of the file of the row *row* of the table, from 0."""
    return lines[row] if row < len(lines) else row + 2


def _check(raw: pd.DataFrame, label: str, tz_offset_h: float, lines: list[int]) -> None:
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
            f"{label}: the time cannot be read in {_rows(int(unread.sum()))}, the first of them on line "
            f"{_line(lines, first)} ({str(time.iloc[first]).strip()}). Write it as 2023-06-01 13:00, in UTC.",
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


def _check_irradiance(raw: pd.DataFrame, label: str, lines: list[int]) -> None:
    """The reader takes a cell of irradiance it cannot read as 0 W/m²: an hour of none. Refused instead
    (#179, item 19)."""
    ghi = wx.csv_column(raw, wx.CSV_COLUMNS["ghi"])
    if ghi is None:
        return
    _refuse_gaps(ghi, label, lines, "Fill the gaps: an hour without its irradiance is not an hour of none.")
    dni, dhi = wx.csv_column(raw, wx.CSV_COLUMNS["dni"]), wx.csv_column(raw, wx.CSV_COLUMNS["dhi"])
    if dni is not None and dhi is not None:  # with one of them alone, both are worked out from the GHI
        for column in (dni, dhi):
            _refuse_gaps(column, label, lines, "Fill the gaps, or leave out both beam and diffuse.")


def _refuse_gaps(column: pd.Series, label: str, lines: list[int], advice: str) -> None:
    missing = pd.to_numeric(column, errors="coerce").isna().to_numpy()
    if missing.any():
        raise UnusableWeatherFile(_gaps(column, missing, label, lines, advice), field=FIELD)


def _gaps(column: pd.Series, missing: np.ndarray, label: str, lines: list[int], advice: str) -> str:
    """The refusal of a column with gaps, by the file's own header and the line of its first gap."""
    return (
        f"{label}: {str(column.name).strip()} has no value in {_rows(int(missing.sum()))}, "
        f"the first of them on line {_line(lines, int(np.argmax(missing)))}. {advice}"
    )


def _check_values(weather: wx.Weather, raw: pd.DataFrame, label: str, lines: list[int]) -> None:
    """Every hour needs every value. The reader fills some gaps itself; what is left is a fault."""
    for column in weather.data.columns:
        if np.isfinite(weather.data[column].to_numpy()).all():
            continue
        given = wx.csv_column(raw, wx.CSV_COLUMNS[column])
        missing = pd.to_numeric(given, errors="coerce").isna().to_numpy()
        raise UnusableWeatherFile(
            _gaps(given, missing, label, lines, "Fill the gaps, or leave the column out."), field=FIELD
        )


def _check_a_whole_year(weather: wx.Weather, label: str) -> None:
    """The energy of a year, PR, the P-values and 25 years come from the hours given (#179, item 20)."""
    hours = len(weather.data)
    if hours not in HOURS_OF_A_YEAR:
        raise UnusableWeatherFile(
            f"{label} has {hours:,} {'hour' if hours == 1 else 'hours'}, not the 8,760 of a year "
            "(8,784 in a leap year). The energy of a year needs every hour of it: give a whole year.",
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
    times = pd.DatetimeIndex(wx.csv_times(wx.csv_column(raw, wx.CSV_COLUMNS["time"]), 0.0)).dropna()
    step = wx.minutes_between_rows(times)
    if step < 60:
        notes.append(
            f"{label} gives the weather every {step:g} minutes. Each hour is the average of its rows "
            "(the simulation takes a row as an hour)."
        )
    notes.extend(_notes_of_cells(raw, label))
    return notes


def _notes_of_cells(raw: pd.DataFrame, label: str) -> list[str]:
    """What the reader made of cells that are there: irradiance below zero, gaps in the temperature
    (#179, item 19)."""
    notes = []
    given = [wx.csv_column(raw, wx.CSV_COLUMNS[column]) for column in ("ghi", "dni", "dhi")]
    values = [pd.to_numeric(column, errors="coerce").to_numpy() for column in given if column is not None]
    below = int(np.any(np.vstack(values) < 0, axis=0).sum()) if values else 0
    if below:
        notes.append(f"{label} has irradiance below zero in {_rows(below)}. It was taken as 0.")
    temperature = wx.csv_column(raw, wx.CSV_COLUMNS["temp_air"])
    if temperature is not None:
        gaps = int(pd.to_numeric(temperature, errors="coerce").isna().sum())
        if gaps:
            notes.append(
                f"{label} has no air temperature in {_rows(gaps)}. "
                "It was taken from the hours on either side."
            )
    return notes


def _rows(count: int) -> str:
    return f"{count:,} {'row' if count == 1 else 'rows'}"

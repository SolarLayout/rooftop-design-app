# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Hourly weather: PVGIS TMY, NASA POWER, or a CSV file.

Every source ends up as the same table, indexed by the hour's start in UTC, with
ghi, dni, dhi (W/m²), temp_air (°C) and wind_speed (m/s). Values are treated as
averages over the hour, so the sun is placed at the middle of each hour.
Downloads are kept in a cache the caller can replace; the default one lives in
memory. Nothing is written to disk.
"""

from __future__ import annotations

import io
import json
import threading
from collections import OrderedDict
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Protocol

import numpy as np
import pandas as pd
import pvlib
import requests

from .paths import file_name

PVGIS = "https://re.jrc.ec.europa.eu/api/v5_3"
NASA = "https://power.larc.nasa.gov/api/temporal/hourly/point"
SOURCES = ("pvgis", "nasa", "csv")
SOURCE_LABELS = {"pvgis": "PVGIS TMY", "nasa": "NASA POWER", "csv": "CSV file"}


@dataclass
class Weather:
    data: pd.DataFrame
    lat: float
    lon: float
    source: str
    label: str
    horizon: list[tuple[float, float]] = field(default_factory=list)  # (azimuth from north, elevation)

    @property
    def t_min(self) -> float:
        return float(self.data["temp_air"].min())

    @property
    def t_max(self) -> float:
        return float(self.data["temp_air"].max())

    @property
    def ghi_kwh(self) -> float:
        return float(self.data["ghi"].sum()) / 1000.0

    def to_json(self) -> dict:
        d = self.data
        return {
            "lat": self.lat, "lon": self.lon, "source": self.source, "label": self.label,
            "horizon": self.horizon,
            "time": [t.isoformat() for t in d.index],
            **{c: [round(float(v), 2) for v in d[c]] for c in ("ghi", "dni", "dhi", "temp_air", "wind_speed")},
        }

    @classmethod
    def from_json(cls, j: dict) -> Weather:
        idx = pd.DatetimeIndex(pd.to_datetime(j["time"], utc=True))
        df = pd.DataFrame({c: j[c] for c in ("ghi", "dni", "dhi", "temp_air", "wind_speed")}, index=idx)
        return cls(df, j["lat"], j["lon"], j["source"], j["label"], [tuple(h) for h in j.get("horizon", [])])


class WeatherCache(Protocol):
    """Where downloads are kept. Anything with these two methods can stand in for the default."""

    def get(self, key: str) -> Weather | None: ...

    def put(self, key: str, weather: Weather) -> None: ...


class MemoryWeatherCache:
    """Downloads kept in this process. When full, the entry used longest ago goes first.

    Many threads may use it at once: a server answers several requests at a time.
    """

    def __init__(self, max_entries: int = 16):
        self.max_entries = max_entries
        self._entries: OrderedDict[str, Weather] = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> Weather | None:
        with self._lock:
            found = self._entries.get(key)
            if found is None:
                return None
            self._entries.move_to_end(key)
        return _copy(found)

    def put(self, key: str, weather: Weather) -> None:
        own = _copy(weather)
        with self._lock:
            self._entries[key] = own
            self._entries.move_to_end(key)
            while len(self._entries) > self.max_entries:
                self._entries.popitem(last=False)


def _copy(w: Weather) -> Weather:
    """A weather of its own, so a change to it never reaches the cache."""
    return replace(w, data=w.data.copy(), horizon=list(w.horizon))


DEFAULT_CACHE = MemoryWeatherCache()


class WeatherServiceError(RuntimeError):
    """A weather service answered, but not with weather. *said* is its own message, when it gave one."""

    def __init__(self, host: str, status: int, text: str):
        super().__init__(f"{host} answered {status}: {text[:200]}")
        self.host = host
        self.status = status
        self.said = _message_in(text)


def _message_in(text: str) -> str:
    """The message of an answer like {"message": "..."}; empty when there is none."""
    try:
        body = json.loads(text)
    except ValueError:
        return ""
    message = body.get("message") if isinstance(body, dict) else None
    return message.strip() if isinstance(message, str) else ""


def _get_json(url: str, params: dict, timeout: float = 60.0) -> dict:
    r = requests.get(url, params=params, timeout=timeout)
    if r.status_code != 200:
        raise WeatherServiceError(url.split('/')[2], r.status_code, r.text)
    return r.json()


def pvgis_horizon(lat: float, lon: float) -> list[tuple[float, float]]:
    j = _get_json(f"{PVGIS}/printhorizon", {"lat": lat, "lon": lon, "outputformat": "json"})
    # PVGIS azimuth: 0 = south, 90 = west.
    pts = {round((p["A"] + 180.0) % 360.0, 3): float(p["H_hor"]) for p in j["outputs"]["horizon_profile"]}
    return sorted(pts.items())


def parse_pvgis_tmy(j: dict, lat: float, lon: float, horizon=None) -> Weather:
    rows = j["outputs"]["tmy_hourly"]
    times = pd.to_datetime([r["time(UTC)"] for r in rows], format="%Y%m%d:%H%M", utc=True)
    df = pd.DataFrame({
        "ghi": [r["G(h)"] for r in rows], "dni": [r["Gb(n)"] for r in rows], "dhi": [r["Gd(h)"] for r in rows],
        "temp_air": [r["T2m"] for r in rows], "wind_speed": [r["WS10m"] for r in rows],
    }, index=times)
    # TMY months come from different years: put them on one calendar year for display.
    df.index = pd.DatetimeIndex([t.replace(year=2019) for t in df.index])
    df = df.sort_index()
    return Weather(df, lat, lon, "pvgis", "PVGIS TMY", horizon or [])


def _cached(cache: WeatherCache, key: str, use_cache: bool) -> Weather | None:
    return cache.get(key) if use_cache else None


def fetch_pvgis(lat: float, lon: float, use_cache: bool = True, cache: WeatherCache | None = None) -> Weather:
    cache = DEFAULT_CACHE if cache is None else cache
    key = f"pvgis:{lat:.4f}:{lon:.4f}"
    hit = _cached(cache, key, use_cache)
    if hit is not None:
        return hit
    j = _get_json(f"{PVGIS}/tmy", {"lat": lat, "lon": lon, "outputformat": "json"})
    try:
        hz = pvgis_horizon(lat, lon)
    except Exception:  # horizon is optional
        hz = []
    w = parse_pvgis_tmy(j, lat, lon, hz)
    cache.put(key, w)
    return w


def fetch_nasa(lat: float, lon: float, year: int = 2023, use_cache: bool = True,
               cache: WeatherCache | None = None) -> Weather:
    cache = DEFAULT_CACHE if cache is None else cache
    key = f"nasa:{lat:.4f}:{lon:.4f}:{year}"
    hit = _cached(cache, key, use_cache)
    if hit is not None:
        return hit
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF,T2M,WS10M",
        "community": "RE", "longitude": lon, "latitude": lat,
        "start": f"{year}0101", "end": f"{year}1231", "format": "JSON", "time-standard": "UTC",
    }
    j = _get_json(NASA, params, timeout=120.0)
    p = j["properties"]["parameter"]
    keys = sorted(p["T2M"].keys())
    times = pd.to_datetime(keys, format="%Y%m%d%H", utc=True)

    def col(name):
        v = np.array([p[name][k] for k in keys], dtype=float)
        return np.where(v <= -900, np.nan, v)

    df = pd.DataFrame({
        "ghi": col("ALLSKY_SFC_SW_DWN"), "dni": col("ALLSKY_SFC_SW_DNI"), "dhi": col("ALLSKY_SFC_SW_DIFF"),
        "temp_air": col("T2M"), "wind_speed": col("WS10M"),
    }, index=times)
    df = df.interpolate(limit_direction="both").clip(lower=-60)
    df[["ghi", "dni", "dhi"]] = df[["ghi", "dni", "dhi"]].clip(lower=0)
    w = Weather(df, lat, lon, "nasa", f"NASA POWER {year}")
    cache.put(key, w)
    return w


_TIME = ("time", "time(utc)", "datetime", "date", "timestamp", "date/time")
_GHI = ("ghi", "g(h)", "gh", "global_horizontal", "allsky_sfc_sw_dwn", "irradiance")
_DNI = ("dni", "gb(n)", "bn", "allsky_sfc_sw_dni")
_DHI = ("dhi", "gd(h)", "dh", "diffuse", "allsky_sfc_sw_diff")
_TEMP = ("temp_air", "t2m", "temp", "temperature", "tamb", "t_amb", "ambient_temp")
_WIND = ("wind_speed", "ws10m", "wind", "ws")
# The names a column of a CSV may bear, by what it holds.
CSV_COLUMNS = {"time": _TIME, "ghi": _GHI, "dni": _DNI, "dhi": _DHI, "temp_air": _TEMP, "wind_speed": _WIND}


def read_csv(path: str | Path, lat: float, lon: float, tz_offset_h: float = 0.0) -> Weather:
    """The CSV file at *path*; see parse_csv."""
    return parse_csv(Path(path).read_text(encoding="utf-8"), lat, lon, tz_offset_h, Path(path).name)


def csv_table(text: str) -> pd.DataFrame:
    """The rows and columns of a CSV text, whatever separates them. Lines that begin with # are left out."""
    return pd.read_csv(io.StringIO(text), sep=None, engine="python", comment="#")


def csv_column(raw: pd.DataFrame, names: tuple[str, ...]) -> pd.Series | None:
    """The first column of *raw* that bears one of *names*, whatever the case; None when there is none."""
    cols = {c.strip().lower(): c for c in raw.columns}
    for n in names:
        if n in cols:
            return raw[cols[n]]
    return None


def csv_times(column: pd.Series, tz_offset_h: float = 0.0) -> pd.Series:
    """The times of a column in UTC. A time that cannot be read is NaT."""
    ts = column.astype(str).str.strip()
    t = pd.to_datetime(ts, format="%Y%m%d:%H%M", errors="coerce")
    if t.isna().mean() > 0.5:
        t = pd.to_datetime(ts, errors="coerce", format="mixed")
    return t - pd.Timedelta(hours=tz_offset_h)


def parse_csv(text: str, lat: float, lon: float, tz_offset_h: float = 0.0, name: str = "") -> Weather:
    """Any hourly CSV with a time and a GHI column; DNI/DHI are split from GHI when missing.

    *text* is the content of the file; *name* names it in the result and in errors.
    """
    name = name or SOURCE_LABELS["csv"]
    raw = csv_table(text)

    def pick(names, required=False):
        found = csv_column(raw, names)
        if found is None and required:
            raise ValueError(f"{name}: no column named any of {', '.join(names)}")
        return found

    t = csv_times(pick(_TIME, True), tz_offset_h)
    idx = pd.DatetimeIndex(t).tz_localize("UTC") if pd.DatetimeIndex(t).tz is None else pd.DatetimeIndex(t)
    ghi = pd.to_numeric(pick(_GHI, True), errors="coerce").fillna(0).clip(lower=0).to_numpy()
    temp = pick(_TEMP)
    wind = pick(_WIND)
    df = pd.DataFrame({
        "ghi": ghi,
        "temp_air": pd.to_numeric(temp, errors="coerce").to_numpy() if temp is not None else 25.0,
        "wind_speed": pd.to_numeric(wind, errors="coerce").to_numpy() if wind is not None else 1.0,
    }, index=idx)
    dni, dhi = pick(_DNI), pick(_DHI)
    if dni is not None and dhi is not None:
        df["dni"] = pd.to_numeric(dni, errors="coerce").fillna(0).to_numpy()
        df["dhi"] = pd.to_numeric(dhi, errors="coerce").fillna(0).to_numpy()
    else:
        # The sun is placed at the middle of the hour; its values go in without that index, which
        # is half an hour later than the irradiance and would not line up with it.
        sp = pvlib.solarposition.get_solarposition(idx + pd.Timedelta(minutes=30), lat, lon)
        erbs = pvlib.irradiance.erbs(df["ghi"], sp["zenith"].to_numpy(), idx)
        df["dni"], df["dhi"] = erbs["dni"].fillna(0).to_numpy(), erbs["dhi"].fillna(0).to_numpy()
    df = df.dropna(subset=["ghi"]).sort_index()
    df["temp_air"] = df["temp_air"].interpolate(limit_direction="both")
    return Weather(df[["ghi", "dni", "dhi", "temp_air", "wind_speed"]], lat, lon, "csv", name)


def load(source: str, lat: float, lon: float, csv_path: str | None = None, csv_text: str = "",
         cache: WeatherCache | None = None) -> Weather:
    """Weather from a source. "pvgis" and "nasa" download unless the cache has the site.

    CSV weather comes from *csv_text* when given (*csv_path* then only names it), else from the file.
    """
    if source == "pvgis":
        return fetch_pvgis(lat, lon, cache=cache)
    if source == "nasa":
        return fetch_nasa(lat, lon, cache=cache)
    if source == "csv":
        if csv_text:
            return parse_csv(csv_text, lat, lon, name=file_name(csv_path or ""))
        if not csv_path:
            raise ValueError("Choose a CSV weather file.")
        return read_csv(csv_path, lat, lon)
    raise ValueError(source)


def solar_position(w: Weather) -> pd.DataFrame:
    """Sun at the middle of each hour."""
    return pvlib.solarposition.get_solarposition(w.data.index + pd.Timedelta(minutes=30), w.lat, w.lon)

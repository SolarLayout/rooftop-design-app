# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Hourly weather: PVGIS TMY, NASA POWER, or a CSV file.

Every source ends up as the same table, indexed by the hour's start in UTC, with
ghi, dni, dhi (W/m²), temp_air (°C) and wind_speed (m/s). Values are treated as
averages over the hour, so the sun is placed at the middle of each hour.
Downloads are cached on disk so a project opens again without the network.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib
import requests

PVGIS = "https://re.jrc.ec.europa.eu/api/v5_3"
NASA = "https://power.larc.nasa.gov/api/temporal/hourly/point"
CACHE_DIR = Path.home() / ".rooftop_design" / "weather"
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


def _cache(key: str) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return CACHE_DIR / (hashlib.sha1(key.encode()).hexdigest()[:16] + ".json")


def _get_json(url: str, params: dict, timeout: float = 60.0) -> dict:
    r = requests.get(url, params=params, timeout=timeout)
    if r.status_code != 200:
        msg = r.text[:200]
        raise RuntimeError(f"{url.split('/')[2]} answered {r.status_code}: {msg}")
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


def fetch_pvgis(lat: float, lon: float, use_cache: bool = True) -> Weather:
    path = _cache(f"pvgis:{lat:.4f}:{lon:.4f}")
    if use_cache and path.exists():
        return Weather.from_json(json.loads(path.read_text()))
    j = _get_json(f"{PVGIS}/tmy", {"lat": lat, "lon": lon, "outputformat": "json"})
    try:
        hz = pvgis_horizon(lat, lon)
    except Exception:  # horizon is optional
        hz = []
    w = parse_pvgis_tmy(j, lat, lon, hz)
    path.write_text(json.dumps(w.to_json()))
    return w


def fetch_nasa(lat: float, lon: float, year: int = 2023, use_cache: bool = True) -> Weather:
    path = _cache(f"nasa:{lat:.4f}:{lon:.4f}:{year}")
    if use_cache and path.exists():
        return Weather.from_json(json.loads(path.read_text()))
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
    path.write_text(json.dumps(w.to_json()))
    return w


_TIME = ("time", "time(utc)", "datetime", "date", "timestamp", "date/time")
_GHI = ("ghi", "g(h)", "gh", "global_horizontal", "allsky_sfc_sw_dwn", "irradiance")
_DNI = ("dni", "gb(n)", "bn", "allsky_sfc_sw_dni")
_DHI = ("dhi", "gd(h)", "dh", "diffuse", "allsky_sfc_sw_diff")
_TEMP = ("temp_air", "t2m", "temp", "temperature", "tamb", "t_amb", "ambient_temp")
_WIND = ("wind_speed", "ws10m", "wind", "ws")


def read_csv(path: str | Path, lat: float, lon: float, tz_offset_h: float = 0.0) -> Weather:
    """Any hourly CSV with a time and a GHI column; DNI/DHI are split from GHI when missing."""
    raw = pd.read_csv(path, sep=None, engine="python", comment="#")
    cols = {c.strip().lower(): c for c in raw.columns}

    def pick(names, required=False):
        for n in names:
            if n in cols:
                return raw[cols[n]]
        if required:
            raise ValueError(f"{Path(path).name}: no column named any of {', '.join(names)}")
        return None

    ts = pick(_TIME, True).astype(str).str.strip()
    t = pd.to_datetime(ts, format="%Y%m%d:%H%M", errors="coerce")
    if t.isna().mean() > 0.5:
        t = pd.to_datetime(ts, errors="coerce", format="mixed")
    t = t - pd.Timedelta(hours=tz_offset_h)
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
        sp = pvlib.solarposition.get_solarposition(idx + pd.Timedelta(minutes=30), lat, lon)
        erbs = pvlib.irradiance.erbs(df["ghi"], sp["zenith"], idx)
        df["dni"], df["dhi"] = erbs["dni"].fillna(0).to_numpy(), erbs["dhi"].fillna(0).to_numpy()
    df = df.dropna(subset=["ghi"]).sort_index()
    df["temp_air"] = df["temp_air"].interpolate(limit_direction="both")
    return Weather(df[["ghi", "dni", "dhi", "temp_air", "wind_speed"]], lat, lon, "csv", Path(path).name)


def load(source: str, lat: float, lon: float, csv_path: str | None = None) -> Weather:
    if source == "pvgis":
        return fetch_pvgis(lat, lon)
    if source == "nasa":
        return fetch_nasa(lat, lon)
    if source == "csv":
        if not csv_path:
            raise ValueError("Choose a CSV weather file.")
        return read_csv(csv_path, lat, lon)
    raise ValueError(source)


def solar_position(w: Weather) -> pd.DataFrame:
    """Sun at the middle of each hour."""
    return pvlib.solarposition.get_solarposition(w.data.index + pd.Timedelta(minutes=30), w.lat, w.lon)

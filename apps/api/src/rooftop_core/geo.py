# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""WGS84 ↔ local roof metres, through the site's UTM zone.

Follows ``solar_core.geo_utils`` in SolarLayout/PVlayout_Advance (commit 4eb6775).
The local frame puts the roof reference point (its lat/lon) at the roof
centroid; x is UTM easting, y UTM northing, which is true north within the
grid convergence (under 1° for a roof).
"""

from __future__ import annotations

from pyproj import Transformer


def utm_epsg(lat: float, lon: float) -> int:
    zone = int((lon + 180) // 6) + 1
    return (32600 if lat >= 0 else 32700) + zone


def _tf(lat: float, lon: float):
    epsg = utm_epsg(lat, lon)
    fwd = Transformer.from_crs("EPSG:4326", f"EPSG:{epsg}", always_xy=True)
    inv = Transformer.from_crs(f"EPSG:{epsg}", "EPSG:4326", always_xy=True)
    return fwd, inv


def lonlat_to_local(points: list[tuple[float, float]], lat0: float, lon0: float) -> list[tuple[float, float]]:
    """(lon, lat) points to metres around (lat0, lon0)."""
    fwd, _ = _tf(lat0, lon0)
    e0, n0 = fwd.transform(lon0, lat0)
    return [(e - e0, n - n0) for e, n in (fwd.transform(lo, la) for lo, la in points)]


def local_to_lonlat(points, lat0: float, lon0: float, cx: float = 0.0, cy: float = 0.0):
    """Local metres (origin such that (cx, cy) is at lat0/lon0) to (lon, lat)."""
    fwd, inv = _tf(lat0, lon0)
    e0, n0 = fwd.transform(lon0, lat0)
    return [inv.transform(e0 + x - cx, n0 + y - cy) for x, y in points]

# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Roof import from KMZ/KML and DXF (decisions 7 and 8).

KMZ: the largest polygon is the roof; other polygons and lines are obstacles,
with the height read from the placemark name or description ("Tank h=2.5").
DXF: the largest closed polyline is the roof; other closed polylines and circles
are obstacles; the user says whether the drawing is in mm or m.
"""

from __future__ import annotations

import re
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from xml.etree import ElementTree as ET

import numpy as np
from shapely.geometry import Polygon

from ..geo import local_to_lonlat, lonlat_to_local
from ..geometry import Obstacle

HEIGHT_RE = re.compile(r"\bh\s*[=:]\s*([0-9]+(?:\.[0-9]+)?)", re.I)


@dataclass
class ImportedRoof:
    outline: list[tuple[float, float]]
    lat: float
    lon: float
    obstacles: list[Obstacle] = field(default_factory=list)
    missing_heights: list[str] = field(default_factory=list)
    source: str = ""


def _height(text: str) -> float | None:
    m = HEIGHT_RE.search(text or "")
    return float(m.group(1)) if m else None


def _coords(text: str) -> list[tuple[float, float]]:
    pts = []
    for tok in text.split():
        parts = tok.split(",")
        if len(parts) >= 2:
            pts.append((float(parts[0]), float(parts[1])))
    return pts


def _kml_text(path: Path) -> bytes:
    if path.suffix.lower() == ".kmz":
        with zipfile.ZipFile(path) as z:
            name = next(n for n in z.namelist() if n.lower().endswith(".kml"))
            return z.read(name)
    return path.read_bytes()


def read_kmz(path: str | Path) -> ImportedRoof:
    path = Path(path)
    root = ET.fromstring(_kml_text(path))
    shapes = []   # (name, desc, kind, lonlat pts)
    for pm in root.iter():
        if not pm.tag.endswith("Placemark"):
            continue
        name = desc = ""
        for ch in pm:
            if ch.tag.endswith("name"):
                name = (ch.text or "").strip()
            elif ch.tag.endswith("description"):
                desc = (ch.text or "").strip()
        for el in pm.iter():
            if el.tag.endswith("Polygon"):
                outer = next((c for c in el.iter() if c.tag.endswith("outerBoundaryIs")), el)
                co = next((c for c in outer.iter() if c.tag.endswith("coordinates")), None)
                if co is not None and co.text:
                    shapes.append((name, desc, "poly", _coords(co.text)))
            elif el.tag.endswith("LineString"):
                co = next((c for c in el.iter() if c.tag.endswith("coordinates")), None)
                if co is not None and co.text:
                    shapes.append((name, desc, "line", _coords(co.text)))
    polys = [s for s in shapes if s[2] == "poly" and len(s[3]) >= 3]
    if not polys:
        raise ValueError(f"{path.name} has no polygon to use as the roof.")
    lon0 = sum(p[0] for p in polys[0][3]) / len(polys[0][3])
    lat0 = sum(p[1] for p in polys[0][3]) / len(polys[0][3])
    local = [(n, d, k, lonlat_to_local(pts, lat0, lon0)) for n, d, k, pts in shapes]
    roof_i = max((i for i, s in enumerate(local) if s[2] == "poly"), key=lambda i: Polygon(local[i][3]).area)
    return _assemble(local, roof_i, lat0, lon0, path.name, "kmz")


def read_dxf(path: str | Path, units: str = "m", lat: float = 0.0, lon: float = 0.0) -> ImportedRoof:
    import ezdxf

    path = Path(path)
    doc = ezdxf.readfile(path)
    k = 0.001 if units == "mm" else 1.0
    shapes = []
    for e in doc.modelspace():
        t = e.dxftype()
        name = f"{e.dxf.layer}"
        if t == "LWPOLYLINE" and e.closed:
            pts = [(p[0] * k, p[1] * k) for p in e.get_points("xy")]
            shapes.append((name, "", "poly", pts))
        elif t == "POLYLINE" and e.is_closed:
            pts = [(v.dxf.location.x * k, v.dxf.location.y * k) for v in e.vertices]
            shapes.append((name, "", "poly", pts))
        elif t == "CIRCLE":
            c, r = e.dxf.center, e.dxf.radius * k
            shapes.append((name, "", "circle", [(c.x * k, c.y * k), (r, r)]))
    polys = [i for i, s in enumerate(shapes) if s[2] == "poly" and len(s[3]) >= 3]
    if not polys:
        raise ValueError(f"{path.name} has no closed polyline to use as the roof.")
    roof_i = max(polys, key=lambda i: Polygon(shapes[i][3]).area)
    return _assemble(shapes, roof_i, lat, lon, path.name, "dxf")


def _assemble(shapes, roof_i, lat, lon, fname, source) -> ImportedRoof:
    roof_poly = Polygon(shapes[roof_i][3]).buffer(0)
    c = roof_poly.centroid
    dx, dy = -c.x, -c.y   # the roof centroid becomes the local origin and carries lat/lon
    if source == "kmz":
        lon, lat = local_to_lonlat([(c.x, c.y)], lat, lon)[0]

    def mv(pts):
        return [(x + dx, y + dy) for x, y in pts]

    out = ImportedRoof(outline=mv(list(roof_poly.exterior.coords)[:-1]), lat=lat, lon=lon, source=source)
    n_ob = 0
    for i, (name, desc, kind, pts) in enumerate(shapes):
        if i == roof_i:
            continue
        n_ob += 1
        label = name or f"Obstacle {n_ob}"
        h = _height(name) or _height(desc)
        if h is None:
            out.missing_heights.append(label)
            h = 1.0
        label = HEIGHT_RE.sub("", label).strip(" ,;-") or f"Obstacle {n_ob}"
        if kind == "circle":
            (cx, cy), (r, _) = pts
            out.obstacles.append(Obstacle(label, "cylinder", x=cx + dx, y=cy + dy, diameter=2 * r, height=h))
        elif kind == "line":
            out.obstacles.append(Obstacle(label, "wall", points=mv(pts), height=h))
        else:
            poly = Polygon(pts).buffer(0)
            with np.errstate(all="ignore"):
                rect = poly.minimum_rotated_rectangle
            if abs(rect.area - poly.area) < 0.02 * max(poly.area, 1e-9) and len(pts) <= 5:
                xs, ys = zip(*list(rect.exterior.coords)[:4], strict=False)
                import math
                e0 = math.dist((xs[0], ys[0]), (xs[1], ys[1]))
                e1 = math.dist((xs[1], ys[1]), (xs[2], ys[2]))
                ang = math.degrees(math.atan2(ys[1] - ys[0], xs[1] - xs[0]))
                out.obstacles.append(Obstacle(label, "box", x=poly.centroid.x + dx, y=poly.centroid.y + dy,
                                              length=e0, width=e1, rotation_deg=ang, height=h))
            else:
                out.obstacles.append(Obstacle(label, "building", points=mv(list(poly.exterior.coords)[:-1]),
                                              height=h))
    return out

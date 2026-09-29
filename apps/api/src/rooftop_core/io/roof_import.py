# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Roof import from KMZ/KML and DXF (decisions 7 and 8).

KMZ: the largest polygon is the roof; other polygons and lines are obstacles,
with the height read from the placemark name or description ("Tank h=2.5").
DXF: the largest closed polyline is the roof; other closed polylines and circles
are obstacles; the user says whether the drawing is in mm or m.

A file is given as a path or as its content (bytes, or the text of a KML or an
ASCII DXF): a browser has the content, not a path.
"""

from __future__ import annotations

import io
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
MAX_KML_MB = 20
BINARY_DXF = b"AutoCAD Binary DXF"


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


def _label(source: str | Path | bytes, name: str) -> str:
    """How an error names the file: the name given, else the name in the path, else "The file"."""
    if name:
        return name
    if isinstance(source, Path) or (isinstance(source, str) and not _is_text(source)):
        return Path(source).name
    return "The file"


def _is_text(source: str) -> bool:
    """A string is the text of a file, not a path, when it has several lines or starts like XML."""
    return "\n" in source or "\r" in source or source.lstrip().startswith("<")


def _content(source: str | Path | bytes) -> bytes:
    if isinstance(source, bytes):
        return source
    if isinstance(source, str) and _is_text(source):
        return source.encode("utf-8")
    return Path(source).read_bytes()


def _kml_bytes(data: bytes, label: str) -> bytes:
    """The KML document: the data itself, or the first .kml inside when the data is a KMZ (zip)."""
    if not zipfile.is_zipfile(io.BytesIO(data)):
        return data
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        inside = next((i for i in z.infolist() if i.filename.lower().endswith(".kml")), None)
        if inside is None:
            raise ValueError(f"{label} has no KML file inside.")
        if inside.file_size > MAX_KML_MB * 1024 * 1024:
            raise ValueError(f"{label}: the KML inside is larger than {MAX_KML_MB} MB. "
                             "Export the roof and its obstacles alone.")
        return z.read(inside)


def read_kmz(source: str | Path | bytes, name: str = "") -> ImportedRoof:
    """A roof from a KMZ or KML: a path, the bytes of either, or the text of a KML.

    *name* names the file in errors when the content is given instead of a path.
    """
    label = _label(source, name)
    try:
        root = ET.fromstring(_kml_bytes(_content(source), label))
    except ET.ParseError as e:
        raise ValueError(f"{label} is not a KML file that can be read: {e}") from e
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
        raise ValueError(f"{label} has no polygon to use as the roof.")
    lon0 = sum(p[0] for p in polys[0][3]) / len(polys[0][3])
    lat0 = sum(p[1] for p in polys[0][3]) / len(polys[0][3])
    local = [(n, d, k, lonlat_to_local(pts, lat0, lon0)) for n, d, k, pts in shapes]
    roof_i = max((i for i, s in enumerate(local) if s[2] == "poly"), key=lambda i: Polygon(local[i][3]).area)
    return _assemble(local, roof_i, lat0, lon0, label, "kmz")


def _dxf_from_bytes(data: bytes):
    """What ezdxf.readfile does for a path: binary DXF as it is, ASCII DXF in the encoding it declares."""
    import ezdxf
    from ezdxf.document import Drawing
    from ezdxf.filemanagement import dxf_stream_info
    from ezdxf.lldxf.tagger import binary_tags_loader

    if data.startswith(BINARY_DXF):
        return Drawing.load(binary_tags_loader(data, errors="surrogateescape"))
    data = data.replace(b"\r\n", b"\n")
    info = dxf_stream_info(io.StringIO(data.decode("utf-8", errors="ignore")))
    return ezdxf.read(io.StringIO(data.decode(info.encoding, errors="surrogateescape")))


def _dxf_document(source: str | Path | bytes, label: str):
    import ezdxf
    from ezdxf.lldxf.const import DXFError

    try:
        if isinstance(source, bytes):
            return _dxf_from_bytes(source)
        if isinstance(source, str) and _is_text(source):
            return ezdxf.read(io.StringIO(source))
        return ezdxf.readfile(Path(source))
    except (OSError, DXFError) as e:
        raise ValueError(f"{label} is not a DXF file that can be read: {e}") from e


def read_dxf(source: str | Path | bytes, units: str = "m", lat: float = 0.0, lon: float = 0.0,
             name: str = "") -> ImportedRoof:
    """A roof from a DXF: a path, the bytes of the file, or the text of an ASCII DXF.

    *name* names the file in errors when the content is given instead of a path.
    """
    label = _label(source, name)
    doc = _dxf_document(source, label)
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
        raise ValueError(f"{label} has no closed polyline to use as the roof.")
    roof_i = max(polys, key=lambda i: Polygon(shapes[i][3]).area)
    return _assemble(shapes, roof_i, lat, lon, label, "dxf")


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

# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""The bundled demo: a 90 × 40 m flat industrial roof in Pune (decision F6)."""

from __future__ import annotations

from .geometry import Obstacle, Roof

PUNE = (18.52, 73.86)


def rectangle(length: float, width: float, rotation_deg: float = 0.0) -> list[tuple[float, float]]:
    import shapely.affinity
    from shapely.geometry import box

    r = box(0, 0, length, width)
    if rotation_deg:
        r = shapely.affinity.rotate(r, rotation_deg, origin=(length / 2, width / 2))
    return [(round(x, 4), round(y, 4)) for x, y in list(r.exterior.coords)[:-1]]


def demo_roof() -> Roof:
    lat, lon = PUNE
    roof = Roof(outline=rectangle(90.0, 40.0), lat=lat, lon=lon, roof_type="flat_tilted", source="coordinates")
    roof.obstacles = [
        Obstacle("Stair room", "box", x=22.5, y=18.0, length=5.0, width=4.0, height=3.0),
        Obstacle("Water tank", "cylinder", x=62.0, y=24.0, diameter=2.5, height=2.0),
    ] + [
        Obstacle(f"AC unit {i + 1}", "box", x=70.75 + 3 * i, y=3.5, length=1.5, width=1.0, height=1.2)
        for i in range(4)
    ]
    return roof


def demo_array():
    """The demo's array: two modules in tilt, as it has always been drawn and measured (D69); the rest as a new design's."""
    from .placement import ArraySpec

    return ArraySpec(modules_in_tilt=2)


def demo_project():
    """The Pune demo with the bundled weather, so it runs offline."""
    import json

    from .project import Project
    from .resources import sample_path

    p = Project(name="Pune demo roof", place_name="Pune", roof=demo_roof(), array=demo_array())
    p.weather_json = json.loads(open(sample_path("pune_weather.json")).read())
    p.system_voltage = 1500.0
    p.system_voltage_by = "user"
    p.roof_input = {"mode": "rect", "length": 90.0, "width": 40.0, "facing": 180.0, "file": "", "dxf_units": "m"}
    return p

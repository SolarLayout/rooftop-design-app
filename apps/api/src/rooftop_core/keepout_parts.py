"""The shadow keep-out of a layout, told apart by what casts it.

The layout holds the keep-out as one area. Here it is computed once for the parapet and once for every
obstacle, with the engine's own `keepout`, so a drawing can say which obstacle keeps which positions
empty. The parts together are the keep-out of the layout on the roof.
"""

from __future__ import annotations

from dataclasses import dataclass, replace

from shapely.geometry import MultiPolygon, Polygon
from shapely.strtree import STRtree

from .geometry import Roof, keepout
from .io.pvsyst import Module
from .placement import ArraySpec, Layout, place

PARAPET = "parapet"
OBSTACLE = "obstacle"


@dataclass(frozen=True)
class KeepoutPart:
    cause: str  # PARAPET or OBSTACLE
    obstacle_index: int | None  # place of the obstacle in roof.obstacles; None for the parapet
    name: str | None  # name of the obstacle; None for the parapet
    area: Polygon | MultiPolygon  # on the roof, local metres
    positions: int = 0  # how many positions it keeps clear; 0 until positions_kept_clear counted them


def receiving_height(roof: Roof, arr: ArraySpec) -> float:
    """Height of the lower edge of the modules, where `place` lets the shadows fall."""
    return arr.flush_clearance_m if roof.roof_type == "sloped_flush" else arr.clearance_m


def keepout_parts(roof: Roof, arr: ArraySpec, layout: Layout) -> list[KeepoutPart]:
    """One part for the parapet and one per obstacle, in the order of roof.obstacles; empty ones left out."""
    z = receiving_height(roof, arr)
    casters = [(PARAPET, None, None, replace(roof, obstacles=[]))]
    casters += [
        (OBSTACLE, i, ob.name, replace(roof, obstacles=[ob], parapet_h=0.0))
        for i, ob in enumerate(roof.obstacles)
    ]
    parts = []
    for cause, index, name, alone in casters:
        area = keepout(alone, z, arr.window_start_h, arr.window_end_h, layout.design_doy)
        on_roof = area.intersection(roof.polygon)
        if on_roof.area > 0:
            parts.append(KeepoutPart(cause, index, name, on_roof))
    return parts


def positions_kept_clear(
    roof: Roof, arr: ArraySpec, module: Module, parts: list[KeepoutPart]
) -> list[KeepoutPart]:
    """The parts with the count of positions each keeps clear: the positions of the same layout with
    shaded positions allowed that fall in the part. A position on the edge of two parts counts in both."""
    if not parts:
        return parts
    shaded = place(roof, replace(arr, allow_shaded=True), module)
    footprints = [module_.poly for module_ in shaded.modules]
    if not footprints:
        return [replace(part, positions=0) for part in parts]
    tree = STRtree(footprints)
    return [replace(part, positions=len(tree.query(part.area, predicate="intersects"))) for part in parts]

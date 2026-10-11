"""The layout of the modules on the roof. Mirrors rooftop_core.placement.Layout."""

from typing import Literal

from pydantic import BaseModel, Field

from rooftop_api.schemas.common import Point, Polygon
from rooftop_api.schemas.roof import RoofType


class PlacedModule(BaseModel):
    """One position. The outline is its footprint seen from above."""

    idx: int
    outline: list[Point]
    row: int = Field(description="Table row, or unit on an east-west roof")
    col: int
    line: int = Field(description="0 is the lowest line of the table; on east-west the side")
    tilt: float
    azimuth: float
    z_low: float
    z_high: float


class Keepout(BaseModel):
    """Positions left empty because something shades them in the window, and what that is."""

    cause: Literal["parapet", "obstacle"]
    obstacle: str | None = Field(description="Name of the obstacle; null for the parapet")
    obstacle_index: int | None = Field(description="Its place in roof.obstacles; null for the parapet")
    positions: int = Field(
        description="How many positions it keeps clear: those of the layout with shaded positions "
        "allowed that fall in it"
    )
    polygons: list[Polygon]


class Layout(BaseModel):
    """Every position, and the areas that led to them."""

    kind: RoofType
    azimuth: float
    tilt: float
    pitch: float
    gcr: float
    slope_len: float
    table_count: int
    n_rows: int
    design_doy: int
    psi_min_deg: float | None
    notes: list[str]
    modules: list[PlacedModule]
    inner: list[Polygon] = Field(description="The roof inside the edge setback")
    usable: list[Polygon] = Field(description="Where modules may stand")
    obstacle_zone: list[Polygon] = Field(description="Obstacles with their clearance")
    keepout: list[Keepout]


class LayoutReadouts(BaseModel):
    """The figures shown next to the plan."""

    positions: int
    tables: int
    rows: int
    pitch_m: float
    gcr: float
    profile_angle_deg: float | None = Field(
        description="Lowest sun in the window; null when the pitch was given"
    )
    shade_free_pitch_m: float | None = Field(
        description="The pitch the engine chooses for the window, even when one was given; "
        "null but on flat tilted rows"
    )
    edge_azimuth_deg: float = Field(
        description="Where the roof edge closest to the equator faces: "
        "the array's azimuth unless one was given"
    )
    roof_area_m2: float
    inside_setback_area_m2: float
    usable_area_m2: float
    keepout_area_m2: float = Field(description="Left empty inside the setback because of shadows")
    module_area_m2: float = Field(description="All positions together")


class LayoutResponse(BaseModel):
    """The layout of a project and its read-outs."""

    layout: Layout
    readouts: LayoutReadouts

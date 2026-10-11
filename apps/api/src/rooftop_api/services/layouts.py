"""The layout of a project: modules on the roof, keep-out by obstacle, and the read-outs."""

from shapely.geometry import Polygon

from rooftop_api import convert, schemas
from rooftop_api.errors import UNPROCESSABLE, ApiError
from rooftop_api.services.equipment import has_size, no_size_message
from rooftop_core.geometry import Roof
from rooftop_core.io.pvsyst import Module
from rooftop_core.keepout_parts import keepout_parts, positions_kept_clear
from rooftop_core.placement import Layout, place
from rooftop_core.project import Project, module_of

NO_AREA = "The roof outline encloses no area. Give at least three corners that are not on one line."
CROSSES_ITSELF = "The roof outline crosses itself. Give the corners in order around the roof."


def lay_out(project: schemas.Project) -> schemas.LayoutResponse:
    """The layout needs the roof, the array and the module; not the inverter, weather or voltage."""
    p = convert.project_to_engine(project)
    require_outline(p.roof)
    module = module_for(p)
    layout = place(p.roof, p.array, module)
    parts = positions_kept_clear(p.roof, p.array, module, keepout_parts(p.roof, p.array, layout))
    return schemas.LayoutResponse(
        layout=convert.layout_from_engine(layout, parts), readouts=readouts(p.roof, layout, module)
    )


def require_outline(roof: Roof) -> None:
    """The outline must go once around an area. The engine would mend it in silence and lay out less."""
    if not roof.area_m2 > 0:
        raise ApiError(UNPROCESSABLE, "roof_without_area", NO_AREA, "roof.outline")
    if not Polygon(roof.outline).is_valid:
        raise ApiError(UNPROCESSABLE, "roof_outline_crosses_itself", CROSSES_ITSELF, "roof.outline")


def module_for(p: Project) -> Module:
    """The module of a project that came in a request: from its text or the bundled sample, never a path."""
    try:
        module = module_of(p, local_files=False)
    except ValueError as error:
        raise ApiError(UNPROCESSABLE, "not_a_pan_file", str(error), "pan_text") from error
    if not has_size(module):
        raise ApiError(UNPROCESSABLE, "module_without_size", no_size_message(module.source), "pan_text")
    return module


def readouts(roof: Roof, layout: Layout, module: Module) -> schemas.LayoutReadouts:
    return schemas.LayoutReadouts(
        positions=layout.n_modules,
        tables=layout.table_count,
        rows=layout.n_rows,
        pitch_m=layout.pitch,
        gcr=layout.gcr,
        profile_angle_deg=layout.psi_min_deg,
        shade_free_pitch_m=layout.shade_free_pitch,
        edge_azimuth_deg=layout.edge_azimuth,
        roof_area_m2=roof.area_m2,
        inside_setback_area_m2=layout.inner.area,
        usable_area_m2=layout.usable.area,
        keepout_area_m2=layout.keepout_area_in_roof,
        module_area_m2=layout.n_modules * module.area_m2,
    )

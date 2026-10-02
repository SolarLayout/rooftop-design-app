"""Between the shapes of the API (rooftop_api.schemas) and the objects of the engine (rooftop_core).

What a request carries goes both ways: roof, obstacles, array, losses, project. What the engine works
out only comes back: module, inverter, coefficients, layout, shapes. Answers are built without
validating them again: the engine is trusted, and a value a request would not accept must not turn an
answer into a server fault.
"""

from dataclasses import asdict, fields
from typing import Any

from shapely.geometry import MultiPolygon
from shapely.geometry import Polygon as ShapelyPolygon
from shapely.geometry.base import BaseGeometry

from rooftop_api import schemas
from rooftop_core import bom, geometry, onediode, options, placement, project, readouts, simulation, stringing
from rooftop_core.io import pvsyst, roof_import
from rooftop_core.keepout_parts import KeepoutPart
from rooftop_core.sunpath import SunPosition

COORDINATE_DECIMALS = 6  # a micrometre: far finer than any drawing, and free of noise like 7.450000000000001


# ── roof ─────────────────────────────────────────────────────────────────────
def obstacle_to_engine(obstacle: schemas.Obstacle) -> geometry.Obstacle:
    return geometry.Obstacle(**obstacle.model_dump())


def obstacle_from_engine(obstacle: geometry.Obstacle) -> schemas.Obstacle:
    values = asdict(obstacle)
    values["points"] = [_point(p) for p in obstacle.points]
    return schemas.Obstacle.model_construct(**values)


def roof_to_engine(roof: schemas.Roof) -> geometry.Roof:
    values = roof.model_dump(exclude={"obstacles"})
    return geometry.Roof(**values, obstacles=[obstacle_to_engine(o) for o in roof.obstacles])


def roof_from_engine(roof: geometry.Roof) -> schemas.Roof:
    values = {f.name: getattr(roof, f.name) for f in fields(roof) if f.name not in ("outline", "obstacles")}
    return schemas.Roof.model_construct(
        **values,
        outline=[_point(p) for p in roof.outline],
        obstacles=[obstacle_from_engine(o) for o in roof.obstacles],
    )


def imported_roof_from_engine(
    roof: roof_import.ImportedRoof, file: str, notes: list[str], whole: schemas.Project
) -> schemas.ImportedRoof:
    return schemas.ImportedRoof.model_construct(
        project=whole,
        source=roof.source,
        file=file,
        outline=[_point(p) for p in roof.outline],
        lat=roof.lat,
        lon=roof.lon,
        obstacles=[obstacle_from_engine(o) for o in roof.obstacles],
        missing_heights=list(roof.missing_heights),
        notes=notes,
    )


# ── array and losses ─────────────────────────────────────────────────────────
def array_to_engine(array: schemas.ArraySpec) -> placement.ArraySpec:
    return placement.ArraySpec(**array.model_dump())


def array_from_engine(array: placement.ArraySpec) -> schemas.ArraySpec:
    return schemas.ArraySpec.model_construct(**asdict(array))


def losses_to_engine(losses: schemas.Losses) -> simulation.Losses:
    return simulation.Losses(**losses.model_dump())


def losses_from_engine(losses: simulation.Losses) -> schemas.Losses:
    return schemas.Losses.model_construct(**asdict(losses))


# ── project ──────────────────────────────────────────────────────────────────
NESTED = {"format", "roof", "array", "losses", "roof_input", "weather_json", "system_voltage"}


def weather_to_engine(weather: schemas.Weather) -> dict[str, Any]:
    """The weather as the engine embeds it in a project: what Weather.to_json writes to a file."""
    values = weather.model_dump()
    values["horizon"] = [list(point) for point in weather.horizon]
    return values


def weather_from_engine(weather: dict[str, Any]) -> schemas.Weather:
    values = dict(weather)
    values["horizon"] = [_point(p) for p in weather.get("horizon", [])]
    return schemas.Weather.model_construct(**values)


def project_to_engine(p: schemas.Project) -> project.Project:
    """The project of a request. Its format is not kept: the engine writes the current one."""
    return project.Project(
        **p.model_dump(exclude=NESTED),
        roof=roof_to_engine(p.roof),
        array=array_to_engine(p.array),
        losses=losses_to_engine(p.losses),
        roof_input=p.roof_input.model_dump(),
        weather_json=None if p.weather_json is None else weather_to_engine(p.weather_json),
        system_voltage=None if p.system_voltage is None else float(p.system_voltage),
    )


def project_from_engine(p: project.Project) -> schemas.Project:
    values = {f.name: getattr(p, f.name) for f in fields(p) if f.name not in NESTED}
    return schemas.Project.model_construct(
        **values,
        format=project.FORMAT_VERSION,
        roof=roof_from_engine(p.roof),
        array=array_from_engine(p.array),
        losses=losses_from_engine(p.losses),
        roof_input=schemas.RoofInput.model_construct(**p.roof_input),
        weather_json=None if p.weather_json is None else weather_from_engine(p.weather_json),
        system_voltage=p.system_voltage,
    )


# ── equipment ────────────────────────────────────────────────────────────────
def module_from_engine(module: pvsyst.Module) -> schemas.Module:
    values = asdict(module)
    values["iam_profile"] = [_point(p) for p in module.iam_profile]
    return schemas.Module.model_construct(
        **values, area_m2=module.area_m2, efficiency=module.efficiency, is_bifacial=module.is_bifacial
    )


def coefficients_from_engine(c: onediode.Coefficients) -> schemas.Coefficients:
    return schemas.Coefficients.model_construct(
        mu_voc_mv=c.mu_voc_mv,
        mu_voc_pct=c.mu_voc_pct,
        mu_vmp_pct=c.mu_vmp_pct,
        mu_pmpp_pct=c.mu_pmpp_pct,
        source=_coefficient_source(c),
    )


def _coefficient_source(c: onediode.Coefficients) -> schemas.CoefficientSource:
    if c.entered:
        return "entered"
    return "one-diode model" if c.derived else "PAN file"


def inverter_from_engine(inverter: pvsyst.Inverter) -> schemas.Inverter:
    values = {f.name: getattr(inverter, f.name) for f in fields(inverter) if f.name != "curves"}
    curves = [
        schemas.EfficiencyCurve.model_construct(voltage=voltage, points=[_point(p) for p in points])
        for voltage, points in sorted(inverter.curves.items())
    ]
    return schemas.Inverter.model_construct(
        **values,
        curves=curves,
        curve_euro_pct=list(inverter.curve_euro_pct),
        mppt_current_limit=inverter.mppt_current_limit,
        mppt_isc_limit=inverter.mppt_isc_limit,
    )


# ── layout ───────────────────────────────────────────────────────────────────
def placed_module_from_engine(module: placement.PlacedModule) -> schemas.PlacedModule:
    return schemas.PlacedModule.model_construct(
        idx=module.idx,
        outline=_ring(module.poly.exterior.coords),
        row=module.row,
        col=module.col,
        line=module.line,
        tilt=module.tilt,
        azimuth=module.azimuth,
        z_low=module.z_low,
        z_high=module.z_high,
    )


def keepout_from_engine(part: KeepoutPart) -> schemas.Keepout:
    return schemas.Keepout.model_construct(
        cause=part.cause,
        obstacle=part.name,
        obstacle_index=part.obstacle_index,
        positions=part.positions,
        polygons=polygons_from_shape(part.area),
    )


def layout_from_engine(layout: placement.Layout, keepout: list[KeepoutPart]) -> schemas.Layout:
    return schemas.Layout.model_construct(
        kind=layout.kind,
        azimuth=layout.azimuth,
        tilt=layout.tilt,
        pitch=layout.pitch,
        gcr=layout.gcr,
        slope_len=layout.slope_len,
        table_count=layout.table_count,
        n_rows=layout.n_rows,
        design_doy=layout.design_doy,
        psi_min_deg=layout.psi_min_deg,
        notes=list(layout.notes),
        modules=[placed_module_from_engine(m) for m in layout.modules],
        inner=polygons_from_shape(layout.inner),
        usable=polygons_from_shape(layout.usable),
        obstacle_zone=polygons_from_shape(layout.obstacle_zone),
        keepout=[keepout_from_engine(part) for part in keepout],
    )


# ── design ───────────────────────────────────────────────────────────────────
def series_range_from_engine(rng: stringing.SeriesRange, limit_note: str) -> schemas.SeriesRange:
    return schemas.SeriesRange.model_construct(
        **asdict(rng),
        ok=rng.ok,
        upper_limit="Voc limit" if rng.n_max_voc <= rng.n_max_mppt else "MPPT max",
        limit_note=limit_note,
    )


def system_from_engine(system: stringing.System, shade_by_string: Any) -> schemas.System:
    strings = [
        schemas.PVString.model_construct(
            label=f"S{number + 1}",
            modules=[int(index) for index in string.modules],
            row=string.row,
            azimuth=string.azimuth,
            start=_point(string.start_xy),
            extent_m=string.extent_m,
            inverter=system.inverter_of[number] + 1,
            mppt=system.mppt_of[number] + 1,
            shade_pct=float(shade_by_string[number]) * 100.0,
        )
        for number, string in enumerate(system.strings)
    ]
    inverters = [
        schemas.InverterPlace.model_construct(label=f"INV-{number + 1}", position=_point(place))
        for number, place in enumerate(system.inverter_xy)
    ]
    return schemas.System.model_construct(
        n_series=system.n_series,
        n_strings=system.n_strings,
        n_inverters=system.n_inverters,
        n_modules=system.n_modules,
        strings=strings,
        inverters=inverters,
    )


def energy_from_engine(result: simulation.SimResult) -> schemas.Energy:
    """The result of a simulation without its hours, which are an export of their own."""
    return schemas.Energy.model_construct(
        energy_mwh=result.energy_mwh,
        dc_kwp=result.dc_kwp,
        ac_kw=result.ac_kw,
        pr=result.pr,
        specific_yield=result.specific_yield,
        cuf_ac_pct=result.cuf_ac_pct,
        cuf_dc_pct=result.cuf_dc_pct,
        poa_kwh_m2=result.poa_kwh_m2,
        ghi_kwh_m2=result.ghi_kwh_m2,
        clipping_pct=result.clipping_pct,
        sigma_pct=result.sigma_pct,
        lid_pct=result.lid_pct,
        co2_t=result.co2_t,
        steps=[schemas.LossStep.model_construct(**asdict(step)) for step in result.steps],
        monthly_mwh=list(result.monthly_mwh),
        p_values=[
            schemas.PValue.model_construct(level=level, mwh=mwh) for level, mwh in result.p_values.items()
        ],
        years_mwh=list(result.years),
        total_25_years_mwh=sum(result.years),
    )


def option_from_engine(
    option: options.StringOption,
    module_area_m2: float,
    roof_area_m2: float,
    verdict: readouts.Verdict,
    loads: list[readouts.MpptLoad],
    bill: list[bom.BomLine],
    cables: list[bom.CableRow],
    summary: list[tuple[str, str]],
) -> schemas.Option:
    """An option with its read-outs. *module_area_m2* is that of one module."""
    area = option.n_modules * module_area_m2
    return schemas.Option.model_construct(
        key=option.key,
        letter=option.letter,
        title=option.title,
        n_series=option.n_series,
        n_strings=option.n_strings,
        n_inverters=option.n_inverters,
        n_modules=option.n_modules,
        available_strings=option.available_strings,
        dc_kwp=option.dc_kwp,
        dcac=option.dcac,
        ok=option.ok,
        note=option.note,
        recommended=option.recommended,
        custom=option.custom,
        module_area_m2=area,
        roof_covered_pct=area / roof_area_m2 * 100.0,
        verdict=schemas.Verdict.model_construct(**asdict(verdict)),
        system=system_from_engine(option.system, option.result.per_string_shade),
        energy=energy_from_engine(option.result),
        mppt_loads=[schemas.MpptLoad.model_construct(**asdict(load)) for load in loads],
        bom=[schemas.BomLine.model_construct(**asdict(line)) for line in bill],
        cable_schedule=[schemas.CableRow.model_construct(**asdict(row)) for row in cables],
        summary=[schemas.SummaryRow.model_construct(label=label, value=value) for label, value in summary],
    )


# ── sun ──────────────────────────────────────────────────────────────────────
def sun_position_from_engine(position: SunPosition) -> schemas.SunPosition:
    return schemas.SunPosition.model_construct(**asdict(position))


# ── shapes ───────────────────────────────────────────────────────────────────
def polygons_from_shape(shape: BaseGeometry | None) -> list[schemas.Polygon]:
    """The polygons of any shape the engine hands out. Lines and points in it are left out."""
    return [_polygon(part) for part in _polygon_parts(shape)]


def _polygon_parts(shape: BaseGeometry | None) -> list[ShapelyPolygon]:
    if shape is None or shape.is_empty:
        return []
    if isinstance(shape, ShapelyPolygon):
        return [shape]
    if isinstance(shape, MultiPolygon):
        return list(shape.geoms)
    return [
        part for part in getattr(shape, "geoms", []) if isinstance(part, ShapelyPolygon) and not part.is_empty
    ]


def _polygon(polygon: ShapelyPolygon) -> schemas.Polygon:
    return schemas.Polygon.model_construct(
        exterior=_ring(polygon.exterior.coords), holes=[_ring(ring.coords) for ring in polygon.interiors]
    )


def _ring(coordinates: Any) -> list[schemas.Point]:
    """The points of a closed ring, without the last one that repeats the first."""
    return [
        (round(x, COORDINATE_DECIMALS), round(y, COORDINATE_DECIMALS)) for x, y, *_ in list(coordinates)[:-1]
    ]


def _point(pair: Any) -> schemas.Point:
    return (float(pair[0]), float(pair[1]))

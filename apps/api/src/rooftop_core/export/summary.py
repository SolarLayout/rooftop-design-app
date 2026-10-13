"""The words of a design's summary, shared by the report and the API's readouts. No drawing here, so that
reading them does not load matplotlib: the API loads it when a report or a file is drawn (Phase 13)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from ..geometry import roof_type_name

if TYPE_CHECKING:
    from ..project import Design


def structure_label(d: Design) -> str:
    a, r = d.p.array, d.p.roof
    if r.roof_type == "flat_tilted":
        return (
            f"Fixed tilt {a.tilt_deg:g}°, {a.modules_in_tilt}{'P' if a.orientation == 'portrait' else 'L'}, "
            f"lower edge {a.clearance_m:g} m"
        )
    if r.roof_type == "flat_ew":
        return f"East-west {a.ew_tilt_deg:g}°, 1L back-to-back, ridge gap {a.ew_ridge_gap_m:g} m"
    return f"Flush rails at the roof pitch {r.slope_deg:g}°"


def summary_rows(d: Design) -> list[tuple[str, str]]:
    o = d.chosen
    r = o.result
    p = d.p
    m, inv = d.module, d.inverter
    module_area = o.n_modules * m.area_m2
    north_south = "N" if p.roof.lat >= 0 else "S"
    east_west = "E" if p.roof.lon >= 0 else "W"
    return [
        ("Site", f"{p.roof.lat:.5f}° {north_south}, {p.roof.lon:.5f}° {east_west}"),
        (
            "Roof",
            f"{roof_type_name(p.roof.roof_type, p.roof.lat)} · {p.roof.area_m2:,.0f} m² · "
            f"usable {d.layout.usable.area:,.0f} m²",
        ),
        ("Structure", structure_label(d)),
        ("Module", f"{m.manufacturer} {m.model} · {m.pnom_w:g} Wp"),
        ("Inverter", f"{inv.manufacturer} {inv.model} · {inv.pnom_kw:g} kW · {inv.n_mppt} MPPT"),
        (
            "Stringing",
            f"{o.n_series} in series × {o.n_strings} strings on {o.n_inverters} "
            f"{'inverter' if o.n_inverters == 1 else 'inverters'}",
        ),
        ("DC capacity", f"{r.dc_kwp:,.2f} kWp ({o.n_modules} modules)"),
        ("AC capacity", f"{r.ac_kw:,.0f} kW · DC/AC {o.dcac:.2f}"),
        (
            "Weather",
            f"{d.weather.label} · GHI {r.ghi_kwh_m2:,.1f} kWh/m² · in-plane {r.poa_kwh_m2:,.1f} kWh/m²",
        ),
        ("Energy, year 1", " · ".join(f"P{k} {v:,.1f} MWh" for k, v in r.p_values.items())),
        (
            "Yield",
            f"{r.specific_yield:,.0f} kWh/kWp · PR {r.pr * 100:.1f} % · CUF {r.cuf_ac_pct:.1f} % AC",
        ),
        ("Module area", f"{module_area:,.0f} m² · {module_area / p.roof.area_m2 * 100:.1f} % of the roof"),
        ("CO₂ avoided", f"{r.co2_t:,.1f} t/yr at {p.losses.co2_t_per_mwh:g} t/MWh"),
    ]

# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Bill of materials and DC cable schedule for the chosen stringing."""

from __future__ import annotations

from dataclasses import dataclass

from .io.pvsyst import Inverter, Module
from .onediode import ModuleModel
from .placement import Layout
from .stringing import System, dc_cable_m

DC_CABLE_MM2 = 4.0


@dataclass
class BomLine:
    item: str
    spec: str
    qty: float
    unit: str


@dataclass
class CableRow:
    string: str
    inverter: str
    mppt: int
    modules: int
    voc_cold_v: float
    isc_a: float
    length_m: float
    size: str


def used_tables(layout: Layout, system: System) -> int:
    used = set(system.module_indices())
    rows: dict[int, list[int]] = {}
    for m in layout.modules:
        if m.idx in used and m.line == 0:
            rows.setdefault(m.row, []).append(m.col)
    if layout.kind == "flat_ew":
        return len({(layout.modules[i].row) for i in used})
    count = 0
    for cols in rows.values():
        cols = sorted(set(cols))
        count += 1 + sum(1 for a, b in zip(cols, cols[1:], strict=False) if b != a + 1)
    return count


def cable_schedule(layout: Layout, system: System, module: Module, mm: ModuleModel, t_min: float) -> list[CableRow]:
    lengths = dc_cable_m(system, layout)
    voc = float(mm.voc(1000.0, t_min)[0]) * system.n_series
    return [CableRow(f"S{i + 1}", f"INV-{system.inverter_of[i] + 1}", system.mppt_of[i] + 1, system.n_series,
                     voc, module.isc, round(lengths[i], 1), f"{DC_CABLE_MM2:g} mm² Cu, 1500 V DC")
            for i in range(system.n_strings)]


def bom(layout: Layout, system: System, module: Module, inv: Inverter, mm: ModuleModel, t_min: float,
        tilt_label: str, ac_cable_m: float) -> list[BomLine]:
    cables = cable_schedule(layout, system, module, mm, t_min)
    dc_total = sum(c.length_m for c in cables)
    lines = [
        BomLine("PV module", f"{module.manufacturer} {module.model}, {module.pnom_w:g} Wp"
                + (f", bifacial {module.bifaciality:.2f}" if module.is_bifacial else ""),
                system.n_modules, "pcs"),
        BomLine("String inverter", f"{inv.manufacturer} {inv.model}, {inv.pnom_kw:g} kW, {inv.n_mppt} MPPT",
                system.n_inverters, "pcs"),
        BomLine("Mounting structure", tilt_label, used_tables(layout, system), "tables"),
        BomLine("DC cable", f"{DC_CABLE_MM2:g} mm² Cu, 1500 V DC, red + black", round(dc_total), "m"),
        BomLine("DC connector pair", "MC4-compatible, matched to the module", system.n_strings * 2, "pairs"),
        BomLine("AC cable", f"Inverter to ACDB, sized for {_i_ac(inv):.0f} A at {inv.v_out_v or 415:.0f} V AC",
                round(ac_cable_m * system.n_inverters), "m"),
        BomLine("AC distribution board", f"{system.n_inverters} incomer(s), 1 outgoing", 1, "pcs"),
    ]
    return lines


def _i_ac(inv: Inverter) -> float:
    if inv.i_max_ac_a:
        return inv.i_max_ac_a
    return inv.pnom_kw * 1000 / (3 ** 0.5 * (inv.v_out_v or 415))

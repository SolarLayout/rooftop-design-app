# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Bill of materials and DC cable schedule for the chosen stringing."""

from __future__ import annotations

from dataclasses import dataclass

from .io.pvsyst import Inverter, Module
from .placement import Layout
from .stringing import System, dc_cable_m

DC_CABLE_SIZES_MM2 = (4.0, 6.0, 10.0)  # copper PV cable, the sizes a string's home run is chosen from
# EN 50618 cable, two loaded cables side by side on a surface at 60 °C ambient, A: the rating 1.25 × Isc must keep under
DC_CABLE_RATING_A = {4.0: 44.0, 6.0: 57.0, 10.0: 79.0}
# IEC 60228 class 5 tinned copper, Ω/km at 20 °C, raised to a conductor at 70 °C on a hot roof
DC_CABLE_OHM_PER_KM = {4.0: 5.09, 6.0: 3.39, 10.0: 1.95}
DC_CABLE_WARM = 1 + 0.00393 * (70 - 20)
DC_CABLE_CURRENT_FACTOR = 1.25  # IEC 60364-7-712: a string cable carries 1.25 × Isc
DC_CABLE_DROP_PCT = 1.0  # the most a string's cable may drop, of its voltage at the maximum power point


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
    cross_section_mm2: float
    drop_pct: float  # of the string's voltage at its maximum power point, at STC


@dataclass(frozen=True)
class DcCable:
    mm2: float
    drop_pct: float


def dc_cable_for(length_m: float, isc_a: float, imp_a: float, vmp_v: float) -> DcCable:
    """The smallest size of DC_CABLE_SIZES_MM2 that carries 1.25 × *isc_a* and drops no more than 1 % of *vmp_v*
    at *imp_a* over *length_m* (both conductors, as dc_cable_m gives it); the largest, with its drop, if none
    holds the drop."""
    def drop_pct(mm2: float) -> float:
        ohm = DC_CABLE_OHM_PER_KM[mm2] / 1000.0 * DC_CABLE_WARM * length_m
        return imp_a * ohm / vmp_v * 100.0 if vmp_v > 0 else 0.0

    cables = [DcCable(mm2, drop_pct(mm2)) for mm2 in DC_CABLE_SIZES_MM2]
    holds = (c for c in cables
             if DC_CABLE_CURRENT_FACTOR * isc_a <= DC_CABLE_RATING_A[c.mm2] and c.drop_pct <= DC_CABLE_DROP_PCT)
    return next(holds, cables[-1])


def dc_cable_lines(rows: list[CableRow]) -> list[tuple[float, int]]:
    """The metres of cable of each size in the schedule, (size, metres), the smallest size first."""
    metres: dict[float, float] = {}
    for row in rows:
        metres[row.cross_section_mm2] = metres.get(row.cross_section_mm2, 0.0) + row.length_m
    return [(mm2, round(metres[mm2])) for mm2 in sorted(metres)]


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


def dc_cable_label(mm2: float, system_voltage: float) -> str:
    """A DC cable: its cross-section, and the system voltage it is rated for."""
    return f"{mm2:g} mm² Cu, {system_voltage:.0f} V DC"


def cable_schedule(layout: Layout, system: System, module: Module, voc_cold: float,
                   system_voltage: float) -> list[CableRow]:
    """*voc_cold*: of one module at the lowest ambient, as the series range of the design has it. Each string's
    cable is sized for its own length (dc_cable_for), at the module's maximum power point at STC; a file that
    gives none takes its Isc and Voc."""
    lengths = dc_cable_m(system, layout)
    voc = voc_cold * system.n_series
    imp, vmp = module.imp or module.isc, (module.vmp or module.voc) * system.n_series
    rows = []
    for i in range(system.n_strings):
        length = round(lengths[i], 1)
        cable = dc_cable_for(length, module.isc, imp, vmp)
        rows.append(CableRow(f"S{i + 1}", f"INV-{system.inverter_of[i] + 1}", system.mppt_of[i] + 1,
                             system.n_series, voc, module.isc, length, dc_cable_label(cable.mm2, system_voltage),
                             cable.mm2, cable.drop_pct))
    return rows


def bom(layout: Layout, system: System, module: Module, inv: Inverter, voc_cold: float,
        tilt_label: str, ac_cable_m: float, system_voltage: float) -> list[BomLine]:
    cables = cable_schedule(layout, system, module, voc_cold, system_voltage)
    dc_lines = dc_cable_lines(cables)
    lines = [
        BomLine("PV module", f"{module.manufacturer} {module.model}, {module.pnom_w:g} Wp"
                + (f", bifacial {module.bifaciality:.2f}" if module.is_bifacial else ""),
                system.n_modules, "pcs"),
        BomLine("String inverter", f"{inv.manufacturer} {inv.model}, {inv.pnom_kw:g} kW, {inv.n_mppt} MPPT",
                system.n_inverters, "pcs"),
        BomLine("Mounting structure", tilt_label, used_tables(layout, system), "tables"),
        *(BomLine("DC cable", f"{dc_cable_label(mm2, system_voltage)}, red + black", metres, "m")
          for mm2, metres in dc_lines),
        BomLine("DC connector pair", "MC4-compatible, matched to the module", system.n_strings * 2, "pairs"),
        BomLine("AC cable", _ac_cable_spec(inv), round(ac_cable_m * system.n_inverters), "m"),
        BomLine("AC distribution board", f"{_incomers(system.n_inverters)}, 1 outgoing", 1, "pcs"),
    ]
    return lines


def _incomers(count: int) -> str:
    """The incomers of the AC board by their count: "1 incomer", "2 incomers"."""
    return f"{count} incomer" + ("" if count == 1 else "s")


# The AC voltage taken when the OND gives none: a three-phase low-voltage grid's.
AC_VOLTS_TAKEN = 415


def _ac_cable_spec(inv: Inverter) -> str:
    """The AC cable's spec; a voltage the OND does not give is said to be taken (#179, item 26)."""
    if inv.v_out_v:
        return f"Inverter to ACDB, sized for {_i_ac(inv):.0f} A at {inv.v_out_v:.0f} V AC"
    return (f"Inverter to ACDB, sized for {_i_ac(inv):.0f} A at {AC_VOLTS_TAKEN} V AC by default, "
            "as the inverter file (OND) gives no output voltage")


def _i_ac(inv: Inverter) -> float:
    if inv.i_max_ac_a:
        return inv.i_max_ac_a
    return inv.pnom_kw * 1000 / (3 ** 0.5 * (inv.v_out_v or AC_VOLTS_TAKEN))

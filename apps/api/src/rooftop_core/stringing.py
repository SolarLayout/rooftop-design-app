# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""String sizing, string forming on the layout, and inverter / MPPT assignment.

* Series range: Voc at the lowest ambient ≤ system voltage (and the module and
  inverter maxima); Vmp cold ≤ MPPT max; Vmp at the highest ambient + ΔT ≥ MPPT min.
* Parallel: per MPPT, strings × Imp ≤ max input current and strings × Isc ≤ max
  short-circuit current (decision F2).
* A string runs along one row: out on the top line, back on the bottom (decision O6).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np

from .io.pvsyst import Inverter, Module
from .onediode import ModuleModel
from .placement import Layout

SYSTEM_VOLTAGES = (600.0, 1000.0, 1500.0)
CELL_RISE = {"flat_tilted": 25.0, "flat_ew": 25.0, "sloped_flush": 35.0}   # decision 14
DCAC_TARGET = (1.10, 1.30)
DCAC_WARN = 1.40


@dataclass
class SeriesRange:
    system_v: float
    t_min: float
    t_cell_hot: float
    voc_cold: float
    vmp_cold: float
    vmp_hot: float
    vmp_stc: float
    n_min: int
    n_max_voc: int
    n_max_mppt: int
    n_max: int
    n_nominal: int
    limit_v: float
    message: str = ""

    @property
    def ok(self) -> bool:
        return self.n_min <= self.n_max


def series_range(mm: ModuleModel, inv: Inverter, system_v: float, t_min: float, t_max: float,
                 cell_rise: float) -> SeriesRange:
    m = mm.m
    t_hot = t_max + cell_rise
    voc_cold = float(mm.voc(1000.0, t_min)[0])
    (_, _, _), (vmp_cold, vmp_hot, vmp_stc), _ = mm.mpp([1000.0] * 3, [t_min, t_hot, 25.0])
    limit_v = min(v for v in (system_v, inv.vabs_max or system_v, m.v_max_iec or system_v) if v)
    n_max_voc = math.floor(limit_v / voc_cold)
    n_max_mppt = math.floor(inv.vmpp_max / vmp_cold)
    n_min = math.ceil(inv.vmpp_min / vmp_hot)
    n_max = min(n_max_voc, n_max_mppt)
    n_nom = round(inv.vmpp_nom / vmp_stc) if inv.vmpp_nom else n_max
    n_nom = min(max(n_nom, n_min), n_max)
    msg = ""
    if n_min > n_max:
        msg = (f"No string length fits: at least {n_min} modules are needed for the {inv.vmpp_min:.0f} V "
               f"MPPT minimum, but at most {n_max} fit under {limit_v:.0f} V.")
    return SeriesRange(system_v, t_min, t_hot, voc_cold, float(vmp_cold), float(vmp_hot), float(vmp_stc),
                       n_min, n_max_voc, n_max_mppt, n_max, n_nom, limit_v, msg)


def strings_per_mppt(m: Module, inv: Inverter) -> int:
    imax, iscmax = inv.mppt_current_limit, inv.mppt_isc_limit
    if not imax:
        return max(1, inv.n_inputs // inv.n_mppt)
    return max(1, min(math.floor(imax / m.imp + 1e-9), math.floor(iscmax / m.isc + 1e-9)))


def max_strings_per_inverter(m: Module, inv: Inverter) -> int:
    return min(inv.n_mppt * strings_per_mppt(m, inv), inv.n_inputs)


@dataclass
class PVString:
    modules: list[int]
    row: int
    azimuth: float
    start_xy: tuple[float, float]
    extent_m: float


def form_strings(layout: Layout, n: int) -> list[PVString]:
    """Cut the layout into strings of n modules.

    Tilted and flush rows: along one row, out on the top line and back on the
    bottom (decision O6). East-west: along one side of a unit, snaking into the
    same side of the next unit, so a string never mixes east and west modules.
    """
    mods = layout.modules
    out: list[PVString] = []

    def emit(chosen: list[int], row: int):
        first = mods[chosen[0]]
        pts = [mods[j].center for j in chosen]
        out.append(PVString(chosen, row, first.azimuth, first.center, max(math.dist(pts[0], p) for p in pts)))

    if layout.kind == "flat_ew":
        for side in (0, 1):
            seq: list[int] = []
            units = sorted({m.row for m in mods if m.line == side})
            for k, u in enumerate(units):
                ms = sorted((m for m in mods if m.row == u and m.line == side), key=lambda m: m.col)
                seq += [m.idx for m in (ms if k % 2 == 0 else reversed(ms))]
            for i in range(0, len(seq) - n + 1, n):
                emit(seq[i:i + n], mods[seq[i]].row)
        return out

    by_row: dict[int, list] = {}
    for m in mods:
        by_row.setdefault(m.row, []).append(m)
    for row in sorted(by_row):
        ms = by_row[row]
        lines = sorted({m.line for m in ms}, reverse=True)      # top line first
        cols = sorted({m.col for m in ms})
        grid = {(m.col, m.line): m.idx for m in ms}
        c_need = math.ceil(n / len(lines))
        for i in range(0, len(cols) - c_need + 1, c_need):
            block = cols[i:i + c_need]
            order: list[int] = []
            for k, ln in enumerate(lines):
                seq = block if k % 2 == 0 else list(reversed(block))
                order += [grid[(c, ln)] for c in seq if (c, ln) in grid]
            if len(order) >= n:
                emit(order[:n], row)
    return out


@dataclass
class System:
    n_series: int
    strings: list[PVString]
    n_inverters: int
    inverter_of: list[int]          # per string
    mppt_of: list[int]              # per string, 0-based within its inverter
    inverter_xy: list[tuple[float, float]] = field(default_factory=list)

    @property
    def n_strings(self) -> int:
        return len(self.strings)

    @property
    def n_modules(self) -> int:
        return self.n_series * len(self.strings)

    def module_indices(self) -> list[int]:
        return [i for s in self.strings for i in s.modules]


def assign(strings: list[PVString], n_series: int, n_inverters: int, inv: Inverter,
           layout: Layout) -> System:
    """Split strings into inverters (contiguous in layout order) and spread them over MPPTs."""
    strings = sorted(strings, key=lambda s: (s.azimuth, s.row, s.start_xy[0]))
    n = len(strings)
    base, extra = divmod(n, max(1, n_inverters))
    inverter_of, mppt_of = [], []
    k = 0
    for i in range(n_inverters):
        cnt = base + (1 if i < extra else 0)
        per, rem = divmod(cnt, inv.n_mppt)
        sizes = [per + (1 if j < rem else 0) for j in range(inv.n_mppt)]
        for j, sz in enumerate(sizes):
            for _ in range(sz):
                inverter_of.append(i)
                mppt_of.append(j)
                k += 1
    boundary = layout.inner.exterior
    xy = []
    for i in range(n_inverters):
        pts = np.array([s.start_xy for s, v in zip(strings, inverter_of, strict=False) if v == i])
        c = pts.mean(axis=0) if len(pts) else np.array(layout.inner.centroid.coords[0])
        from shapely.geometry import Point

        p = boundary.interpolate(boundary.project(Point(*c)))
        xy.append((p.x, p.y))
    return System(n_series, strings, n_inverters, inverter_of, mppt_of, xy)


def dc_cable_m(system: System, layout: Layout, slack_m: float = 2.0) -> list[float]:
    """Per string: home run (+ and −) to the inverter, plus the return leg of single-line strings."""
    single_line = layout.kind == "flat_ew" or len({m.line for m in layout.modules}) == 1
    out = []
    for s, inv_i in zip(system.strings, system.inverter_of, strict=False):
        ix, iy = system.inverter_xy[inv_i]
        run = abs(s.start_xy[0] - ix) + abs(s.start_xy[1] - iy)
        out.append(2 * (run + slack_m) + (s.extent_m if single_line else 0.0))
    return out

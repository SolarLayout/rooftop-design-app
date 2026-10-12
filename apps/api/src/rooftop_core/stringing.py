# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""String sizing, string forming on the layout, and inverter / MPPT assignment.

* Series range: Voc at the lowest ambient ≤ system voltage (and the module and
  inverter maxima); Vmp cold ≤ MPPT max; Vmp at the highest ambient + ΔT ≥ MPPT min.
* Parallel: per MPPT, strings × Imp ≤ max input current and strings × Isc ≤ max
  short-circuit current (decision F2).
* A string runs along one row: out on the top line, back on the bottom (decision O6). What the
  rows leave at their ends is wired across rows of the same orientation.
"""

from __future__ import annotations

import math
from collections import Counter
from collections.abc import Callable
from dataclasses import dataclass, field

import numpy as np

from .io.pvsyst import Inverter, Module
from .onediode import ModuleModel
from .placement import Layout, PlacedModule

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
                 cell_rise: float, mu_voc_pct: float | None = None) -> SeriesRange:
    """*mu_voc_pct*: the Voc coefficient the user entered (%/°C), else None for the model's Voc."""
    m = mm.m
    t_hot = t_max + cell_rise
    voc_cold = mm.voc_cold(t_min, mu_voc_pct)
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
        # The limit that binds is said: the MPPT's maximum, or the voltage the strings must stay under.
        most = (f"fit the inverter's {inv.vmpp_max:.0f} V MPPT maximum" if n_max_mppt < n_max_voc
                else f"fit under {limit_v:.0f} V")
        msg = (f"A string needs at least {n_min} modules for the inverter's {inv.vmpp_min:.0f} V MPPT "
               f"minimum. At most {n_max} {most}.")
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
    across_rows: bool = False       # wired from what rows left at their ends: used after the strings in a row


def form_strings(layout: Layout, n: int) -> list[PVString]:
    """Cut the layout into strings of n modules.

    Tilted and flush rows: along one row, out on the top line and back on the
    bottom (decision O6). What the rows' whole strings leave at their ends runs
    on into the next row of the same orientation, turning back at each, so the
    roof's positions are used. East-west: along one side of a unit, snaking into
    the same side of the next unit, so a string never mixes east and west modules.
    """
    mods = layout.modules
    out: list[PVString] = []

    def emit(chosen: list[int], row: int, across_rows: bool = False):
        first = mods[chosen[0]]
        pts = [mods[j].center for j in chosen]
        out.append(PVString(chosen, row, first.azimuth, first.center, max(math.dist(pts[0], p) for p in pts),
                            across_rows))

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

    def wired(cols: list[int], lines: list[int], grid: dict[tuple[int, int], int]) -> list[int]:
        """The modules of these columns in wiring order: out on the top line, back on the bottom."""
        order: list[int] = []
        for k, ln in enumerate(lines):
            seq = cols if k % 2 == 0 else list(reversed(cols))
            order += [grid[(c, ln)] for c in seq if (c, ln) in grid]
        return order

    by_row: dict[int, list] = {}
    for m in mods:
        by_row.setdefault(m.row, []).append(m)
    left: dict[tuple[float, float], list[list[int]]] = {}   # per orientation, what each row's strings left
    for row in sorted(by_row):
        ms = by_row[row]
        lines = sorted({m.line for m in ms}, reverse=True)      # top line first
        cols = sorted({m.col for m in ms})
        grid = {(m.col, m.line): m.idx for m in ms}
        c_need = math.ceil(n / len(lines))
        taken: set[int] = set()
        for i in range(0, len(cols) - c_need + 1, c_need):
            order = wired(cols[i:i + c_need], lines, grid)
            if len(order) >= n:
                emit(order[:n], row)
                taken.update(order[:n])
        rest = [i for i in wired(cols, lines, grid) if i not in taken]
        if rest:
            left.setdefault((round(ms[0].tilt, 3), round(ms[0].azimuth, 3)), []).append(rest)
    # What is left runs on from row to row, turning back at each, so a string never mixes two orientations.
    for rests in left.values():
        seq = [i for k, rest in enumerate(rests) for i in (rest if k % 2 == 0 else reversed(rest))]
        for i in range(0, len(seq) - n + 1, n):
            emit(seq[i:i + n], mods[seq[i]].row, across_rows=True)
    return out


def strings_held(layout: Layout) -> Callable[[int], int]:
    """How many strings of a length the layout holds, as form_strings forms them, without forming them: each
    takes its length, and what is left is wired on within its orientation (an east-west side), so each
    orientation holds its positions divided by the length. The positions are counted once."""
    sizes: Counter[object] = Counter()
    if layout.kind == "flat_ew":
        sizes.update(m.line for m in layout.modules if m.line in (0, 1))
    else:
        first_of_row: dict[int, PlacedModule] = {}
        for m in layout.modules:
            first = first_of_row.setdefault(m.row, m)
            sizes[(round(first.tilt, 3), round(first.azimuth, 3))] += 1
    return lambda n: sum(size // n for size in sizes.values()) if n >= 1 else 0


def lengths_to_try(n_min: int, n_max: int, nominal: int, held: Callable[[int], int]) -> list[int]:
    """The string lengths the run simulates, longest first: the one nearest the inverter's nominal MPP
    voltage, the longest (the fewest strings), and the one from the nominal up that places the most modules,
    the nearest the nominal on a tie; the longest but one when that is one of the other two.

    The fill is not looked for below the nominal: a shorter string carries more current for its power and
    needs more strings, cables and connectors, which the run does not price, so it would win on a few
    positions what a designer would not build."""
    fill = max(range(nominal, n_max + 1), key=lambda n: (n * held(n), -n))
    lengths = {nominal, n_max, fill}
    if len(lengths) < 3:
        lengths.add(max(n_min, n_max - 1))
    return sorted(lengths, reverse=True)


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

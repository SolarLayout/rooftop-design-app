# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Stringing options the user chooses from: modules in series × parallel strings × inverters.

Each option is a full energy run, so options are compared on MWh, not only on
DC/AC (spec, Strings view).
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from .geometry import Roof
from .io.pvsyst import Inverter, Module
from .onediode import ModuleModel
from .placement import Layout
from .shading import annual_string_shade
from .simulation import Losses, Precomputed, SimResult, simulate
from .stringing import (
    DCAC_TARGET,
    DCAC_WARN,
    PVString,
    SeriesRange,
    System,
    assign,
    form_strings,
    max_strings_per_inverter,
)


@dataclass
class StringOption:
    key: str                # "26x24x1"
    letter: str
    n_series: int
    n_strings: int
    n_inverters: int
    available_strings: int
    dc_kwp: float
    dcac: float
    ok: bool
    note: str
    system: System
    result: SimResult
    recommended: bool = False
    custom: bool = False

    @property
    def n_modules(self) -> int:
        return self.n_series * self.n_strings

    @property
    def title(self) -> str:
        base = f"{self.letter}"
        if self.recommended:
            return base + " · Recommended"
        if self.custom:
            return base + " · Custom"
        return base + (f" · {self.note}" if self.note and not self.ok else "")


def verdict(dcac: float) -> tuple[bool, str]:
    lo, hi = DCAC_TARGET
    if dcac < lo:
        return False, "below target"
    if dcac > DCAC_WARN:
        return False, "heavy clipping"
    if dcac > hi:
        return False, "above target"
    return True, ""


def ranked_strings(pre: Precomputed, layout: Layout, n: int) -> list[PVString]:
    strings = form_strings(layout, n)
    if not strings:
        return []
    beam = np.mean([g["beam"] for g in pre.groups.values()], axis=0)
    shade = annual_string_shade(pre.shading, beam, [s.modules for s in strings])
    return [strings[i] for i in np.argsort(shade, kind="stable")]


def make_option(pre, layout, module, mm, inv, losses, roof, n, s, k, ranked, custom=False) -> StringOption:
    chosen = ranked[:s]
    system = assign(chosen, n, k, inv, layout)
    res = simulate(pre, layout, module, mm, inv, system, losses, roof)
    dcac = s * n * module.pnom_w / (k * inv.pnom_kw * 1000.0)
    ok, note = verdict(dcac)
    return StringOption(f"{n}x{s}x{k}", "", n, s, k, len(ranked), res.dc_kwp, dcac, ok, note, system, res,
                        custom=custom)


def build_options(pre: Precomputed, layout: Layout, module: Module, mm: ModuleModel, inv: Inverter,
                  rng: SeriesRange, losses: Losses, roof: Roof, max_options: int = 5,
                  on_option=None) -> list[StringOption]:
    """*on_option* hears (done, total) after every option that is simulated."""
    if not rng.ok:
        return []
    candidates = sorted({rng.n_nominal, rng.n_max, max(rng.n_min, rng.n_max - 1)}, reverse=True)
    smax = max_strings_per_inverter(module, inv)
    pac = inv.pnom_kw * 1000.0
    combos: list[tuple[int, int, int]] = []
    for n in candidates:
        ranked = ranked_strings(pre, layout, n)
        avail = len(ranked)
        if not avail:
            continue
        best = None
        for k in range(1, math.ceil(avail / smax) + 1):
            s = min(avail, k * smax, math.floor(DCAC_TARGET[1] * k * pac / (n * module.pnom_w)))
            if s >= k and s * n * module.pnom_w / (k * pac) >= DCAC_TARGET[0]:
                if best is None or s > best[1]:
                    best = (n, s, k)
        if best:
            combos.append(best)
        k0 = best[2] if best else 1
        s_fill = min(avail, k0 * smax)
        if not best or s_fill > best[1]:
            combos.append((n, s_fill, k0))
        k_all = math.ceil(avail / smax)
        combos.append((n, avail, k_all))
    seen, opts = set(), []
    ranked_cache: dict[int, list[PVString]] = {}
    total = len({c for c in combos if c[1] >= 1})
    for n, s, k in combos:
        if (n, s, k) in seen or s < 1:
            continue
        seen.add((n, s, k))
        ranked = ranked_cache.setdefault(n, ranked_strings(pre, layout, n))
        opts.append(make_option(pre, layout, module, mm, inv, losses, roof, n, s, k, ranked))
        if on_option:
            on_option(len(opts), total)
    opts.sort(key=lambda o: (not o.ok, -o.result.energy_mwh))
    opts = opts[:max_options]
    for i, o in enumerate(opts):
        o.letter = "ABCDEFGH"[i]
    if opts:
        opts[0].recommended = opts[0].ok
    return opts


def custom_option(pre, layout, module, mm, inv, losses, roof, n: int, s: int, k: int, letter: str = "X") -> StringOption:
    ranked = ranked_strings(pre, layout, n)
    s = min(s, len(ranked))
    o = make_option(pre, layout, module, mm, inv, losses, roof, n, s, k, ranked, custom=True)
    o.letter = letter
    return o

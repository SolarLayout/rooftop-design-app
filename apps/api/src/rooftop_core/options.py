# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Stringing options the user chooses from: modules in series × parallel strings × inverters.

Each option is a full energy run, so options are compared on MWh, not only on
DC/AC (spec, Strings view).
"""

from __future__ import annotations

import math
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Literal

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

CUSTOM_KEY = "custom"  # there is one custom option at most (decision 8)
Misfit = Literal["voc", "mppt_max", "mppt_min", "strings"]


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


# The candidates are simulated in this many threads at most (Phase 8, decision 17): each simulation is numpy
# work of about half a second that releases the interpreter, and the candidates are independent. Eight bring the
# demo's seven from 3.8 s to 0.9 s; more bring nothing.
SIMULATION_THREADS = 8


def workers_for(candidates: int) -> int:
    """How many threads simulate this many candidates: one each, and never more than SIMULATION_THREADS."""
    return max(1, min(candidates, SIMULATION_THREADS))


def build_options(pre: Precomputed, layout: Layout, module: Module, mm: ModuleModel, inv: Inverter,
                  rng: SeriesRange, losses: Losses, roof: Roof, max_options: int = 5,
                  on_option=None) -> list[StringOption]:
    """*on_option* hears (done, total) after every option that is simulated, in the caller's thread.

    The candidates are simulated in threads (SIMULATION_THREADS) and come out in the order they were made in,
    the same to the bit as one after the other.
    """
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
    seen: set[tuple[int, int, int]] = set()
    todo: list[tuple[int, int, int, list[PVString]]] = []
    ranked_cache: dict[int, list[PVString]] = {}
    for n, s, k in combos:
        if (n, s, k) in seen or s < 1:
            continue
        seen.add((n, s, k))
        todo.append((n, s, k, ranked_cache.setdefault(n, ranked_strings(pre, layout, n))))
    total = len(todo)
    with ThreadPoolExecutor(max_workers=workers_for(total), thread_name_prefix="simulate") as pool:
        futures = [pool.submit(make_option, pre, layout, module, mm, inv, losses, roof, n, s, k, ranked)
                   for n, s, k, ranked in todo]
        for done, _ in enumerate(as_completed(futures), start=1):
            if on_option:
                on_option(done, total)
        opts = [future.result() for future in futures]
    opts.sort(key=lambda o: (not o.ok, -o.result.energy_mwh))
    opts = opts[:max_options]
    for i, o in enumerate(opts):
        o.letter = "ABCDEFGH"[i]
    if opts:
        opts[0].recommended = opts[0].ok
    return opts


@dataclass(frozen=True)
class CustomMisfit:
    """Why a custom option cannot be built, with the numbers it was asked with."""

    reason: Misfit
    n_series: int
    n_strings: int  # as many of those asked as the roof holds
    n_inverters: int


def custom_misfit(rng: SeriesRange, layout: Layout, n: int, s: int, k: int) -> CustomMisfit | None:
    """Why *n* in series × *s* strings × *k* inverters cannot be built, or None when it can.

    Needs a series range that fits. Strings asked beyond what the roof holds count as what it holds.
    """
    if n > rng.n_max_voc:
        return CustomMisfit("voc", n, s, k)
    if n > rng.n_max_mppt:
        return CustomMisfit("mppt_max", n, s, k)
    if n < rng.n_min:
        return CustomMisfit("mppt_min", n, s, k)
    held = min(s, len(form_strings(layout, n)))
    return CustomMisfit("strings", n, held, k) if held < k else None


def custom_option(pre, layout, module, mm, inv, losses, roof, n: int, s: int, k: int, letter: str = "X") -> StringOption:
    ranked = ranked_strings(pre, layout, n)
    s = min(s, len(ranked))
    o = make_option(pre, layout, module, mm, inv, losses, roof, n, s, k, ranked, custom=True)
    o.key, o.letter = CUSTOM_KEY, letter
    return o

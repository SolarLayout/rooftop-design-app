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
from .simulation import KeptPoints, Losses, Precomputed, SimResult, StringPhysics, simulate, string_physics
from .stringing import (
    DCAC_TARGET,
    DCAC_WARN,
    PVString,
    SeriesRange,
    System,
    assign,
    form_strings,
    lengths_to_try,
    max_strings_per_inverter,
    strings_held,
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


@dataclass
class OfLength:
    """The strings of one series length, those in a row and then those across rows, each least shaded first, and
    their hours (shared by its candidates, D66)."""

    ranked: list[PVString]
    physics: StringPhysics


def of_length(pre: Precomputed, layout: Layout, module: Module, mm: ModuleModel, losses: Losses, roof: Roof,
              n: int, strings: list[PVString] | None = None, kept: KeptPoints | None = None) -> OfLength:
    """The strings of *n* modules the layout holds (*strings*, when they are formed already), those in their rows
    before those across rows, each part ordered by its beam-weighted annual shaded fraction (stable: the order they
    were formed in breaks a tie), with their hours worked out once."""
    strings = form_strings(layout, n) if strings is None else strings
    physics = string_physics(pre, module, mm, strings, losses, roof, kept)
    if not strings:
        return OfLength([], physics)
    beam = np.mean([g["beam"] for g in pre.groups.values()], axis=0)
    total = max(beam.sum(), 1e-9)
    # Each string's hours summed alone and in order, as a row of its own.
    shade = np.ascontiguousarray((physics.E * beam[:, None]).T).sum(axis=1) / total
    # The strings in their rows first, those across rows only when more are needed: each needs a jumper.
    return OfLength([strings[i] for i in np.lexsort((shade, [s.across_rows for s in strings]))], physics)


def make_option(pre, layout, module, mm, inv, losses, roof, n, s, k, held: OfLength, custom=False) -> StringOption:
    ranked = held.ranked
    chosen = ranked[:s]
    system = assign(chosen, n, k, inv, layout)
    res = simulate(pre, layout, module, mm, inv, system, losses, roof, held.physics)
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


def combos_of(n: int, avail: int, smax: int, pac_w: float, module_w: float) -> list[tuple[int, int, int]]:
    """The (series, strings, inverters) simulated for strings of *n*, *avail* of them on the roof, each inverter taking
    *smax* strings and *pac_w* of AC: the most strings within the DC/AC target, on as many inverters as that takes; the
    strings that fill those inverters; and every string on the fewest inverters that take them. Each once, in order."""
    if not avail:
        return []
    string_w = n * module_w
    combos: list[tuple[int, int, int]] = []
    best = None
    # Up to the most inverters that keep every string at the target's low end: a small inverter meets the target by
    # more inverters, where the fewest that take every string would leave strings, and so positions, unused.
    most = max(math.ceil(avail / smax), math.floor(avail * string_w / (DCAC_TARGET[0] * pac_w)))
    for k in range(1, most + 1):
        s = min(avail, k * smax, math.floor(DCAC_TARGET[1] * k * pac_w / string_w))
        if s >= k and s * string_w / (k * pac_w) >= DCAC_TARGET[0]:
            if best is None or s > best[1]:
                best = (n, s, k)
    if best:
        combos.append(best)
    k0 = best[2] if best else 1
    s_fill = min(avail, k0 * smax)
    if not best or s_fill > best[1]:
        combos.append((n, s_fill, k0))
    combos.append((n, avail, math.ceil(avail / smax)))
    return list(dict.fromkeys(combo for combo in combos if combo[1] >= 1))


def build_options(pre: Precomputed, layout: Layout, module: Module, mm: ModuleModel, inv: Inverter,
                  rng: SeriesRange, losses: Losses, roof: Roof, max_options: int = 5,
                  on_option=None, kept: KeptPoints | None = None) -> list[StringOption]:
    """*on_option* hears (done, total) after every option that is simulated, in the caller's thread.

    The candidates of a length are simulated in threads (SIMULATION_THREADS) and come out in the order they were
    made in, the same to the bit as one after the other.
    """
    if not rng.ok:
        return []
    candidates = lengths_to_try(rng.n_min, rng.n_max, rng.n_nominal, strings_held(layout))
    smax = max_strings_per_inverter(module, inv)
    pac = inv.pnom_kw * 1000.0
    formed = {n: form_strings(layout, n) for n in candidates}
    todo = [combo for n in candidates for combo in combos_of(n, len(formed[n]), smax, pac, module.pnom_w)]
    total = len(todo)
    made: list[StringOption | None] = [None] * total
    done = 0
    # One length at a time: its strings' hours worked out once, its candidates simulated from them, then let go,
    # so that no more than one length's hours are held at once.
    with ThreadPoolExecutor(max_workers=workers_for(total), thread_name_prefix="simulate") as pool:
        for n in dict.fromkeys(n for n, _, _ in todo):
            held = of_length(pre, layout, module, mm, losses, roof, n, formed[n], kept)
            futures = {pool.submit(make_option, pre, layout, module, mm, inv, losses, roof, n, s, k, held): i
                       for i, (m, s, k) in enumerate(todo) if m == n}
            for future in as_completed(futures):
                made[futures[future]] = future.result()
                done += 1
                if on_option:
                    on_option(done, total)
            del held
    opts = [option for option in made if option is not None]
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
    held = min(s, strings_held(layout)(n))
    return CustomMisfit("strings", n, held, k) if held < k else None


def custom_option(pre, layout, module, mm, inv, losses, roof, n: int, s: int, k: int, letter: str = "X",
                  kept: KeptPoints | None = None) -> StringOption:
    held = of_length(pre, layout, module, mm, losses, roof, n, kept=kept)
    s = min(s, len(held.ranked))
    o = make_option(pre, layout, module, mm, inv, losses, roof, n, s, k, held, custom=True)
    o.key, o.letter = CUSTOM_KEY, letter
    return o

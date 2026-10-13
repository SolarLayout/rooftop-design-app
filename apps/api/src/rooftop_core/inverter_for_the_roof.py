"""The inverter for a design's roof, when the app sets it (D118).

The pool is Waaree's on-grid inverters, copies of the library's files bundled with the engine. Each is
fitted to the roof as the options are made, without a simulation: the lengths that fit at the design's
voltage, the strings the roof holds of each, and the most strings within the DC/AC target on as many
inverters as that takes (``combos_of``). Of the fits that keep the most modules, or nearly as many
(``NEAR_THE_MOST``), the one on the fewest inverters is chosen, then the one with the most modules, then
the one nearest the middle of the target.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import cache
from pathlib import Path
from typing import TYPE_CHECKING

from .io.pvsyst import Inverter, read_ond
from .options import combos_of
from .placement import Layout
from .resources import samples_dir
from .stringing import (
    DCAC_TARGET,
    form_strings,
    lengths_to_try,
    max_strings_per_inverter,
    series_range,
    strings_held,
)

if TYPE_CHECKING:
    from .project import Design

# A fit within this share of the most modules any inverter keeps counts as keeping as many: one large
# inverter that leaves a string out is better than two hundred small ones that leave none.
NEAR_THE_MOST = 0.95
MIDDLE = sum(DCAC_TARGET) / 2


def pool_folder() -> Path:
    return samples_dir() / "for_the_roof"


@cache
def roof_inverters() -> tuple[tuple[str, Inverter], ...]:
    """The pool, each file's name with the inverter read from it, by name. Read once; never changed after."""
    return tuple((path.name, read_ond(path)) for path in sorted(pool_folder().glob("*.OND")))


@dataclass(frozen=True)
class RoofFit:
    """An inverter of the pool on the roof: its file, and the strings within the target it takes."""

    file: str
    inverter: Inverter
    n_series: int
    n_strings: int
    n_inverters: int
    dcac: float

    @property
    def n_modules(self) -> int:
        return self.n_series * self.n_strings


def _fit(file: str, inverter: Inverter, design: Design, held: dict[int, int]) -> RoofFit | None:
    """The best way *inverter* takes the roof within the target, or None.

    *held* keeps the strings the roof holds of each length, for the next inverter."""
    p, layout, module = design.p, design.layout, design.module
    rng = series_range(
        design.mm,
        inverter,
        p.system_voltage,
        design.t_min,
        design.t_max,
        design.cell_rise,
        p.voc_coefficient_pct,
    )
    if not rng.ok:
        return None
    smax = max_strings_per_inverter(module, inverter)
    pac = inverter.pnom_kw * 1000.0
    best: RoofFit | None = None
    for n in lengths_to_try(rng.n_min, rng.n_max, rng.n_nominal, strings_held(layout)):
        if n not in held:
            held[n] = len(form_strings(layout, n))
        for _, s, k in combos_of(n, held[n], smax, pac, module.pnom_w):
            dcac = s * n * module.pnom_w / (k * pac)
            if not DCAC_TARGET[0] <= dcac <= DCAC_TARGET[1]:
                continue
            fit = RoofFit(file, inverter, n, s, k, dcac)
            if best is None or _rank(fit) > _rank(best):
                best = fit
    return best


def _rank(fit: RoofFit) -> tuple[int, int, float]:
    return fit.n_modules, -fit.n_inverters, -abs(fit.dcac - MIDDLE)


def _layout_holds_a_module(layout: Layout | None) -> bool:
    return layout is not None and layout.n_modules > 0


def inverter_for_the_roof(design: Design) -> RoofFit | None:
    """The pool's inverter for the design's laid-out roof at its voltage; None without a voltage or a fit."""
    if not design.p.system_voltage or not _layout_holds_a_module(design.layout):
        return None
    held: dict[int, int] = {}
    fits = [fit for file, inverter in roof_inverters() if (fit := _fit(file, inverter, design, held))]
    if not fits:
        return None
    most = max(fit.n_modules for fit in fits)
    near = [fit for fit in fits if fit.n_modules >= NEAR_THE_MOST * most]
    return max(near, key=lambda fit: (-fit.n_inverters, *_rank(fit)))

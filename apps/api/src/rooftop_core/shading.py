# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67; kept by what it depends on since Phase 13 (D65).
"""Hourly near shading for every module: linear (geometric) and electrical.

* Row-to-row shading is analytic: the edge in front (height H above the table's
  lower edge, horizontal distance D) shades the table from its lower edge up to
  u* = (H − D·tanψ) / (sinβ + cosβ·tanψ), ψ being the sun's profile angle.
* Obstacle shadows are projected on the horizontal plane at each module's mid
  height and intersected with its footprint. Sun positions are binned (1° in
  elevation, 2.5° in azimuth) so each distinct position is computed once.
* Electrical shading uses the module's bypass layout. A band from the lower edge
  (row shading) costs a whole portrait module, half of a twin half-cell portrait
  module, and one substring per third in landscape. A string then runs at its
  weakest module.

The shading is kept by what it depends on, never as hours × modules (D65). Row-to-row shading depends on the
row a module stands in, and the modules whose rows stand alike shade alike: a few classes on any roof. So
f_lin and e_mod are kept per class, as if no obstacle shaded, and apart from them the few hours of a module
on which an obstacle's shadow falls, with the values those hours take (the shadows are worked out once per
position of the sun, then spread over the hours at that position). A reader is given the hours × modules it
asks for as its classes' columns with those hours written over them, a block of modules at a time: every value
is worked out by the arithmetic of the desktop app's dense arrays, so it is the value they held.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass

import numpy as np
import shapely
from pvlib import shading as pvshading
from shapely.ops import unary_union

from .geometry import Roof, prisms_of, prisms_shadow, sky_loss_sectors, solids_of
from .io.pvsyst import Module
from .placement import Layout

EL_BIN, AZ_BIN = 1.0, 2.5
MIN_FRACTION = 0.01
BLOCK = 512  # modules made at a time from the parts: 8,760 hours × 512 × 4 bytes is 18 MB an array


@dataclass
class ShadingResult:
    row_class: np.ndarray    # (modules,) the class of each module for row-to-row shading
    f_lin_class: np.ndarray  # (hours, classes) float32: beam fraction shaded, per class, where no obstacle shades
    e_mod_class: np.ndarray  # (hours, classes) float32: module power fraction lost, the same
    cell_hour: np.ndarray    # (cells,) the hours of a module on which an obstacle's shadow falls ...
    cell_module: np.ndarray  # (cells,) ... the module ...
    cell_f_lin: np.ndarray   # (cells,) float32 ... its f_lin then ...
    cell_e_mod: np.ndarray   # (cells,) float32 ... and its e_mod
    sky_loss: np.ndarray     # (modules,) diffuse fraction lost
    far_block: np.ndarray    # (hours,) beam blocked by the horizon

    @property
    def n_hours(self) -> int:
        return len(self.far_block)

    @property
    def n_modules(self) -> int:
        return len(self.row_class)

    def arrays(self) -> list[np.ndarray]:
        return [self.row_class, self.f_lin_class, self.e_mod_class, self.cell_hour, self.cell_module,
                self.cell_f_lin, self.cell_e_mod, self.sky_loss, self.far_block]

    @property
    def nbytes(self) -> int:
        return sum(array.nbytes for array in self.arrays())

    def f_lin_of(self, modules: Sequence[int] | np.ndarray | None = None) -> np.ndarray:
        """(hours, modules) beam fraction shaded, row and obstacles together; every module when none are named."""
        return self._made(self.f_lin_class, self.cell_f_lin, modules)

    def e_mod_of(self, modules: Sequence[int] | np.ndarray | None = None) -> np.ndarray:
        """(hours, modules) module power fraction lost to shading (electrical); every module when none are named."""
        return self._made(self.e_mod_class, self.cell_e_mod, modules)

    def by_blocks(self, modules: Sequence[int] | np.ndarray, reduce: Callable[[np.ndarray], np.ndarray],
                  electrical: bool = False) -> np.ndarray:
        """*reduce* of the f_lin (or, *electrical*, the e_mod) of each block of *modules*, joined along the modules:
        for readers that sum the hours away, so that no more than a block of hours × modules is made at once."""
        modules = np.asarray(modules, dtype=int)
        make = self.e_mod_of if electrical else self.f_lin_of
        out = [reduce(make(modules[i:i + BLOCK])) for i in range(0, len(modules), BLOCK)]
        return np.concatenate(out) if out else np.zeros(0)

    def _made(self, by_class: np.ndarray, by_cell: np.ndarray, modules) -> np.ndarray:
        modules = np.arange(self.n_modules) if modules is None else np.asarray(modules, dtype=int)
        out = by_class[:, self.row_class[modules]]
        column = np.full(self.n_modules, -1)
        column[modules] = np.arange(len(modules))
        here = column[self.cell_module] >= 0
        out[self.cell_hour[here], column[self.cell_module[here]]] = by_cell[here]
        return out


def linear(f_row: np.ndarray, f_obj: np.ndarray) -> np.ndarray:
    """1 − (1 − f_row)(1 − f_obj), worked out in place: one array of the size and one temporary."""
    lit = 1.0 - f_row
    lit *= 1.0 - f_obj
    return np.subtract(1.0, lit, out=lit)


def electrical(f_row: np.ndarray, f_obj: np.ndarray, orientation: str, half_cell: bool, n_diodes: int
               ) -> np.ndarray:
    e_row = electrical_rule(f_row, orientation, half_cell, n_diodes)
    e_obj = electrical_rule(f_obj, orientation, half_cell, n_diodes)
    e_mod = (1.0 - (1.0 - e_row) * (1.0 - e_obj)).astype(np.float32)
    return np.maximum(e_mod, linear(f_row, f_obj))  # electrical never less than the geometric loss


def electrical_rule(f: np.ndarray, orientation: str, half_cell: bool, n_diodes: int) -> np.ndarray:
    f = np.where(f < MIN_FRACTION, 0.0, f)
    if orientation == "portrait":
        if half_cell:
            return np.ceil(f * 2.0 - 1e-9) / 2.0
        return (f > 0).astype(float)
    n = max(1, n_diodes)
    return np.ceil(f * n - 1e-9) / n


def row_classes(layout: Layout) -> tuple[np.ndarray, list[tuple]]:
    """The class of every module for row-to-row shading, and each class's geometry: the modules with nothing in
    front are class 0, whose geometry is None; the others share a class when their geometry is the same."""
    keys: dict[tuple, int] = {None: 0}
    of = np.zeros(len(layout.modules), dtype=np.int32)
    for m in layout.modules:
        key = None if m.front is None else (m.front[0], m.front[1], m.tilt, m.azimuth, m.span[0], m.span[1],
                                            m.slope_len)
        of[m.idx] = keys.setdefault(key, len(keys))
    return of, list(keys)


def class_fraction(geometry: list[tuple], elev: np.ndarray, az: np.ndarray) -> np.ndarray:
    """(hours, classes) beam fraction shaded by the row or unit in front, per class of row_classes."""
    out = np.zeros((len(elev), len(geometry)), dtype=np.float32)
    if len(geometry) < 2:
        return out
    H, D, tilt, gam, u0, u1, L = (np.array(values) for values in zip(*geometry[1:], strict=True))
    beta = np.radians(tilt)
    el = np.radians(np.clip(elev, 0.0, 90.0))[:, None]
    rel = np.radians(az[:, None] - gam[None, :])
    cosrel = np.cos(rel)
    with np.errstate(divide="ignore", invalid="ignore"):
        tanpsi = np.where(cosrel > 1e-6, np.tan(el) / cosrel, np.inf)
        ustar = (H - D * tanpsi) / (np.sin(beta) + np.cos(beta) * tanpsi)
    ustar = np.clip(np.nan_to_num(ustar, nan=0.0, neginf=0.0, posinf=0.0), 0.0, L)
    frac = np.clip((ustar - u0) / (u1 - u0), 0.0, 1.0)
    out[:, 1:] = np.where((elev[:, None] > 0) & (cosrel > 1e-6), frac, 0.0)
    return out


def row_fraction(layout: Layout, elev: np.ndarray, az: np.ndarray) -> np.ndarray:
    """(hours, modules) beam fraction shaded by the row or unit in front."""
    of, geometry = row_classes(layout)
    return class_fraction(geometry, elev, az)[:, of]


def sun_positions(elev: np.ndarray, az: np.ndarray) -> tuple[np.ndarray, list[tuple[int, int]]]:
    """The position of the sun of every hour, binned (EL_BIN, AZ_BIN), in the order the day's hours first reach
    it; the night's hours get the position past the last. And the bins of the positions."""
    eb = np.round(elev / EL_BIN).astype(int)
    ab = np.round(az / AZ_BIN).astype(int)
    index: dict[tuple[int, int], int] = {}
    day = elev > 0
    for key in zip(eb[day].tolist(), ab[day].tolist(), strict=True):
        index.setdefault(key, len(index))
    position = np.full(len(elev), len(index), dtype=np.int32)
    position[day] = [index[key] for key in zip(eb[day].tolist(), ab[day].tolist(), strict=True)]
    return position, list(index)


def object_parts(layout: Layout, roof: Roof, bins: list[tuple[int, int]], on_part=None
                 ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """The obstacles' and the parapet's shadows on the modules: (position, module, fraction covered) wherever a
    shadow falls on a module, for every position of the sun in *bins*.

    The tree of the modules is asked for those the shadow intersects, not those its bounding box touches: the
    parapet's shadow is a ring round the roof, whose box holds every module.
    *on_part* hears (done, total) after every distinct position of the sun that is worked out.
    """
    mods = layout.modules
    found_position: list[np.ndarray] = []
    found_module: list[np.ndarray] = []
    found_fraction: list[np.ndarray] = []
    casters = roof.all_casters()
    empty = (np.zeros(0, dtype=np.int32), np.zeros(0, dtype=np.int32), np.zeros(0, dtype=np.float32))
    if not casters or not mods:
        return empty
    prisms = prisms_of(solids_of(casters))
    polys = np.array([m.poly for m in mods], dtype=object)
    areas = shapely.area(polys)
    tree = shapely.STRtree(polys)
    zkey = np.round(np.array([m.z_mid for m in mods]) / 0.05) * 0.05
    zgroups = {z: np.where(zkey == z)[0] for z in np.unique(zkey)}
    for done, key in enumerate(bins, start=1):
        row = np.zeros(len(mods), dtype=np.float32)
        el_c, az_c = max(key[0] * EL_BIN, 0.5), key[1] * AZ_BIN
        for z, members in zgroups.items():
            parts = prisms_shadow(prisms, float(z), el_c, az_c)
            if not len(parts):
                continue
            sh = unary_union(parts)
            if sh.is_empty:
                continue
            # The modules a part of the shadow intersects are those the whole intersects: asked part by part,
            # the tree tests only the modules in each part's own box.
            cand = np.unique(tree.query(parts, predicate="intersects")[1])
            cand = np.intersect1d(cand, members, assume_unique=False)
            if len(cand):
                inter = shapely.area(shapely.intersection(polys[cand], sh))
                row[cand] = inter / areas[cand]
        hit = np.nonzero(row)[0]
        found_position.append(np.full(len(hit), done - 1, dtype=np.int32))
        found_module.append(hit.astype(np.int32))
        found_fraction.append(row[hit])
        if on_part:
            on_part(done, len(bins))
    if not found_position:
        return empty
    return np.concatenate(found_position), np.concatenate(found_module), np.concatenate(found_fraction)


def compute(layout: Layout, roof: Roof, module: Module, orientation: str,
            elev: np.ndarray, az: np.ndarray, horizon: list[tuple[float, float]] | None = None,
            on_part=None) -> ShadingResult:
    """*on_part* hears (done, total) while the shadows of the obstacles are worked out: nearly all of the time."""
    elev = np.asarray(elev, dtype=float)
    az = np.asarray(az, dtype=float)
    of, geometry = row_classes(layout)
    f_row = class_fraction(geometry, elev, az)
    position, bins = sun_positions(elev, az)
    obj_position, obj_module, obj_fraction = object_parts(layout, roof, bins, on_part)

    mods = layout.modules
    pts = np.array([m.center for m in mods]) if mods else np.zeros((0, 2))
    z = np.array([m.z_mid for m in mods]) if mods else np.zeros(0)
    sky = sky_loss_sectors(pts, z, roof.all_casters(), horizon) if len(mods) else np.zeros(0)
    if layout.gcr and layout.gcr < 1.0:
        row_mask = pvshading.sky_diffuse_passias(pvshading.masking_angle_passias(layout.tilt, layout.gcr))
        has_front = np.array([m.front is not None for m in mods])
        sky = np.where(has_front, 1.0 - (1.0 - sky) * (1.0 - float(row_mask)), sky)

    far = np.zeros(len(elev), dtype=bool)
    if horizon:
        az_h = np.array([a for a, _ in horizon])
        el_h = np.array([e for _, e in horizon])
        far = (elev > 0) & (elev < np.interp(az % 360.0, az_h, el_h, period=360.0))
    rule = (orientation, module.half_cell, module.n_diodes)
    no_obstacle = np.zeros_like(f_row)
    cell_hour, cell_module, cell_f_obj = spread_over_hours(position, obj_position, obj_module, obj_fraction)
    cell_f_row = f_row[cell_hour, of[cell_module]]
    return ShadingResult(
        of, linear(f_row, no_obstacle), electrical(f_row, no_obstacle, *rule),
        cell_hour, cell_module, linear(cell_f_row, cell_f_obj), electrical(cell_f_row, cell_f_obj, *rule),
        sky.astype(np.float32), far)


def spread_over_hours(position: np.ndarray, obj_position: np.ndarray, obj_module: np.ndarray,
                      obj_fraction: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Each shadow of a position on a module, at every hour of that position: (hour, module, fraction)."""
    hours = np.argsort(position, kind="stable").astype(np.int32)
    count = np.bincount(position, minlength=int(obj_position.max(initial=-1)) + 1)
    first = np.concatenate(([0], np.cumsum(count)[:-1]))
    repeat = count[obj_position]
    entry = np.repeat(np.arange(len(obj_position)), repeat)
    within = np.arange(len(entry)) - np.repeat(np.cumsum(repeat) - repeat, repeat)
    return hours[first[obj_position[entry]] + within], obj_module[entry], obj_fraction[entry]


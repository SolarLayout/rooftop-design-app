# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
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
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import shapely
from pvlib import shading as pvshading

from .geometry import Roof, casters_shadow, sky_loss_sectors
from .io.pvsyst import Module
from .placement import Layout

EL_BIN, AZ_BIN = 1.0, 2.5
MIN_FRACTION = 0.01


@dataclass
class ShadingResult:
    f_lin: np.ndarray        # (hours, modules) beam fraction shaded
    e_mod: np.ndarray        # (hours, modules) module power fraction lost to shading (electrical)
    sky_loss: np.ndarray     # (modules,) diffuse fraction lost
    far_block: np.ndarray    # (hours,) beam blocked by the horizon


def electrical_rule(f: np.ndarray, orientation: str, half_cell: bool, n_diodes: int) -> np.ndarray:
    f = np.where(f < MIN_FRACTION, 0.0, f)
    if orientation == "portrait":
        if half_cell:
            return np.ceil(f * 2.0 - 1e-9) / 2.0
        return (f > 0).astype(float)
    n = max(1, n_diodes)
    return np.ceil(f * n - 1e-9) / n


def row_fraction(layout: Layout, elev: np.ndarray, az: np.ndarray) -> np.ndarray:
    """(hours, modules) beam fraction shaded by the row or unit in front."""
    mods = layout.modules
    n_h, n_m = len(elev), len(mods)
    out = np.zeros((n_h, n_m), dtype=np.float32)
    idx = [m.idx for m in mods if m.front is not None]
    if not idx:
        return out
    sel = np.array(idx)
    H = np.array([mods[i].front[0] for i in idx])
    D = np.array([mods[i].front[1] for i in idx])
    beta = np.radians([mods[i].tilt for i in idx])
    gam = np.array([mods[i].azimuth for i in idx])
    u0 = np.array([mods[i].span[0] for i in idx])
    u1 = np.array([mods[i].span[1] for i in idx])
    L = np.array([mods[i].slope_len for i in idx])
    el = np.radians(np.clip(elev, 0.0, 90.0))[:, None]
    rel = np.radians(az[:, None] - gam[None, :])
    cosrel = np.cos(rel)
    with np.errstate(divide="ignore", invalid="ignore"):
        tanpsi = np.where(cosrel > 1e-6, np.tan(el) / cosrel, np.inf)
        ustar = (H - D * tanpsi) / (np.sin(beta) + np.cos(beta) * tanpsi)
    ustar = np.clip(np.nan_to_num(ustar, nan=0.0, neginf=0.0, posinf=0.0), 0.0, L)
    frac = np.clip((ustar - u0) / (u1 - u0), 0.0, 1.0)
    frac = np.where((elev[:, None] > 0) & (cosrel > 1e-6), frac, 0.0)
    out[:, sel] = frac
    return out


def object_fraction(layout: Layout, roof: Roof, elev: np.ndarray, az: np.ndarray) -> np.ndarray:
    mods = layout.modules
    n_h, n_m = len(elev), len(mods)
    out = np.zeros((n_h, n_m), dtype=np.float32)
    casters = roof.all_casters()
    if not casters or not n_m:
        return out
    polys = np.array([m.poly for m in mods], dtype=object)
    areas = shapely.area(polys)
    tree = shapely.STRtree(polys)
    zkey = np.round(np.array([m.z_mid for m in mods]) / 0.05) * 0.05
    zgroups = {z: np.where(zkey == z)[0] for z in np.unique(zkey)}
    day = elev > 0
    eb = np.round(elev / EL_BIN).astype(int)
    ab = np.round(az / AZ_BIN).astype(int)
    cache: dict[tuple[int, int], np.ndarray] = {}
    for h in np.where(day)[0]:
        key = (eb[h], ab[h])
        row = cache.get(key)
        if row is None:
            row = np.zeros(n_m, dtype=np.float32)
            el_c, az_c = max(key[0] * EL_BIN, 0.5), key[1] * AZ_BIN
            for z, members in zgroups.items():
                sh = casters_shadow(casters, float(z), el_c, az_c)
                if sh is None or sh.is_empty:
                    continue
                cand = tree.query(sh)
                cand = np.intersect1d(cand, members, assume_unique=False)
                if len(cand):
                    inter = shapely.area(shapely.intersection(polys[cand], sh))
                    row[cand] = inter / areas[cand]
            cache[key] = row
        out[h] = row
    return out


def compute(layout: Layout, roof: Roof, module: Module, orientation: str,
            elev: np.ndarray, az: np.ndarray, horizon: list[tuple[float, float]] | None = None) -> ShadingResult:
    elev = np.asarray(elev, dtype=float)
    az = np.asarray(az, dtype=float)
    f_row = row_fraction(layout, elev, az)
    f_obj = object_fraction(layout, roof, elev, az)
    f_lin = 1.0 - (1.0 - f_row) * (1.0 - f_obj)
    e_row = electrical_rule(f_row, orientation, module.half_cell, module.n_diodes)
    e_obj = electrical_rule(f_obj, orientation, module.half_cell, module.n_diodes)
    e_mod = (1.0 - (1.0 - e_row) * (1.0 - e_obj)).astype(np.float32)
    e_mod = np.maximum(e_mod, f_lin)  # electrical never less than the geometric loss

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
    return ShadingResult(f_lin.astype(np.float32), e_mod, sky.astype(np.float32), far)


def annual_string_shade(sh: ShadingResult, beam: np.ndarray, strings: list[list[int]]) -> np.ndarray:
    """Beam-weighted annual shaded fraction per string (used to keep the least shaded)."""
    w = np.asarray(beam, dtype=float)
    tot = max(w.sum(), 1e-9)
    out = np.zeros(len(strings))
    for k, s in enumerate(strings):
        out[k] = float((sh.e_mod[:, s].max(axis=1) * w).sum() / tot)
    return out


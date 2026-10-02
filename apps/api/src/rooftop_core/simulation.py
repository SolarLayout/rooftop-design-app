# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""8,760-hour energy simulation with the loss chain from the sky to the grid.

The order follows PVsyst's loss diagram: transposition, far shading, near
shading (linear), IAM, soiling, bifacial rear gain, then array losses
(irradiance level, temperature, electrical shading, quality, LID, mismatch, DC
ohmic), the inverter (efficiency curves, threshold, clipping, night use), AC
ohmic and availability.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace

import numpy as np
import pandas as pd
import pvlib
from pvlib.bifacial import infinite_sheds
from scipy.stats import norm

from .geometry import Roof
from .io.pvsyst import Inverter, Module
from .onediode import ModuleModel
from .placement import Layout
from .shading import ShadingResult
from .stringing import System
from .weather import Weather

UC_BY_ROOF = {"flat_tilted": 29.0, "flat_ew": 20.0, "sloped_flush": 15.0}   # decision 16
DEFAULT_LID_PCT = 1.5


@dataclass
class Losses:
    soiling_pct: float = 2.0
    lid_pct: float | None = None          # None: the PAN value, else 1.5 % (decision F4)
    quality_pct: float = 0.0
    mismatch_pct: float = 1.0
    dc_ohmic_pct: float = 1.5             # at STC
    ac_ohmic_pct: float = 1.0             # at nominal AC power
    availability_pct: float = 99.5
    degradation_pct: float = 0.5
    uc: float | None = None               # None: by roof type
    uv: float = 0.0
    iam_b0: float = 0.05                  # used when the PAN has no IAM profile
    bifacial: bool = True
    rear_loss_pct: float = 10.0           # rear structure shading + rear mismatch
    weather_sigma_pct: float = 3.0        # decision O4
    model_sigma_pct: float = 3.0
    p_levels: tuple[int, ...] = (50, 75, 90)
    co2_t_per_mwh: float = 0.716          # decision O5

    def lid(self, m: Module) -> float:
        if self.lid_pct is not None:
            return self.lid_pct
        return m.lid_loss_pct if m.lid_loss_pct is not None else DEFAULT_LID_PCT


@dataclass
class Precomputed:
    """Everything that depends on the layout and weather but not on stringing."""
    weather: Weather
    elev: np.ndarray
    azimuth: np.ndarray
    groups: dict[tuple[float, float], dict[str, np.ndarray]]
    group_of: np.ndarray                  # per layout module
    shading: ShadingResult


def iam_factor(module: Module, aoi: np.ndarray, b0: float) -> np.ndarray:
    aoi = np.clip(np.nan_to_num(aoi, nan=90.0), 0, 90)
    if module.iam_profile and len(module.iam_profile) >= 3:
        a, v = zip(*module.iam_profile, strict=False)
        return np.interp(aoi, a, v)
    return np.clip(pvlib.iam.ashrae(aoi, b0), 0, 1)


def precompute(weather: Weather, layout: Layout, roof: Roof, module: Module, orientation: str,
               losses: Losses, shading: ShadingResult | None = None) -> Precomputed:
    from . import shading as shading_mod
    from .weather import solar_position

    d = weather.data
    sp = solar_position(weather)
    zen = sp["apparent_zenith"].to_numpy()
    elev = sp["apparent_elevation"].to_numpy()
    az = sp["azimuth"].to_numpy()
    dni, ghi, dhi = d["dni"].to_numpy(), d["ghi"].to_numpy(), d["dhi"].to_numpy()
    dni_extra = pvlib.irradiance.get_extra_radiation(d.index).to_numpy()
    am = pvlib.atmosphere.get_relative_airmass(zen)
    if shading is None:
        shading = shading_mod.compute(layout, roof, module, orientation, elev, az, weather.horizon)

    keys = sorted({(round(m.tilt, 3), round(m.azimuth, 3)) for m in layout.modules})
    groups = {}
    for tilt, gaz in keys:
        c = pvlib.irradiance.get_total_irradiance(
            tilt, gaz, zen, az, dni, ghi, dhi, dni_extra=dni_extra, airmass=am, albedo=roof.albedo,
            model="perez")
        aoi = pvlib.irradiance.aoi(tilt, gaz, zen, az)
        beam = np.nan_to_num(np.asarray(c["poa_direct"], dtype=float))
        sky = np.nan_to_num(np.asarray(c["poa_sky_diffuse"], dtype=float))
        gnd = np.nan_to_num(np.asarray(c["poa_ground_diffuse"], dtype=float))
        rear = np.zeros_like(ghi)
        if losses.bifacial and module.is_bifacial and layout.kind != "sloped_flush" and 0 < layout.gcr < 1:
            height = layout.modules[0].z_low + 0.5 * layout.slope_len * np.sin(np.radians(tilt))
            r = infinite_sheds.get_irradiance(
                tilt, gaz, zen, az, layout.gcr, height, layout.pitch, ghi, dhi, dni, roof.albedo,
                model="isotropic", bifaciality=1.0)
            rear = np.nan_to_num(np.asarray(r["poa_back"], dtype=float))
        groups[(tilt, gaz)] = {
            "beam": beam, "sky": sky, "gnd": gnd, "rear": rear,
            "iam_b": iam_factor(module, aoi, losses.iam_b0),
            "iam_d": float(iam_factor(module, np.array([59.7 - 0.1388 * tilt + 0.001497 * tilt ** 2]), losses.iam_b0)[0]),
            "iam_g": float(iam_factor(module, np.array([90 - 0.5788 * tilt + 0.002693 * tilt ** 2]), losses.iam_b0)[0]),
        }
    idx = {k: i for i, k in enumerate(keys)}
    group_of = np.array([idx[(round(m.tilt, 3), round(m.azimuth, 3))] for m in layout.modules])
    return Precomputed(weather, elev, az, groups, group_of, shading)


def _inverter_out(inv: Inverter, p_in: np.ndarray, v: np.ndarray) -> np.ndarray:
    """AC output (W) of one inverter from its OND efficiency curves, before clipping."""
    if not inv.curves:
        eta = (inv.effic_euro_pct or 97.0) / 100.0
        return p_in * eta
    vs = sorted(inv.curves)
    etas = []
    for vc in vs:
        pin, pout = np.array(inv.curves[vc]).T
        eff = np.divide(pout, pin, out=np.zeros_like(pout), where=pin > 0)
        eta = np.interp(p_in, pin, eff, left=0.0, right=eff[-1])
        etas.append(eta)
    etas = np.array(etas)
    if len(vs) == 1:
        return p_in * etas[0]
    vgrid = np.array(vs)
    vc = np.clip(v, vgrid[0], vgrid[-1])
    j = np.clip(np.searchsorted(vgrid, vc) - 1, 0, len(vgrid) - 2)
    t = (vc - vgrid[j]) / (vgrid[j + 1] - vgrid[j])
    cols = np.arange(len(p_in))
    eta = etas[j, cols] * (1 - t) + etas[j + 1, cols] * t
    return p_in * eta


@dataclass
class LossStep:
    label: str
    value: float          # kWh/m² for irradiance steps, MWh for energy steps
    kind: str             # "irr_total", "irr", "energy_total", "energy", "result"
    pct: float = 0.0      # change against the previous value


@dataclass
class SimResult:
    energy_mwh: float
    dc_kwp: float
    ac_kw: float
    pr: float
    specific_yield: float
    cuf_ac_pct: float
    cuf_dc_pct: float
    poa_kwh_m2: float
    ghi_kwh_m2: float
    steps: list[LossStep]
    monthly_mwh: list[float]
    p_values: dict[int, float]
    years: list[float]
    co2_t: float
    hourly: pd.DataFrame
    per_string_shade: np.ndarray = field(default_factory=lambda: np.zeros(0))
    clipping_pct: float = 0.0
    sigma_pct: float = 0.0
    lid_pct: float = 0.0


def simulate(pre: Precomputed, layout: Layout, module: Module, mm: ModuleModel, inv: Inverter,
             system: System, losses: Losses, roof: Roof) -> SimResult:
    w = pre.weather.data
    n_h = len(w)
    sh = pre.shading
    N = system.n_series
    strings = [s.modules for s in system.strings]
    used = np.array([i for s in strings for i in s], dtype=int)
    soil = 1.0 - losses.soiling_pct / 100.0
    rear_k = module.bifaciality * (1.0 - losses.rear_loss_pct / 100.0)

    # Irradiance per used module (hours × modules), plus the chain totals.
    sums = dict.fromkeys(("nom", "far", "lin", "iam", "soil", "eff"), 0.0)
    g_eff = np.zeros((n_h, len(used)), dtype=np.float32)
    beam_pre = np.zeros((n_h, len(used)), dtype=np.float32)   # after far + IAM + soiling, before near shading
    far_ok = ~sh.far_block
    for gi, key in enumerate(pre.groups):
        g = pre.groups[key]
        cols = np.where(pre.group_of[used] == gi)[0]
        if not len(cols):
            continue
        m_idx = used[cols]
        beam, sky, gnd = g["beam"][:, None], g["sky"][:, None], g["gnd"][:, None]
        f = sh.f_lin[:, m_idx]
        sk = sh.sky_loss[m_idx][None, :]
        k = len(cols)
        nom = beam + sky + gnd
        beam_far = beam * far_ok[:, None]
        sums["nom"] += float(np.broadcast_to(nom, (n_h, k)).sum())
        sums["far"] += float(np.broadcast_to(beam_far + sky + gnd, (n_h, k)).sum())
        b_lin = beam_far * (1 - f)
        d_lin = (sky + gnd) * (1 - sk)
        sums["lin"] += float((b_lin + d_lin).sum())
        b_iam = b_lin * g["iam_b"][:, None]
        d_iam = sky * (1 - sk) * g["iam_d"] + gnd * (1 - sk) * g["iam_g"]
        sums["iam"] += float((b_iam + d_iam).sum())
        front = (b_iam + d_iam) * soil
        sums["soil"] += float(front.sum())
        tot = front + g["rear"][:, None] * rear_k
        sums["eff"] += float(tot.sum())
        g_eff[:, cols] = tot
        beam_pre[:, cols] = beam_far * g["iam_b"][:, None] * soil

    n_used = max(len(used), 1)
    irr = {k: v / n_used / 1000.0 for k, v in sums.items()}   # kWh/m² per module

    # Per string.
    pos = {m: j for j, m in enumerate(used)}
    n_s = len(strings)
    G = np.zeros((n_h, n_s))
    B = np.zeros((n_h, n_s))
    F = np.zeros((n_h, n_s))
    E = np.zeros((n_h, n_s))
    for s, mods in enumerate(strings):
        cols = [pos[m] for m in mods]
        G[:, s] = g_eff[:, cols].mean(axis=1)
        B[:, s] = beam_pre[:, cols].mean(axis=1)
        F[:, s] = sh.f_lin[:, mods].mean(axis=1)
        E[:, s] = sh.e_mod[:, mods].max(axis=1)    # the weakest module sets the string current
    ta = w["temp_air"].to_numpy()[:, None]
    ws = w["wind_speed"].to_numpy()[:, None]
    uc = losses.uc or UC_BY_ROOF.get(roof.roof_type, 29.0)
    tc = pvlib.temperature.pvsyst_cell(G, ta, ws, u_c=uc, u_v=losses.uv, module_efficiency=module.efficiency)
    pnom_s = N * module.pnom_w
    flat_g, flat_t = G.ravel(), tc.ravel()
    p25, _, _ = mm.mpp(flat_g, np.full_like(flat_g, 25.0))
    pT, vT, _ = mm.mpp(flat_g, flat_t)
    p25 = p25.reshape(G.shape) * N
    pT = pT.reshape(G.shape) * N
    vT = vT.reshape(G.shape) * N
    e_nom = G / 1000.0 * pnom_s
    with np.errstate(divide="ignore", invalid="ignore"):
        extra = np.clip((E - F) * np.divide(B, G, out=np.zeros_like(G), where=G > 1), 0.0, 1.0)
    p_elec = pT * (1 - extra)
    p_q = p_elec * (1 - losses.quality_pct / 100.0)
    lid = losses.lid(module)
    p_lid = p_q * (1 - lid / 100.0)
    p_mis = p_lid * (1 - losses.mismatch_pct / 100.0)
    p_dc = p_mis * (1 - losses.dc_ohmic_pct / 100.0 * np.clip(p_mis / pnom_s, 0, 2))

    # Inverters.
    inv_of = np.array(system.inverter_of)
    pnom_ac = inv.pnom_kw * 1000.0
    p_in_all = np.zeros(n_h)
    p_eff_all = np.zeros(n_h)
    p_clip_all = np.zeros(n_h)
    night_all = np.zeros(n_h)
    for i in range(system.n_inverters):
        sel = inv_of == i
        p_in = p_dc[:, sel].sum(axis=1)
        v = np.where(p_dc[:, sel].sum(axis=1) > 0,
                     (vT[:, sel] * p_dc[:, sel]).sum(axis=1) / np.maximum(p_dc[:, sel].sum(axis=1), 1e-9), 0)
        out = _inverter_out(inv, p_in, v)
        out = np.where(p_in < inv.pseuil_w, 0.0, out)
        clip = np.minimum(out, pnom_ac)
        night = np.where(p_in <= 0, inv.night_loss_w, 0.0)
        p_in_all += p_in
        p_eff_all += out
        p_clip_all += clip
        night_all += night
    p_night = p_clip_all - night_all
    p_ac = p_night * (1 - losses.ac_ohmic_pct / 100.0 * np.clip(p_night / (pnom_ac * system.n_inverters), 0, 2))
    p_grid = p_ac * losses.availability_pct / 100.0

    def mwh(x):
        return float(np.sum(x)) / 1e6

    dc_kwp = system.n_modules * module.pnom_w / 1000.0
    ac_kw = inv.pnom_kw * system.n_inverters
    e_grid = mwh(p_grid)
    ghi = float(w["ghi"].sum()) / 1000.0
    steps_raw = [
        ("Global horizontal irradiation", ghi, "irr_total"),
        (f"Transposition to plane ({layout.tilt:g}°)", irr["nom"], "irr"),
        ("Far shading, horizon", irr["far"], "irr"),
        ("Near shading, linear", irr["lin"], "irr"),
        ("IAM", irr["iam"], "irr"),
        ("Soiling", irr["soil"], "irr"),
        ("Bifacial rear gain", irr["eff"], "irr"),
        ("Array nominal energy at STC", mwh(e_nom), "energy_total"),
        ("Irradiance level", mwh(p25), "energy"),
        ("Temperature", mwh(pT), "energy"),
        ("Electrical shading", mwh(p_elec), "energy"),
        ("Module quality", mwh(p_q), "energy"),
        (f"LID{' (PAN)' if losses.lid_pct is None and module.lid_loss_pct is not None else ''}", mwh(p_lid), "energy"),
        ("Mismatch", mwh(p_mis), "energy"),
        ("DC ohmic", mwh(p_dc), "energy"),
        ("Inverter efficiency", mwh(p_eff_all), "energy"),
        ("Inverter clipping", mwh(p_clip_all), "energy"),
        ("Night consumption", mwh(p_night), "energy"),
        ("AC ohmic", mwh(p_ac), "energy"),
        ("Availability", mwh(p_grid), "energy"),
    ]
    steps: list[LossStep] = []
    prev = None
    for label, val, kind in steps_raw:
        pct = 0.0 if prev in (None, 0) or kind.endswith("_total") else (val / prev - 1) * 100.0
        steps.append(LossStep(label, val, kind, pct))
        prev = val
    steps.append(LossStep("Energy to grid", e_grid, "result"))

    poa = irr["nom"]
    pr = e_grid * 1000.0 / (dc_kwp * poa) if dc_kwp and poa else 0.0
    monthly = pd.Series(p_grid, index=w.index).groupby(w.index.month).sum().reindex(range(1, 13), fill_value=0)
    hourly = pd.DataFrame({
        "ghi_w_m2": w["ghi"].to_numpy(),
        "poa_eff_w_m2": G.mean(axis=1) if n_s else 0.0,
        "t_cell_c": tc.mean(axis=1) if n_s else 0.0,
        "p_dc_kw": p_in_all / 1000.0,
        "p_ac_kw": p_grid / 1000.0,
    }, index=w.index)
    per_string = (E * B).sum(axis=0) / np.maximum(B.sum(axis=0), 1e-9) if n_s else np.zeros(0)
    clip_pct = (1 - mwh(p_clip_all) / mwh(p_eff_all)) * 100 if mwh(p_eff_all) else 0.0
    of_the_year = SimResult(
        energy_mwh=e_grid, dc_kwp=dc_kwp, ac_kw=ac_kw, pr=pr,
        specific_yield=e_grid * 1000.0 / dc_kwp if dc_kwp else 0.0,
        cuf_ac_pct=e_grid * 1000.0 / (ac_kw * 8760) * 100 if ac_kw else 0.0,
        cuf_dc_pct=e_grid * 1000.0 / (dc_kwp * 8760) * 100 if dc_kwp else 0.0,
        poa_kwh_m2=poa, ghi_kwh_m2=ghi, steps=steps, monthly_mwh=[float(v) / 1e6 for v in monthly],
        p_values={}, years=[], co2_t=0.0, hourly=hourly,   # filled by after_the_year
        per_string_shade=per_string, clipping_pct=clip_pct, lid_pct=lid)
    return after_the_year(of_the_year, losses)


def after_the_year(result: SimResult, losses: Losses) -> SimResult:
    """The result with the figures that follow from the year's energy worked out for *losses*: the
    uncertainty, the exceedance values, the 25 years and the CO2.

    None of them touches an hour, so a result kept from a simulation with other values of these losses
    answers for the new ones (the memo leaves them out of its key, decision 5 of Phase 8). *result* is
    left as it is.
    """
    e_grid = result.energy_mwh
    sigma = float(np.hypot(losses.weather_sigma_pct, losses.model_sigma_pct)) / 100.0
    pvals = {p: e_grid * (1 - norm.ppf(p / 100.0) * sigma) for p in losses.p_levels}
    deg = losses.degradation_pct / 100.0
    years = [e_grid * (1 - deg) ** (n - 1) for n in range(1, 26)]
    return replace(result, p_values=pvals, years=years, co2_t=e_grid * losses.co2_t_per_mwh, sigma_pct=sigma * 100)

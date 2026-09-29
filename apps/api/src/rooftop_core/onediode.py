# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""PVsyst one-diode module model.

The reference photocurrent and saturation current are fitted so the model
reproduces the PAN file's Isc and Voc at STC with its Rs, Rsh, Gamma. Everything
else (power at any irradiance and temperature, Voc / Vmp temperature
coefficients) then follows from pvlib's implementation of the PVsyst equations.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from pvlib import pvsystem

from .io.pvsyst import Module

K_B = 1.380649e-23
Q_E = 1.602176634e-19
EG_REF = 1.121  # eV, crystalline silicon

#: A derived Voc coefficient outside this band gets a warning (decision O1).
MU_VOC_PLAUSIBLE_PCT = (-0.35, -0.20)


@dataclass
class Coefficients:
    mu_voc_mv: float        # mV/°C
    mu_voc_pct: float       # %/°C
    mu_vmp_pct: float       # %/°C
    mu_pmpp_pct: float      # %/°C
    derived: bool           # True when computed from the one-diode model
    warning: str = ""


class ModuleModel:
    def __init__(self, module: Module):
        self.m = module
        self.ns = module.n_cells_series
        self.alpha_sc = module.mu_isc_ma / 1000.0
        self.gamma = module.gamma or 1.0
        rs, rsh = module.r_series, module.r_shunt or 1e4
        a = self.gamma * self.ns * K_B * 298.15 / Q_E
        isc, voc = module.isc, module.voc
        self.i_o_ref = (isc * (1 + rs / rsh) - voc / rsh) / (math.exp(voc / a) - math.exp(isc * rs / a))
        self.i_l_ref = self.i_o_ref * (math.exp(voc / a) - 1) + voc / rsh

    def params(self, g, t):
        g = np.maximum(np.atleast_1d(np.asarray(g, dtype=float)), 1e-3)
        t = np.broadcast_to(np.atleast_1d(np.asarray(t, dtype=float)), g.shape)
        return pvsystem.calcparams_pvsyst(
            g, t, self.alpha_sc, self.gamma, self.m.mu_gamma,
            self.i_l_ref, self.i_o_ref, self.m.r_shunt, self.m.r_shunt_0, self.m.r_series,
            self.ns, R_sh_exp=self.m.r_shunt_exp, EgRef=EG_REF,
        )

    def mpp(self, g, t):
        """(p_mp W, v_mp V, i_mp A) per module; zero where g is (nearly) zero."""
        g = np.atleast_1d(np.asarray(g, dtype=float))
        il, io, rs, rsh, nnsvth = self.params(g, t)
        out = pvsystem.max_power_point(il, io, rs, rsh, nnsvth, method="newton")
        dark = g < 1.0
        p = np.where(dark, 0.0, np.asarray(out["p_mp"], dtype=float))
        v = np.where(dark, 0.0, np.asarray(out["v_mp"], dtype=float))
        i = np.where(dark, 0.0, np.asarray(out["i_mp"], dtype=float))
        return p, v, i

    def voc(self, g, t):
        il, io, rs, rsh, nnsvth = self.params(g, t)
        return np.asarray(pvsystem.singlediode(il, io, rs, rsh, nnsvth)["v_oc"], dtype=float)

    def coefficients(self) -> Coefficients:
        m = self.m
        (p0, p50, p25), (v0, v50, v25), _ = self.mpp([1000.0] * 3, [0.0, 50.0, 25.0])
        voc0, voc50 = self.voc([1000.0] * 2, [0.0, 50.0])
        mu_voc_mv = (voc50 - voc0) / 50.0 * 1000.0
        mu_vmp = (v50 - v0) / 50.0 / v25 * 100.0
        mu_p = (p50 - p0) / 50.0 / p25 * 100.0
        derived = True
        if m.mu_voc_mv:
            mu_voc_mv, derived = m.mu_voc_mv, False
        if m.mu_pmpp_pct:
            mu_p = m.mu_pmpp_pct
        pct = mu_voc_mv / 1000.0 / m.voc * 100.0
        warn = ""
        lo, hi = MU_VOC_PLAUSIBLE_PCT
        if not lo <= pct <= hi:
            warn = (f"Voc coefficient {pct:.3f} %/°C is outside the usual {lo:.2f} to {hi:.2f} %/°C "
                    "for crystalline silicon. Check the datasheet and enter it if it differs.")
        return Coefficients(float(mu_voc_mv), float(pct), float(mu_vmp), float(mu_p), derived, warn)

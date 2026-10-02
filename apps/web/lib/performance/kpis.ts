// The KPIs of Performance (the board "Performance"; plan/phase-08-plan.md, decision 3): the lead tile of the energy
// with the exceedance values at the document's levels, and the six tiles, every figure the chosen option's,
// formatted by the guidelines. Pure.
import type { DesignOption } from "../api";
import { capacityFactor, capacityFactorDc, co2Avoided, energy, energyOverYears, exceedance, irradiation, performanceRatio, sigma, specificYield } from "../format/performance";
import type { Quantity } from "../format/vitals";

export type KpiId = "pr" | "yield" | "capacity-factor" | "in-plane" | "25-years" | "co2";

export type Kpi = {
  id: KpiId;
  label: string;
  quantity: Quantity;
  /** What follows the unit: the DC side of the capacity factor. On phone it takes a line of its own. */
  more?: string;
};

/** One exceedance value: "P90 · σ 4.24 %" over "584.2"; the unit is the lead's. */
export type PCell = { label: string; value: string };

export type KpisView = {
  lead: { label: string; quantity: Quantity };
  pValues: PCell[];
  tiles: Kpi[];
};

export function kpisOf({ energy: figures }: DesignOption): KpisView {
  const last = figures.p_values.length - 1;
  return {
    lead: { label: "Energy to grid, year 1", quantity: energy(figures.energy_mwh) },
    pValues: figures.p_values.map(({ level, mwh }, index) => ({
      label: index === last ? `P${level} · ${sigma(figures.sigma_pct)}` : `P${level}`,
      value: exceedance(mwh),
    })),
    tiles: [
      { id: "pr", label: "Performance ratio", quantity: performanceRatio(figures.pr) },
      { id: "yield", label: "Specific yield", quantity: specificYield(figures.specific_yield) },
      { id: "capacity-factor", label: "Capacity factor, AC", quantity: capacityFactor(figures.cuf_ac_pct), more: capacityFactorDc(figures.cuf_dc_pct) },
      { id: "in-plane", label: "In-plane irradiation", quantity: irradiation(figures.poa_kwh_m2) },
      { id: "25-years", label: "Energy over 25 years", quantity: energyOverYears(figures.total_25_years_mwh) },
      { id: "co2", label: "CO₂ avoided", quantity: co2Avoided(figures.co2_t) },
    ],
  };
}

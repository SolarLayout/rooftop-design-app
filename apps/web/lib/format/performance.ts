// The quantities of Performance, as they are shown: each a number and its unit
// (docs/design/guidelines.md, "Numbers and units"; the board "Performance").
import { shown } from "../../components/ui/number-entry";
import type { Quantity } from "./vitals";

export { energy, performanceRatio, specificYield } from "./vitals";

/** The energy of one exceedance level, as a figure alone: its unit is the lead tile's. */
export const exceedance = (mwh: number): string => shown(mwh, 1);
/** The uncertainty of the year's energy, as the engine gives it in percent: "σ 4.24 %". */
export const sigma = (pct: number): string => `σ ${shown(pct, 2)} %`;
/** The capacity factor on the AC side; the DC side's goes after it in the tile. */
export const capacityFactor = (pct: number): Quantity => ({ number: shown(pct, 1), unit: "%" });
export const capacityFactorDc = (pct: number): string => `${shown(pct, 1)} % DC`;
/** Irradiation over the year, whole kWh/m². */
export const irradiation = (kwhPerM2: number): Quantity => ({ number: shown(kwhPerM2, 0), unit: "kWh/m²" });
/** Energy over the years, whole MWh. */
export const energyOverYears = (mwh: number): Quantity => ({ number: shown(mwh, 0), unit: "MWh" });
export const co2Avoided = (tonnesPerYear: number): Quantity => ({ number: shown(tonnesPerYear, 1), unit: "t/yr" });

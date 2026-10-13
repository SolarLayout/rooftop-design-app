// The lead and the four figures of Performance (V2 · 8, D104; audit V2-88, V2-89): the energy to the grid in year 1 with
// Likely (the P50) and Conservative (the highest level the document asks for, and what it means in years), then System
// size, the DC/AC ratio (the owner, 2026-10-13: an important KPI, second), Yield and Performance ratio, each with a few words. Every figure the chosen option's, formatted by the
// guidelines. Pure.
import type { DesignOption } from "../api";
import { acCapacity, dcAcRatio, dcCapacity, energy, performanceRatio, specificYield } from "../format/vitals";
import type { Quantity } from "../format/vitals";

export type FigureId = "size" | "yield" | "pr" | "dcac";

export type Figure = { id: FigureId; label: string; quantity: Quantity; words: string };

export type Conservative = { label: string; value: string; meaning: string };

export type Lead = {
  label: string;
  quantity: Quantity;
  /** The P50: "617.8 MWh". */
  likely: string;
  /** The highest level above the P50; null where the document asks for the P50 alone. */
  conservative: Conservative | null;
};

export type KpisView = { lead: Lead; figures: Figure[] };

const LIKELY_LEVEL = 50;

/** The engine's target of the DC/AC ratio (rooftop_core/stringing.py, DCAC_TARGET), as the options are made to it. */
export const DCAC_TARGET = [1.1, 1.3] as const;
const TARGET_WORDS = `${dcAcRatio(DCAC_TARGET[0]).number} to ${dcAcRatio(DCAC_TARGET[1]).number}`;

/** Where the DC/AC ratio stands against the target, in a few words. */
function againstTheTarget(dcac: number): string {
  if (dcac < DCAC_TARGET[0]) return `Under the target, ${TARGET_WORDS}`;
  if (dcac > DCAC_TARGET[1]) return `Over the target, ${TARGET_WORDS}`;
  return `Within the target, ${TARGET_WORDS}`;
}

const said = ({ number, unit }: Quantity) => (unit ? `${number} ${unit}` : number);

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** A level said in years: P90 is "9 years in 10 at least". */
export function yearsInOf(level: number): string {
  const common = gcd(level, 100);
  return `${level / common} years in ${100 / common} at least`;
}

export function kpisOf({ energy: figures, dc_kwp, dcac }: DesignOption): KpisView {
  const highest = figures.p_values.filter(({ level }) => level > LIKELY_LEVEL).at(-1) ?? null;
  return {
    lead: {
      label: "Energy to the grid in year 1",
      quantity: energy(figures.energy_mwh),
      likely: said(energy(figures.energy_mwh)),
      conservative: highest ? { label: `Conservative (P${highest.level})`, value: said(energy(highest.mwh)), meaning: yearsInOf(highest.level) } : null,
    },
    figures: [
      { id: "size", label: "System size", quantity: dcCapacity(dc_kwp), words: `${said(acCapacity(figures.ac_kw))} of inverter` },
      { id: "dcac", label: "DC/AC ratio", quantity: dcAcRatio(dcac), words: againstTheTarget(dcac) },
      { id: "yield", label: "Yield", quantity: specificYield(figures.specific_yield), words: "A year, for each kWp" },
      { id: "pr", label: "Performance ratio (PR)", quantity: performanceRatio(figures.pr), words: "Of its rated output, in this sunlight" },
    ],
  };
}

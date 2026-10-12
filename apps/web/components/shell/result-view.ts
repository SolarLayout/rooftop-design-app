// The result chip at the top bar's right and the summary it opens (D95; the board "V2 · 2 · The progression"): the energy
// of year 1 as one figure, how many notes wait beside it; pressed, seven figures in plain names. Made of what the vitals
// knew (`vitals-view.ts`); a pure function, the component draws what it gives. The chip's six states are V2 · 5's.
import type { VitalId, VitalsView } from "./vitals-view";

export type ResultChip =
  | { kind: "result"; figure: string; words: string; toReview: number; isDimmed: boolean }
  | { kind: "computing"; words: string }
  | { kind: "problem"; words: string };

export type SummaryRow = { id: VitalId; name: string; value: string };

const ENERGY_WORDS = "MWh a year";

export function resultChipOf(view: VitalsView): ResultChip {
  const energy = view.cells.find((cell) => cell.id === "energy");
  if (energy) return { kind: "result", figure: energy.quantity.number, words: ENERGY_WORDS, toReview: view.last.kind === "notes" ? view.last.count : 0, isDimmed: view.isDimmed };
  if (view.last.kind === "failed" || view.last.kind === "decision") return { kind: "problem", words: view.last.title };
  return { kind: "computing", words: "Computing the energy" };
}

const NAMES: Partial<Record<VitalId, string>> = {
  energy: "Energy in year 1",
  modules: "Modules",
  dc: "DC capacity",
  ac: "AC capacity",
  dcac: "DC/AC ratio",
  pr: "Performance ratio (PR)",
  yield: "Yield",
};
const ORDER: readonly VitalId[] = ["energy", "modules", "dc", "ac", "dcac", "pr", "yield"];

/** The seven figures of a design in plain names; none before there is one. */
export function summaryOf(view: VitalsView): SummaryRow[] {
  if (view.kind !== "design") return [];
  return ORDER.flatMap((id) => {
    const cell = view.cells.find((one) => one.id === id);
    if (!cell) return [];
    const { number, unit } = cell.quantity;
    return [{ id, name: NAMES[id] ?? cell.label, value: unit ? `${number} ${unit}` : number }];
  });
}

/** Beside the result in the row under the stage on tablet (V2 · 3): the modules used and the DC capacity; none before a design. */
export function capacityOf(view: VitalsView): string | null {
  const modules = view.cells.find((cell) => cell.id === "modules")?.quantity;
  const dc = view.cells.find((cell) => cell.id === "dc")?.quantity;
  return view.kind === "design" && modules && dc ? `${modules.number} modules · ${dc.number} ${dc.unit}` : null;
}

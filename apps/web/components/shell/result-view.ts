// The result chip at the top bar's right and the summary it opens (D95; the board "V2 · 2 · The progression"): the energy
// of year 1 as one figure, how many notes wait beside it; pressed, seven figures in plain names. Made of what the vitals
// knew (`vitals-view.ts`); a pure function, the component draws what it gives. The chip's six states are V2 · 5's.
import { problemOfNoOptions, type Problem } from "../../lib/errors/problem-of";
import { LENSES } from "../../lib/routes";
import { SHOWING_THE_LAST_RESULT, type VitalId, type VitalsView } from "./vitals-view";

/** The chip's states: computing; the result; updating (the result, dimmed, with the ring); to review (the result with a count); failed, nothing before; stale, the last result dimmed. */
export type ResultChip =
  | { kind: "result"; figure: string; words: string; toReview: number; isDimmed: boolean }
  | { kind: "computing"; words: string }
  /** Nothing to show: pressed, the problem with its remedy. */
  | { kind: "failed"; words: string; problem: Problem }
  /** The last result stays, dimmed and marked; pressed, the problem with Try again. */
  | { kind: "stale"; figure: string; words: string; problem: Problem };

export type SummaryRow = { id: VitalId; name: string; value: string };

const ENERGY_WORDS = "MWh a year";

const stepNameOf = (path: string) => LENSES.find((lens) => path.endsWith(`/${lens.id}`))?.name ?? "the step";

export function resultChipOf(view: VitalsView): ResultChip {
  const energy = view.cells.find((cell) => cell.id === "energy");
  const { last } = view;
  if (energy && last.kind === "failed") return { kind: "stale", figure: energy.quantity.number, words: SHOWING_THE_LAST_RESULT, problem: last.problem };
  if (energy) return { kind: "result", figure: energy.quantity.number, words: ENERGY_WORDS, toReview: last.kind === "notes" ? last.count : 0, isDimmed: view.isDimmed };
  if (last.kind === "failed") return { kind: "failed", words: last.title, problem: last.problem };
  if (last.kind === "decision") {
    const problem = problemOfNoOptions({ message: last.detail, path: last.path, stepName: stepNameOf(last.path) });
    return { kind: "failed", words: problem.title, problem };
  }
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

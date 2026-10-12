// The status of the Roof step after Build this roof (V2 · 3, D97; the board "The Studio's first open"): what happened
// (the array is on the roof), the energy on its way, then the energy and what it follows. Said on a design's first open
// alone, until the user continues to another step. Made of what the vitals know; the component draws what it gives.
import type { Step } from "@/lib/flow/steps";
import type { VitalId, VitalsView } from "@/components/shell/vitals-view";

export type StatusLine = { mark: "done" | "working"; title: string; detail: string };

export const COMPUTING: StatusLine = { mark: "working", title: "Computing the energy", detail: "Shading every module over the year. A few seconds." };
const FOLLOWS = "The energy follows each change you make.";
const PLACED = "The array is on the roof";

export function firstOpenLinesOf(view: VitalsView): StatusLine[] {
  const cell = (id: VitalId) => view.cells.find((one) => one.id === id)?.quantity ?? null;
  const modules = cell("modules");
  const dc = cell("dc");
  const positions = cell("positions");
  const placed = modules && dc ? `${modules.number} modules · ${dc.number} ${dc.unit}` : positions ? `${positions.number} positions` : null;
  if (placed === null) return [];
  const done: StatusLine = { mark: "done", title: PLACED, detail: placed };
  if (view.last.kind === "failed" || view.last.kind === "decision") return [done];
  const energy = cell("energy");
  const isComputing = view.last.kind === "run" || energy === null;
  return [done, isComputing ? COMPUTING : { mark: "done", title: `${energy.number} ${energy.unit} in year 1`, detail: FOLLOWS }];
}

/** The status shows on the Roof step while no other step of the design was opened on this device. */
export const showsFirstOpenOf = ({ current, seen }: { current: Step | null; seen: readonly Step[] }): boolean => current === "roof" && seen.every((step) => step === "roof");

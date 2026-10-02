// The track of the loss chain as a cascade (plan/phase-08-plan.md, decision 10; docs/design/components.md,
// "Loss chain"): each step's bar runs from the running total before it to the one after, in percent of the GHI
// chained through the steps; the energy steps continue from where the irradiance ended, each scaled by its
// share of the array's nominal energy. The scale is fitted to the run's extremes, so a bar is a share of the
// track from 0 to 1, and the board's bars come out as drawn. Pure.
import type { LossStep } from "../api";

/** A change this small, either way, is nothing: it reads 0.00 % and is drawn as a tick (in percent). */
const NOTHING_BELOW = 0.005;

export const isNothing = (pct: number): boolean => Math.abs(pct) < NOTHING_BELOW;

export type BarLook = "gain" | "loss" | "zero";

export type Mark =
  /** A step: its bar from the running total before it to the one after, as shares of the track. */
  | { kind: "bar"; from: number; to: number; look: BarLook }
  /** A total: a marker where the chain stands. */
  | { kind: "marker"; at: number };

/** For each step, the running total before and after it, in percent of the GHI. */
export function endsOf(steps: readonly LossStep[]): [number, number][] {
  const ghi = steps[0]?.value ?? 1;
  let at = 100;
  // The energy steps are chained from where the irradiance ended: the nominal energy stands for that total.
  let anchor = at;
  let nominal = 1;
  return steps.map((step) => {
    const before = at;
    if (step.kind === "irr") at = (step.value / ghi) * 100;
    else if (step.kind === "energy_total") [anchor, nominal] = [at, step.value];
    else if (step.kind === "energy") at = (anchor * step.value) / nominal;
    return [before, at];
  });
}

const lookOf = (step: LossStep): BarLook => (isNothing(step.pct) ? "zero" : step.pct > 0 ? "gain" : "loss");

/** The marks of the track, one for each step, on one relative scale fitted to the run's extremes. */
export function cascadeOf(steps: readonly LossStep[]): Mark[] {
  const ends = endsOf(steps);
  const values = ends.flat();
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const share = (total: number) => (highest === lowest ? 0 : (total - lowest) / (highest - lowest));
  return steps.map((step, index) => {
    const [before, after] = ends[index]!;
    if (step.kind === "irr" || step.kind === "energy") return { kind: "bar", from: share(before), to: share(after), look: lookOf(step) };
    return { kind: "marker", at: share(after) };
  });
}

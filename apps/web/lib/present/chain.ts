// The chain of Present's energy scene (D72; restored by the owner, 2026-10-13, after V2 · 13 had left it out): the
// cascade of the energy from the modules' rated output to the grid, beside the energy as it counts, its two totals named
// as Performance names them (lib/performance/energy-steps.ts, which this group may not import). From the chosen option
// alone: nothing is asked. Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption } from "../api";
import { cascadeOf, type Mark } from "../format/cascade";

/** A total named, with its figure in MWh. */
export type Named = { label: string; figure: string };

export type PresentChain = {
  /** The marks of the cascade from the modules' rated output on, on a scale of their own. */
  chain: Mark[];
  first: Named;
  last: Named;
};

const RATED_OUTPUT = "The modules' rated output";
const TO_THE_GRID = "To the grid";

export function presentChainOf(option: DesignOption): PresentChain {
  const { steps } = option.energy;
  const rated = steps.findIndex((step) => step.kind === "energy_total");
  const shownSteps = steps.slice(rated === -1 ? 0 : rated);
  const first = shownSteps[0]!;
  const last = shownSteps[shownSteps.length - 1]!;
  return {
    chain: cascadeOf(shownSteps),
    first: { label: rated === -1 ? first.label : RATED_OUTPUT, figure: `${shown(first.value, 1)} MWh` },
    last: { label: last.kind === "result" ? TO_THE_GRID : last.label, figure: `${shown(last.value, 1)} MWh` },
  };
}

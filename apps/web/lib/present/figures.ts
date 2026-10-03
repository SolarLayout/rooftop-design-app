// The figures of the last scene of Present (plan/phase-10-plan.md, step 19, decision 9; the board "Present", frame 6):
// the energy of year 1 as the hero number, under the label Performance gives it, and the chain's cascade from the
// array's nominal energy to the energy to grid, the first and the last total named in the engine's words and
// numbers. From the chosen option alone: nothing is asked. Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption } from "../api";
import { cascadeOf, type Mark } from "../format/cascade";

/** The label of the lead tile of Performance (the board "Performance"): the same words here. */
export const ENERGY_LABEL = "Energy to grid, year 1";

/** A total named: the engine's label and its figure, with its unit on the last. */
export type Named = { label: string; figure: string };

export type FiguresView = {
  label: string;
  /** The energy of year 1 of the chosen option, in MWh: what the count lands on. */
  mwh: number;
  /** The marks of the cascade from the array's nominal energy on, on a scale of their own. */
  chain: Mark[];
  first: Named;
  last: Named;
};

export function figuresOf(option: DesignOption): FiguresView {
  const { steps } = option.energy;
  const nominal = steps.findIndex((step) => step.kind === "energy_total");
  const shownSteps = steps.slice(nominal === -1 ? 0 : nominal);
  const first = shownSteps[0]!;
  const last = shownSteps[shownSteps.length - 1]!;
  return {
    label: ENERGY_LABEL,
    mwh: option.energy.energy_mwh,
    chain: cascadeOf(shownSteps),
    first: { label: first.label, figure: shown(first.value, 1) },
    last: { label: last.label, figure: `${shown(last.value, 1)} MWh` },
  };
}

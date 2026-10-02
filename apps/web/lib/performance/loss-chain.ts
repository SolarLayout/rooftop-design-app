// The rows of the chain "From sunlight to the grid" (the board "Performance"; plan/phase-08-plan.md, decision 3):
// every step of the engine in its order and words, its change with two decimals and the true minus, its running
// total with one decimal and, on the totals, its unit; each with its mark on the cascade. Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption, LossStep, Module } from "../api";
import { cascadeOf, isNothing, type Mark } from "./cascade";
import type { RunOfTheChain } from "./loss-fields";

export type ChainRow = {
  /** The engine's label, word for word. */
  label: string;
  isTotal: boolean;
  /** The change against the step before: "+9.60 %", "−2.22 %", "0.00 %"; null on a total. */
  change: string | null;
  /** The running total after the step, one decimal. */
  total: string;
  /** The unit of the running total, said on the totals alone; null on a step. */
  unit: string | null;
  mark: Mark;
};

export type ChainView = {
  rows: ChainRow[];
  /** What the fields of the chain read of the run. */
  run: RunOfTheChain;
};

/** A change of the chain: two decimals, a plus for a gain, the true minus for a loss, no sign for nothing. */
export function changeOf(pct: number): string {
  if (isNothing(pct)) return "0.00 %";
  return `${pct > 0 ? "+" : ""}${shown(pct, 2)} %`;
}

const isTotal = (step: LossStep) => step.kind === "irr_total" || step.kind === "energy_total" || step.kind === "result";
const unitOf = (step: LossStep) => (step.kind === "irr_total" || step.kind === "irr" ? "kWh/m²" : "MWh");

export function chainViewOf(option: DesignOption, module: Module): ChainView {
  const { steps } = option.energy;
  const marks = cascadeOf(steps);
  return {
    rows: steps.map((step, index) => {
      const total = isTotal(step);
      return { label: step.label, isTotal: total, change: total ? null : changeOf(step.pct), total: shown(step.value, 1), unit: total ? unitOf(step) : null, mark: marks[index]! };
    }),
    run: { energy: option.energy, module },
  };
}

// The proof that the chosen string length fits (V2 · 6, D102; the board "The Strings step"): one line that says it, and
// behind Why the lengths that fit at the voltage and the two hours that decide it, in plain words. Made of the run's
// series range; the voltages are the range's per-module figures times the length. Pure.
import { shown } from "../../components/ui/number-entry";
import { withTrueMinus } from "../../components/shell/notes-view";
import type { DesignOption, SeriesRange } from "../api";

export type FitProof = {
  /** The line under the chosen card: a tick where the option fits, a note where something is missed. */
  fits: { words: string; kind: "fits" | "note" };
  /** "Modules per string at 1500 V". */
  heading: string;
  atLeast: string;
  atMost: string;
  coldest: { when: string; result: string };
  hottest: { when: string; result: string };
  /** What the engine says of an option that misses something, beside the proof; none where it fits. */
  detail: string | null;
};

type Of = { option: Pick<DesignOption, "n_series" | "verdict">; range: SeriesRange; mpptMinimum: number };

const volts = (value: number) => `${shown(value, 0)} V`;
const plainVolts = (value: number) => `${Math.round(value)} V`;

export function fitProofOf({ option, range, mpptMinimum }: Of): FitProof {
  const n = option.n_series;
  const cold = n * range.voc_cold;
  const hot = n * range.vmp_hot;
  const voltage = plainVolts(range.system_v);
  const words = `${n} modules per string`;
  return {
    fits: option.verdict.ok ? { words: `${words} fits at ${voltage}`, kind: "fits" } : { words: `${words} at ${voltage}`, kind: "note" },
    heading: `Modules per string at ${voltage}`,
    atLeast: `${range.n_min} at least`,
    atMost: `${range.n_max} at most`,
    coldest: {
      when: withTrueMinus(`On the coldest morning, ${shown(range.t_min, 1)} °C`),
      result: `A string of ${n} reaches ${volts(cold)}, ${cold <= range.limit_v ? "under" : "over"} the ${plainVolts(range.limit_v)} limit`,
    },
    hottest: {
      when: `On the hottest afternoon, ${shown(range.t_cell_hot, 1)} °C in the cell`,
      result: `It gives ${volts(hot)}, ${hot >= mpptMinimum ? "over" : "under"} the inverter's ${plainVolts(mpptMinimum)} minimum`,
    },
    detail: option.verdict.ok ? null : option.verdict.detail,
  };
}

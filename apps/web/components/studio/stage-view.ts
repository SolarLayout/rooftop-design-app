// The words of the stage that are not the scene: the line under the lens's title (the boards "Studio,
// Roof lens" and "Studio, Array lens") and its states while a layout is on its way or failed (the board
// "Studio, Array lens, states"). Pure functions of the stores; the components draw what they give.
import { shown } from "../ui/number-entry";
import type { DesignOption, LayoutReadouts, NoOptions } from "../../lib/api";
import type { Lens } from "../../lib/routes";
import { isLayoutUpdating, layoutFailureOf, readoutsOf, sunFailureOf, type ResultsState } from "../../lib/stores/results-store";

const area = (squareMetres: number) => `${shown(Math.round(squareMetres), 0)} m²`;

function obstaclesCounted(count: number): string {
  if (count === 0) return "no obstacles";
  return `${count} ${count === 1 ? "obstacle" : "obstacles"}`;
}

/** The line under the title of the lens; null where the lens has none yet, or there is no layout. */
export function subLineOf(lens: Lens, readouts: LayoutReadouts | null, obstacles: number): string | null {
  if (readouts === null) return null;
  if (lens === "roof") return `${area(readouts.roof_area_m2)} · ${area(readouts.inside_setback_area_m2)} inside the setback · ${obstaclesCounted(obstacles)}`;
  if (lens === "array") {
    return `${shown(readouts.positions, 0)} positions · ${shown(readouts.tables, 0)} tables · ${shown(readouts.rows, 0)} rows · ${area(readouts.module_area_m2)} of modules`;
  }
  return null;
}

const counted = (count: number, one: string, many: string) => `${shown(count, 0)} ${count === 1 ? one : many}`;

/** Why there are no strings, in a few words after the positions (plan/phase-07-plan.md, decision 14). */
const NO_STRINGS: Record<NoOptions["code"], string> = {
  system_voltage_missing: "no strings yet",
  no_string_length_fits: "no string length fits",
  too_few_positions: "too few for a string",
  no_positions: "no strings yet",
};

type StringsOf = {
  /** The positions of the layout shown; null before any. */
  positions: number | null;
  /** The MPPTs of one inverter. */
  mppts: number | null;
  /** The option shown as chosen. */
  option: Pick<DesignOption, "n_series" | "n_strings" | "n_inverters" | "n_modules"> | null;
  /** Why the run has no options; null when it has some, or there is no run. */
  noOptions: NoOptions["code"] | null;
};

/** The line under the Strings lens's title (the boards "Studio, Strings lens" and its "no system voltage yet"). */
export function stringsLineOf({ positions, mppts, option, noOptions }: StringsOf): string | null {
  if (positions === null) return null;
  if (option && mppts !== null) {
    const unused = positions - option.n_modules;
    const inverters = `${counted(option.n_inverters, "inverter", "inverters")}, ${shown(mppts, 0)} MPPT${option.n_inverters === 1 ? "" : " each"}`;
    const left = unused > 0 ? `${counted(unused, "position", "positions")} not used` : "every position used";
    return `${counted(option.n_strings, "string", "strings")} of ${shown(option.n_series, 0)} modules · ${inverters} · ${left}`;
  }
  return noOptions === null ? null : `${shown(positions, 0)} positions ready · ${NO_STRINGS[noOptions]}`;
}

export type StageLine = {
  words: string;
  /** A newer layout is on its way: the words are of the layout before, and stand dimmed with a ring. */
  isUpdating: boolean;
};

/** The line under the title as the results stand: the last layout's words, dimmed while a newer one is asked for. */
export function lineOf(lens: Lens, results: ResultsState, obstacles: number): StageLine | null {
  const words = subLineOf(lens, readoutsOf(results), obstacles);
  return words === null ? null : { words, isUpdating: isLayoutUpdating(results) };
}

export type FailedWords = { title: string; message: string; action: string };

/** The chip on the stage when the layout asked for last did not come: what failed, in the API's words, and what to do. */
export function layoutFailedOf(results: ResultsState): FailedWords | null {
  const failure = layoutFailureOf(results);
  return failure === null ? null : { title: "The layout was not updated", message: failure.message, action: "Try again" };
}

/** The chip on the stage when the sun asked for last did not come (the board "Time on the stage"). */
export function sunFailedOf(results: ResultsState): FailedWords | null {
  const failure = sunFailureOf(results);
  return failure === null ? null : { title: "The sun was not updated", message: failure.message, action: "Try again" };
}

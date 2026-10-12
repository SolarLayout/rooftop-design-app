// The words of the stage that are not the scene: the line under the lens's title (the boards "Studio,
// Roof lens" and "Studio, Array lens") and its states while a layout is on its way or failed (the board
// "Studio, Array lens, states"). Pure functions of the stores; the components draw what they give.
import { shown } from "../ui/number-entry";
import type { CableRow, DesignOption, InverterPlace, LayoutReadouts, NoOptions } from "../../lib/api";
import { calloutOfString } from "../../lib/scene/pick";
import type { Ground } from "../../lib/scene/stage-store";
import { categoryOf, numberOfString, seriesOf, type Colouring, type Wired } from "../../lib/stores/string-colours";
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
  if (lens === "roof") return `${area(readouts.roof_area_m2)} · ${area(readouts.inside_setback_area_m2)} inside the edge margin · ${obstaclesCounted(obstacles)}`;
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
  /** The first run is on its way and there are no strings of a run before to show (V2 · 5). */
  isSizing?: boolean;
};

/** The line under the Strings lens's title (the boards "Studio, Strings lens" and its "no system voltage yet"). */
export function stringsLineOf({ positions, mppts, option, noOptions, isSizing = false }: StringsOf): string | null {
  if (positions === null) return null;
  if (option && mppts !== null) {
    const unused = positions - option.n_modules;
    const inverters = `${counted(option.n_inverters, "inverter", "inverters")}, ${shown(mppts, 0)} MPPT${option.n_inverters === 1 ? "" : " each"}`;
    const left = unused > 0 ? `${counted(unused, "position", "positions")} not used` : "every position used";
    return `${counted(option.n_strings, "string", "strings")} of ${shown(option.n_series, 0)} modules · ${inverters} · ${left}`;
  }
  if (noOptions === null) return isSizing ? `${shown(positions, 0)} positions · sizing the strings` : null;
  return `${shown(positions, 0)} positions ready · ${NO_STRINGS[noOptions]}`;
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
  return failure === null ? null : { title: "Layout not updated", message: failure.message, action: "Try again" };
}

/** The chip on the stage when the sun asked for last did not come (the board "Time on the stage"). */
export function sunFailedOf(results: ResultsState): FailedWords | null {
  const failure = sunFailureOf(results);
  return failure === null ? null : { title: "Sun path not updated", message: failure.message, action: "Try again" };
}

/** A list in words: "a", "a and b", "a, b and c". */
function listed(items: readonly string[]): string {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

type StringsWordsOf = {
  option: Pick<DesignOption, "letter"> & { system: { inverters: readonly InverterPlace[] }; cable_schedule: readonly CableRow[] };
  /** The option's strings on the roof. */
  strings: readonly Wired[];
  colouring: Colouring;
  /** The positions of the layout shown. */
  positions: number;
  /** The label of the string selected; null for none. */
  selected: string | null;
};

export type StringsWords = { strings: string; unused: string; inverters: string; selected: string | null };

/**
 * The strings on the roof in words, for the text equivalent of the stage (plan/phase-07-plan.md, step 16): the
 * strings and what they are coloured by, with each colour's strings; the positions not used; the inverters and where
 * the engine places them, in the roof's metres; the string selected, in the words of its callout.
 */
export function stringsWordsOf({ option, strings, colouring, positions, selected }: StringsWordsOf): StringsWords {
  const head = `${counted(strings.length, "string", "strings")} of option ${option.letter}, coloured by ${colouring === "mppt" ? "MPPT" : colouring}`;
  const categories = [...new Set(strings.map((string) => (colouring === "string" ? seriesOf(numberOfString(string.label)) : categoryOf(string, colouring))))].sort((a, b) => a - b);
  const ofCategory = (category: number) =>
    strings
      .filter((string) => (colouring === "string" ? seriesOf(numberOfString(string.label)) : categoryOf(string, colouring)) === category)
      .sort((a, b) => numberOfString(a.label) - numberOfString(b.label));
  const named = (category: number) => (colouring === "mppt" ? `MPPT ${category}` : colouring === "inverter" ? `INV-${category}` : `colour ${category}`);
  const parts = categories.map((category) => {
    const own = ofCategory(category);
    const count = `${named(category)}, ${counted(own.length, "string", "strings")}`;
    return colouring === "string" ? `${count}, ${listed(own.map((string) => string.label))}` : count;
  });
  const turn = colouring === "string" ? `, ${counted(categories.length, "colour", "colours")} in turn` : "";
  const used = strings.reduce((sum, string) => sum + string.modules.length, 0);
  const unused = positions - used;
  const places = option.system.inverters.map(({ label, position: [x, y] }) => `${label} at ${shown(x, 1)} m east, ${shown(y, 1)} m north`);
  const string = selected === null ? undefined : strings.find((one) => one.label === selected);
  const callout = string ? calloutOfString(string, option.cable_schedule.find((row) => row.string === string.label), { inverters: option.system.inverters.length }) : null;
  return {
    strings: `${head}${turn}: ${parts.join("; ")}`,
    unused: unused > 0 ? `${counted(unused, "position", "positions")} not used` : "Every position used",
    inverters: `${places.length === 1 ? "Inverter" : "Inverters"} ${places.join("; ")}`,
    selected: callout ? `${callout.title}, selected: ${callout.detail}` : null,
  };
}

/**
 * The attribution of the imagery at the stage's bottom left: the provider's words while the imagery is the
 * ground drawn (guidelines.md, "3D scene"), none otherwise: the plain grid under the roof (the board "Stage,
 * Layers", decision D57), the moment before the tiles came, or no provider at all.
 */
export function attributionOf(ground: Ground, words: string | null): string | null {
  return ground === "imagery" ? words : null;
}

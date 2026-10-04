// The strings on the roof (plan/phase-07-plan.md, decisions 12 and 13; the board "Strings on the roof"): the
// glass of every position of the layout in the colour of the chosen option's string that wires it, of its MPPT
// or of its inverter, in the series colours in their fixed order; the positions the option does not use grey. A
// string traced or selected is white, every other position dimmed toward the stage. Pure functions; the modules
// take the colours per instance.
import { DIM_TOWARD_STAGE } from "../../components/ui/design-numbers";
import type { PVString } from "../api";
import { PALETTE } from "../geometry/scene-palette";

/** What the strings are coloured by: the Strings lens's colour switch. */
export type Colouring = "string" | "mppt" | "inverter";

/** Of a string, what its colours are of: its label, its positions in wired order, its inverter and its MPPT within it. */
export type Wired = Pick<PVString, "label" | "modules" | "inverter" | "mppt">;

/** The series colours in their fixed order (design-tokens.md, "Colour: data"). */
const SERIES = [PALETTE.series1, PALETTE.series2, PALETTE.series3, PALETTE.series4, PALETTE.series5, PALETTE.series6];

/** The series of a category counted from 1: ((k − 1) mod 6) + 1, so that the seventh is the first again. */
export function seriesOf(category: number): number {
  return ((((category - 1) % SERIES.length) + SERIES.length) % SERIES.length) + 1;
}

/** The colour of a category counted from 1. */
export const seriesColourOf = (category: number): string => SERIES[seriesOf(category) - 1];

/** The number of a string, from its label: S12 is 12. */
export function numberOfString(label: string): number {
  const digits = label.match(/\d+$/);
  return digits ? Number(digits[0]) : 0;
}

/** The category a string is coloured by: the number of its label, its MPPT's (within its inverter) or its inverter's. */
export function categoryOf(string: Pick<Wired, "label" | "inverter" | "mppt">, colouring: Colouring): number {
  if (colouring === "string") return numberOfString(string.label);
  return colouring === "mppt" ? string.mppt : string.inverter;
}

/** A colour mixed *share* of the way toward another, each channel rounded: how the positions not lit are dimmed. */
export function mixedToward(colour: string, toward: string, share: number): string {
  const channels = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  const [from, to] = [channels(colour), channels(toward)];
  return `#${from.map((value, index) => Math.round(value + (to[index] - value) * share).toString(16).padStart(2, "0").toUpperCase()).join("")}`;
}

type ColoursOf = {
  /** The idx of every position of the layout, in its order: the strings name positions by idx. */
  idxs: readonly number[];
  strings: readonly Wired[];
  colouring: Colouring;
  /** The labels of the strings traced under the pointer or selected; none for none. */
  lit: readonly string[];
};

/** One colour per position of the layout, in its order: its string's colour of the colouring, white when lit, grey when not used. */
export function stringColoursOf({ idxs, strings, colouring, lit }: ColoursOf): string[] {
  const colourOfIdx = new Map<number, string>();
  const isLit = strings.some((string) => lit.includes(string.label));
  for (const string of strings) {
    const colour = isLit && lit.includes(string.label) ? PALETTE.stringSelected : seriesColourOf(categoryOf(string, colouring));
    for (const idx of string.modules) colourOfIdx.set(idx, colour);
  }
  const dimmed = (colour: string) => (isLit && colour !== PALETTE.stringSelected ? mixedToward(colour, PALETTE.stage, DIM_TOWARD_STAGE / 100) : colour);
  return idxs.map((idx) => dimmed(colourOfIdx.get(idx) ?? PALETTE.moduleUnused));
}

type RunOf<S> = {
  /** The option shown as chosen, with its strings; null for none. */
  option: { system: { strings: S[] } } | null;
  /** The edit the run is of, and the edit the layout shown is of. */
  runEdit: number | null;
  layoutEdit: number | null;
  /** How many positions the run's layout has, and the layout shown. */
  runPositions: number;
  positions: number;
};

/**
 * The chosen option's strings, when the run is of the layout shown: its edit not older than the layout's and its
 * count of positions the same, as the shade map (shade-map.ts). Null otherwise: strings of another layout would
 * colour the wrong modules.
 */
export function stringsOfTheRunOf<S extends Wired>({ option, runEdit, layoutEdit, runPositions, positions }: RunOf<S>): S[] | null {
  if (option === null || runEdit === null || layoutEdit === null || runEdit < layoutEdit || runPositions !== positions) return null;
  return option.system.strings;
}

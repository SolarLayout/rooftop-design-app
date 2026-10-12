// The Google Earth model's preview (plan/phase-09-plan.md, step 19, decision 8; the board "Handover, previews"): what is in
// the KMZ, in the KML's own names as the engine writes them (rooftop_core/export/files.py, export_kmz_bytes: "Roof", each
// obstacle as "{name} h={height:g}", "Modules ({n})"), and one line on what Google Earth does not draw (V2 · 9). Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption, DesignResult, Obstacle, Project } from "../api";

/** A row of the preview: the name at the left, what it is in words. */
export type FactRow = { name: string; words: string };

export type EarthView = {
  /** The placemarks of the file, in the KML's names, in the order the engine writes them. */
  inside: FactRow[];
  /** The one line under them: what Google Earth does not draw (V2 · 9, audit V2-93). */
  flat: string;
};

type Asked = {
  document: Project;
  design: DesignResult;
  /** The option the file is of. */
  option: DesignOption;
};

const SIGNIFICANT_DIGITS = 6;
/** The engine's name of a cylinder in words: a tank. The other kinds are named as they are. */
const KIND_WORDS: Record<Obstacle["kind"], string> = { box: "box", cylinder: "tank", wall: "wall", tree: "tree", building: "building" };

const count = (value: number) => shown(value, 0);
const FLAT = "Heights are in the names; Google Earth draws the shapes flat.";

/**
 * A number as Python's `:g` writes it, which the engine's KML and DXF use for a height: six significant digits, the trailing
 * zeros dropped, the exponent only far from one ("3", "1.2", "1234.57", "1e-05", "1.23457e+06").
 */
export function formatG(value: number): string {
  if (value === 0) return "0";
  const [mantissa, exponentText] = value.toExponential(SIGNIFICANT_DIGITS - 1).split("e") as [string, string];
  const exponent = Number(exponentText);
  if (exponent < -4 || exponent >= SIGNIFICANT_DIGITS) {
    return `${withoutTrailingZeros(mantissa)}e${exponent < 0 ? "-" : "+"}${String(Math.abs(exponent)).padStart(2, "0")}`;
  }
  return withoutTrailingZeros(value.toFixed(Math.max(0, SIGNIFICANT_DIGITS - 1 - exponent)));
}

const withoutTrailingZeros = (text: string) => (text.includes(".") ? text.replace(/\.?0+$/, "") : text);

/** The name of an obstacle's placemark, as the engine writes it: "Stair room h=3". */
export const placemarkNameOf = (obstacle: Pick<Obstacle, "name" | "height">) => `${obstacle.name} h=${formatG(obstacle.height)}`;

/** The positions of the layout the option leaves unused: they are not in the file. */
export const unusedPositionsOf = (design: DesignResult, option: DesignOption) => design.readouts.positions - option.n_modules;

export function earthViewOf({ document, option }: Asked): EarthView {
  const obstacles = document.roof.obstacles.map(
    (obstacle): FactRow => ({ name: placemarkNameOf(obstacle), words: `the ${KIND_WORDS[obstacle.kind]}'s footprint, its height in the name` }),
  );
  return {
    inside: [{ name: "Roof", words: "the outline" }, ...obstacles, { name: `Modules (${count(option.n_modules)})`, words: "the positions used, one by one" }],
    flat: FLAT,
  };
}

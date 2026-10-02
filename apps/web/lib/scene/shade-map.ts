// The shade map (plan/phase-06-plan.md, decisions 11 and 12): every position of the layout by its near
// shading over the year, as the design run answered it (`Shading.near_pct_by_module`), in five steps of
// one hue from 0 to the next round value over the largest loss. Pure functions; the modules take the
// colour of their step per instance; a selected one says its loss and its string's.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption, Layout, PlacedModule } from "../api";

/** The round values a scale may run to, in percent. */
const TOPS = [1, 2, 5, 10, 20, 50, 100];

export type ShadeScale = { top: number; steps: number };

/** The scale of a map: from 0 to the first round value that holds the largest loss, in five steps. */
export function scaleOf(losses: readonly number[]): ShadeScale {
  const largest = Math.max(0, ...losses);
  return { top: TOPS.find((top) => largest <= top) ?? 100, steps: 5 };
}

/** The step of a loss on the scale, from 0; the top itself is of the last step. */
export function stepOf(loss: number, { top, steps }: ShadeScale): number {
  return Math.min(steps - 1, Math.max(0, Math.floor((loss / top) * steps + 1e-9)));
}

export type ShadeMap = {
  scale: ShadeScale;
  /** The step of every position, by its index in the layout. */
  steps: number[];
  /** How many positions are in each step. */
  counts: number[];
};

type Of = {
  /** The near shading of every position, from the design run. */
  losses: readonly number[];
  /** The edit the run is of, and the edit the layout shown is of. */
  runEdit: number | null;
  layoutEdit: number | null;
  /** How many positions the layout shown has. */
  positions: number;
};

/**
 * The map of the run, when it is of the layout shown: its edit not older than the layout's and its count
 * of positions the same. Null otherwise: a map of another layout would colour the wrong modules.
 */
export function shadeMapOf({ losses, runEdit, layoutEdit, positions }: Of): ShadeMap | null {
  if (runEdit === null || layoutEdit === null || runEdit < layoutEdit || losses.length !== positions) return null;
  const scale = scaleOf(losses);
  const steps = losses.map((loss) => stepOf(loss, scale));
  const counts = Array.from({ length: scale.steps }, (_, step) => steps.filter((one) => one === step).length);
  return { scale, steps, counts };
}

/** The callout of a selected position in the shade map: its position and row; its loss, and its string's. */
export function shadeCalloutOf(module: Pick<PlacedModule, "idx" | "row">, kind: Layout["kind"], lossPct: number, option: DesignOption | null): { title: string; detail: string } {
  const title = `Position ${shown(module.idx + 1, 0)} · ${kind === "flat_ew" ? "unit" : "row"} ${shown(module.row + 1, 0)}`;
  const loss = `Near shading ${shown(lossPct, 2)} % over the year`;
  if (option === null) return { title, detail: loss };
  const string = option.system.strings.find((one) => one.modules.includes(module.idx));
  return { title, detail: string ? `${loss} · string ${string.label}, ${shown(string.shade_pct, 2)} %` : `${loss} · not used by option ${option.letter}` };
}

export type Legend = { title: string; marks: string[]; of: string };

/** The legend of the map: what is coloured, the marks of the scale (the unit after the last), what it counts. */
export function legendOf(map: ShadeMap | null, positions: number): Legend {
  const title = "Near shading over the year";
  if (map === null) return { title, marks: [], of: "The shade map follows the design run" };
  const { top, steps } = map.scale;
  const marks = Array.from({ length: steps + 1 }, (_, step) => String(Number(((top * step) / steps).toFixed(2))));
  marks[steps] = `${marks[steps]} %`;
  return { title, marks, of: `Of all ${shown(positions, 0)} positions` };
}

/** The shade map in words, for the text equivalent of the stage. */
export function shadeMapWordsOf(map: ShadeMap | null): string {
  if (map === null) return "The shade map follows the design run";
  const { top, steps } = map.scale;
  const counts = map.counts.map((count) => shown(count, 0));
  const listed = `${counts.slice(0, -1).join(", ")} and ${counts.at(-1)}`;
  return `The shade map: near shading over the year from 0 to ${shown(top, 0)} %, by steps of ${Number((top / steps).toFixed(2))} %: ${listed} positions`;
}

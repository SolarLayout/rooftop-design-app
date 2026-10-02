// The words of the stage that are not the scene: the line under the lens's title (the boards "Studio,
// Roof lens" and "Studio, Array lens") and its states while a layout is on its way or failed (the board
// "Studio, Array lens, states"). Pure functions of the stores; the components draw what they give.
import { shown } from "../ui/number-entry";
import type { LayoutReadouts } from "../../lib/api";
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

// The words of the stage that are not the scene: the line under the lens's title (the boards "Studio,
// Roof lens" and "Studio, Array lens"). Pure functions of the stores; the components draw what they give.
import { shown } from "../ui/number-entry";
import type { LayoutReadouts } from "../../lib/api";
import type { Lens } from "../../lib/routes";

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

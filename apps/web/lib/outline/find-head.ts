// Find's column (V2 · 4, D98; the board "Find"): its head follows the step, never the tool in hand; the roof type is a
// question with a default; the obstacles are said in words; Build says the area it builds. Pure; the column draws it.
import { shown } from "../../components/ui/number-entry";
import { roofTypeNameOf, type RoofType } from "../geometry/roof-types";
import { areaOf, edgesOf } from "../geometry/measure";
import { WORD_OF_KIND, isRound, type Obstacle } from "./obstacles";
import { measurementsOf, type OutlineState } from "./outline-state";

/** Where Find is: the first step, the outline open, the outline closed, the roof by hand. */
export type FindStage = "find" | "outline" | "closed" | "hand";

export type FindHead = { title: string; line: string };

type Asked = { stage: FindStage; touch: boolean; area?: number | null; corners?: number };

const squareMetres = (area: number) => `${shown(Math.round(area), 0)} m²`;

export function findHeadOf({ stage, touch, area = null, corners = 0 }: Asked): FindHead {
  const press = touch ? "Press" : "Click";
  switch (stage) {
    case "find":
      return { title: "Find the roof", line: "Search for the building, then outline its roof on the map." };
    case "outline":
      return { title: "Outline the roof", line: `${press} each corner of the roof. ${press} the first corner again to close the outline.` };
    case "closed":
      return {
        title: "Add the obstacles",
        line: `The roof is outlined: ${area === null ? "" : `${squareMetres(area)}, `}${corners} corners. Add its obstacles, choose its type, then build.`,
      };
    case "hand":
      return { title: "Enter the roof by hand", line: "Type the roof's length and width. Add its obstacles in the Studio." };
  }
}

/** The one line on the map for the first outline: the roof's own handles say the rest. */
export const MAP_LINE = "Click the roof, then drag it to move it · drag ○ to turn it";

export type RoofTypeChoice = { id: RoofType; name: string; line: string; isDefault: boolean };

/** The roof type's three choices, the rows facing the equator of the roof's hemisphere; tilted rows the default. */
export function roofTypeChoicesOf(latitude: number): RoofTypeChoice[] {
  return [
    { id: "flat_tilted", name: roofTypeNameOf("flat_tilted", latitude), line: "Tilted rows, the usual for a flat roof", isDefault: true },
    { id: "flat_ew", name: roofTypeNameOf("flat_ew", latitude), line: "Low rows back to back: more modules, less from each", isDefault: false },
    { id: "sloped_flush", name: roofTypeNameOf("sloped_flush", latitude), line: "Modules follow the roof pitch", isDefault: false },
  ];
}

const metres = (value: number) => `${shown(value, 1)} m`;

/** An obstacle's size in words: a box by its sides, round by across, a wall by its length, a building by its area. */
function sizeInWordsOf(obstacle: Obstacle): string {
  const { kind, points } = obstacle;
  if (kind === "box") {
    const [long = 0, wide = 0] = edgesOf(points);
    return `${shown(long, 1)} × ${metres(wide)}`;
  }
  if (isRound(kind)) return `${metres(obstacle.diameter ?? 0)} across`;
  if (kind === "wall") return `${metres(points.slice(1).reduce((sum, point, n) => sum + Math.hypot(point.x - points[n].x, point.y - points[n].y), 0))} long`;
  return squareMetres(areaOf(points));
}

/** An obstacle's line under its name: "Box · 5.0 × 4.0 m · 3.0 m high". */
export const obstacleLineOf = (obstacle: Obstacle): string => `${WORD_OF_KIND[obstacle.kind]} · ${sizeInWordsOf(obstacle)} · ${metres(obstacle.height)} high`;

/** Build with the area it builds; without one while the outline has none. */
export const buildLabelOf = (area: number | null): string => (area === null ? "Build this roof" : `Build this roof · ${squareMetres(area)}`);

/** The corners placed, beside Undo and Clear while the outline is open. */
export const cornersWordsOf = (count: number): string => (count === 0 ? "No corners yet" : count === 1 ? "1 corner" : `${count} corners`);

/** The edges of a closed outline on one line, as the row of the edges says them: how many, and where the roof faces. */
export function edgesFactsOf(state: OutlineState): string {
  const measured = measurementsOf(state, (state.frame?.centre.lat ?? 0) >= 0 ? "north" : "south");
  const facing = measured.facing === null ? "" : ` · faces ${shown(Math.round(measured.facing.degrees), 0)}° ${measured.facing.compass}`;
  return `${measured.edges.length} edges${facing}`;
}

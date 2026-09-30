// The obstacles of the Roof lens (plan/phase-05-plan.md, step 12, decision 15): the fields of each kind
// from plan/reference/functional-inventory.md, 1.2, what a new one is, and the facts of a row. The
// inspector renders them; a committed value is an edit of the obstacle.
import type { Range } from "../../components/ui/number-entry";
import { shown } from "../../components/ui/number-entry";
import type { Obstacle } from "../api";
import { areaOf, type XY as Point } from "../outline/measure";
import type { XY } from "../scene/adapter";

export type ObstacleKind = Obstacle["kind"];

/** The numbers of an obstacle a field edits; its points are a table of their own. */
export type ObstacleFieldId = "length" | "width" | "height" | "rotation_deg" | "x" | "y" | "diameter" | "trunk_height" | "thickness";

export type ObstacleField = { id: ObstacleFieldId; label: string; unit?: string; range: Range; value: number };

/** A new obstacle before its height is typed: the height is null until then (decision 15). */
export type DraftObstacle = Omit<Obstacle, "height"> & { height: number | null };

const METRES = (min: number, max: number): Range => ({ min, max, decimals: 2 });

const SPEC: Record<ObstacleFieldId, { label: string; unit?: string; range: Range }> = {
  length: { label: "Length", unit: "m", range: METRES(0.1, 500) },
  width: { label: "Width", unit: "m", range: METRES(0.1, 500) },
  height: { label: "Height", unit: "m", range: METRES(0.05, 200) },
  rotation_deg: { label: "Rotation", unit: "°", range: { min: -180, max: 180, decimals: 0 } },
  x: { label: "East", unit: "m", range: METRES(-5000, 5000) },
  y: { label: "North", unit: "m", range: METRES(-5000, 5000) },
  diameter: { label: "Diameter", unit: "m", range: METRES(0.1, 100) },
  trunk_height: { label: "Crown starts at", unit: "m", range: METRES(0, 100) },
  thickness: { label: "Thickness", unit: "m", range: METRES(0.05, 5) },
};

const FIELDS_OF_KIND: Record<ObstacleKind, ObstacleFieldId[]> = {
  box: ["length", "width", "height", "rotation_deg", "x", "y"],
  cylinder: ["diameter", "height", "x", "y"],
  tree: ["diameter", "height", "trunk_height", "x", "y"],
  wall: ["height", "thickness"],
  building: ["height"],
};

/** The kinds, in the order of the Add menu, with the word of each (the API's names for a new one). */
export const OBSTACLE_KINDS: { id: ObstacleKind; word: string }[] = [
  { id: "box", word: "Box" },
  { id: "cylinder", word: "Tank" },
  { id: "wall", word: "Wall" },
  { id: "tree", word: "Tree" },
  { id: "building", word: "Building" },
];

export const wordOfKind = (kind: ObstacleKind): string => OBSTACLE_KINDS.find((one) => one.id === kind)?.word ?? kind;

/** The fields of an obstacle, by its kind, in the order of the board. A tree's diameter is its crown's. */
export function fieldsOfObstacle(obstacle: Obstacle | DraftObstacle): ObstacleField[] {
  return FIELDS_OF_KIND[obstacle.kind].map((id) => ({
    id,
    ...SPEC[id],
    label: id === "diameter" && obstacle.kind === "tree" ? "Crown ⌀" : SPEC[id].label,
    value: obstacle[id] as number,
  }));
}

/**
 * A new obstacle of a kind at a place (the centre of the roof, or where the user tapped), with the
 * inventory's sizes and no height yet, named by its kind and its count among the roof's own.
 */
export function newObstacleOf(kind: ObstacleKind, [x, y]: XY, among: readonly Obstacle[]): DraftObstacle {
  const count = among.filter((one) => !one.auto && one.kind === kind).length + 1;
  const points: [number, number][] =
    kind === "wall"
      ? [
          [x - 3, y],
          [x + 3, y],
        ]
      : kind === "building"
        ? [
            [x + 3, y - 5],
            [x + 13, y - 5],
            [x + 13, y + 5],
            [x + 3, y + 5],
          ]
        : [];
  return {
    name: `${wordOfKind(kind)} ${count}`,
    kind,
    x,
    y,
    length: 2,
    width: 2,
    rotation_deg: 0,
    diameter: kind === "tree" ? 4 : 2,
    height: null,
    thickness: 0.2,
    trunk_height: 2,
    points,
    auto: false,
  };
}

const asPoints = (points: readonly (readonly [number, number])[]): Point[] => points.map(([x, y]) => ({ x, y }));

/** The facts of an obstacle in its row: its size in the words of its kind, then its height. */
export function factsOf(obstacle: Obstacle): string {
  const height = `h ${shown(obstacle.height, 1)} m`;
  if (obstacle.kind === "box") return `${shown(obstacle.length, 1)} × ${shown(obstacle.width, 1)} · ${height}`;
  if (obstacle.kind === "cylinder") return `⌀ ${shown(obstacle.diameter, 1)} · ${height}`;
  if (obstacle.kind === "tree") return `crown ⌀ ${shown(obstacle.diameter, 1)} · ${height}`;
  if (obstacle.kind === "wall") {
    const along = obstacle.points.slice(1).reduce((sum, [x, y], n) => sum + Math.hypot(x - obstacle.points[n][0], y - obstacle.points[n][1]), 0);
    return `${shown(along, 1)} m · ${height}`;
  }
  return `${shown(Math.round(areaOf(asPoints(obstacle.points))), 0)} m² · ${height}`;
}

/** The obstacle with one field set; the same obstacle when nothing changes. */
export function withObstacleField<Kind extends Obstacle | DraftObstacle>(obstacle: Kind, id: ObstacleFieldId, value: number): Kind {
  return obstacle[id] === value ? obstacle : { ...obstacle, [id]: value };
}

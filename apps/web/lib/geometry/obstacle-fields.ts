// The obstacles of the Roof lens (plan/phase-05-plan.md, step 12, decision 15): the fields of each kind
// from plan/reference/functional-inventory.md, 1.2, what a new one is, and the facts of a row. The
// inspector renders them; a committed value is an edit of the obstacle.
import type { Range } from "../../components/ui/number-entry";
import type { Obstacle, Project, Roof } from "../api";
import type { XY } from "./adapter";

export type ObstacleKind = Obstacle["kind"];

/** The numbers of an obstacle a field edits; its points are a table of their own. */
export type ObstacleFieldId = "length" | "width" | "height" | "rotation_deg" | "x" | "y" | "diameter" | "trunk_height" | "thickness";

export type ObstacleField = { id: ObstacleFieldId; label: string; unit?: string; range: Range; value: number };

/** A new obstacle before its height is typed: the height is null until then (decision 15). */
export type DraftObstacle = Omit<Obstacle, "height"> & { height: number | null };

/** The height a new obstacle is added with, once its field holds one; null while it does not (#179, item 30). */
export const heightToAdd = (draft: DraftObstacle | null): number | null => draft?.height ?? null;

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

/** Fewest points a wall and a building keep: the API's validator wants as many. */
export const FEWEST_POINTS = { wall: 2, building: 3 } as const;

type Point = readonly [number, number];
type WithPoints = Obstacle | DraftObstacle;

const samePoint = (a: Point, b: Point) => a[0] === b[0] && a[1] === b[1];

/** The obstacle with one point moved; the same obstacle when the point is where it was. */
export function withPoint<Kind extends WithPoints>(obstacle: Kind, index: number, point: Point): Kind {
  const before = obstacle.points[index];
  if (!before || samePoint(before, point)) return obstacle;
  return { ...obstacle, points: obstacle.points.map((one, n) => (n === index ? [point[0], point[1]] : one)) };
}

/**
 * The obstacle with a point more: a wall goes on along its last segment by as much again; a building
 * gets the middle of its closing edge, so that its outline stays as it was until the point is moved.
 */
export function withPointAdded<Kind extends WithPoints>(obstacle: Kind): Kind {
  const { points } = obstacle;
  const last = points[points.length - 1];
  const first = points[0];
  if (!last || !first) return obstacle;
  const added: [number, number] =
    obstacle.kind === "wall" ? [2 * last[0] - (points[points.length - 2]?.[0] ?? last[0] - 3), 2 * last[1] - (points[points.length - 2]?.[1] ?? last[1])] : [(last[0] + first[0]) / 2, (last[1] + first[1]) / 2];
  return { ...obstacle, points: [...points, added] };
}

/** The obstacle without one point; the same obstacle at the fewest its kind keeps. */
export function withPointRemoved<Kind extends WithPoints>(obstacle: Kind, index: number): Kind {
  const fewest = obstacle.kind === "wall" ? FEWEST_POINTS.wall : obstacle.kind === "building" ? FEWEST_POINTS.building : 0;
  if (obstacle.points.length <= fewest || !obstacle.points[index]) return obstacle;
  return { ...obstacle, points: obstacle.points.filter((_, n) => n !== index) };
}

/** The roof with the obstacle at `index` replaced; the same roof when it is the same obstacle. */
export function withObstacleAt(roof: Roof, index: number, obstacle: Obstacle): Roof {
  if (roof.obstacles[index] === obstacle) return roof;
  return { ...roof, obstacles: roof.obstacles.map((one, n) => (n === index ? obstacle : one)) };
}

/** The design with the obstacle at `index` replaced, as the drop of a drag commits it in one edit (decision 12); the same design when it is the same obstacle. */
export function withObstacleReplaced(design: Project, index: number, obstacle: Obstacle): Project {
  const roof = withObstacleAt(design.roof, index, obstacle);
  return roof === design.roof ? design : { ...design, roof };
}

/** The roof without the obstacle at `index`. */
export function withoutObstacleAt(roof: Roof, index: number): Roof {
  return { ...roof, obstacles: roof.obstacles.filter((_, n) => n !== index) };
}

/** The roof with the draft joined at the end of its obstacles, with the height that was typed (decision 15). */
export function withObstacleAdded(roof: Roof, draft: DraftObstacle, height: number): Roof {
  return { ...roof, obstacles: [...roof.obstacles, { ...draft, height }] };
}

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

/** The length of a polyline, point to point. */
export function lengthOf(points: readonly Point[]): number {
  return points.slice(1).reduce((sum, [x, y], n) => sum + Math.hypot(x - points[n][0], y - points[n][1]), 0);
}

/**
 * The draft placed where the roof was tapped (Add, then a tap: components.md, "Obstacles on the roof"): a
 * box, a tank or a tree by its centre; a wall or a building with its points moved along by as much.
 */
export function withDraftAt(draft: DraftObstacle, [x, y]: XY): DraftObstacle {
  if (draft.x === x && draft.y === y) return draft;
  const [dx, dy] = [x - draft.x, y - draft.y];
  const points = draft.points.map(([px, py]): [number, number] => [px + dx, py + dy]);
  return { ...draft, x, y, points };
}

/** The obstacle with one field set; the same obstacle when nothing changes. */
export function withObstacleField<Kind extends Obstacle | DraftObstacle>(obstacle: Kind, id: ObstacleFieldId, value: number): Kind {
  return obstacle[id] === value ? obstacle : { ...obstacle, [id]: value };
}

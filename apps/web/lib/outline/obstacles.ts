// The obstacles drawn on the map, in the frame of the outline: a box by its four corners, a round tank
// or tree by its centre and its diameter, a wall by the points of its line, a building beside the roof by its
// corners (the board "Obstacles on the map and their heights"). Their height is asked, never read from
// the imagery. Pure functions; the reducer of the outline holds them.
import { shown } from "../../components/ui/number-entry";
import type { MapShapeRequest } from "../api";
import { toLonLat, toMetres, type Frame } from "./frame";
import { areaOf, edgesOf, type XY } from "../geometry/measure";
import { rectangleOf, turnedAbout } from "./rectangle";

export type ObstacleKind = "box" | "cylinder" | "wall" | "tree" | "building";

/** A tank and a tree are round: drawn from the middle to the edge, kept as their middle and their diameter. */
export const isRound = (kind: ObstacleKind): kind is "cylinder" | "tree" => kind === "cylinder" || kind === "tree";

/** A shape on the map before it has its height. */
export type Shape = { kind: ObstacleKind; points: readonly XY[]; diameter: number | null };

export type Obstacle = Shape & { id: number; name: string; height: number };

/** The words of each kind, as the API names a new one. */
export const WORD_OF_KIND: Record<ObstacleKind, string> = { box: "Box", cylinder: "Tank", wall: "Wall", tree: "Tree", building: "Building" };

/** Fewest points a shape of the kind needs. */
export const FEWEST_POINTS: Record<ObstacleKind, number> = { box: 4, cylinder: 1, wall: 2, tree: 1, building: 3 };

/** The height of an obstacle above the roof, in metres (plan/reference/functional-inventory.md, 1.2). */
export const HEIGHT = { min: 0.05, max: 200, decimals: 2 };

/** The hint under `Height above the roof`: the likely mistake is the height from the ground. */
export const HEIGHT_HINT = "Above the roof's surface, not the ground";

/** The box dragged across a thing: its four corners, counter-clockwise from the lowest left; null for no box. */
export function boxOf(from: XY, to: XY): XY[] | null {
  return rectangleOf(from, to);
}

/**
 * A box with corner `index` moved to `at`: the opposite corner stays, the two beside follow along the
 * sides of the box, so that it stays a rectangle however it is turned. The same box when the corner
 * would meet its opposite.
 */
export function boxWithCorner(points: readonly XY[], index: number, at: XY): readonly XY[] {
  if (points.length !== 4 || index < 0 || index > 3) return points;
  const opposite = points[(index + 2) % 4];
  const next = points[(index + 1) % 4];
  const before = points[(index + 3) % 4];
  const toNext = unit({ x: next.x - points[index].x, y: next.y - points[index].y });
  const toBefore = unit({ x: before.x - points[index].x, y: before.y - points[index].y });
  if (!toNext || !toBefore) return points;
  const d = { x: at.x - opposite.x, y: at.y - opposite.y };
  const alongNext = d.x * toNext.x + d.y * toNext.y;
  const alongBefore = d.x * toBefore.x + d.y * toBefore.y;
  // The dragged corner lies beyond its opposite along both sides, or the box is gone.
  if (alongNext >= 0 || alongBefore >= 0) return points;
  const corner = { x: opposite.x + alongNext * toNext.x + alongBefore * toBefore.x, y: opposite.y + alongNext * toNext.y + alongBefore * toBefore.y };
  const moved = [...points];
  moved[index] = corner;
  moved[(index + 1) % 4] = { x: opposite.x + alongBefore * toBefore.x, y: opposite.y + alongBefore * toBefore.y };
  moved[(index + 3) % 4] = { x: opposite.x + alongNext * toNext.x, y: opposite.y + alongNext * toNext.y };
  return moved;
}

function unit(v: XY): XY | null {
  const length = Math.hypot(v.x, v.y);
  return length === 0 ? null : { x: v.x / length, y: v.y / length };
}

/** The obstacle moved by `by`, in metres: every point, or the middle of a tank. */
export function obstacleMovedBy(obstacle: Obstacle, by: XY): Obstacle {
  return { ...obstacle, points: obstacle.points.map(({ x, y }) => ({ x: x + by.x, y: y + by.y })) };
}

/** The obstacle turned about `centre` by `degrees`, counter-clockwise; a tank keeps its diameter. */
export function obstacleTurnedAbout(obstacle: Obstacle, centre: XY, degrees: number): Obstacle {
  return { ...obstacle, points: turnedAbout(obstacle.points, centre, degrees) };
}

/** A tank or a tree dragged from its middle to its edge; null while there is no size. */
export function roundOf(kind: "cylinder" | "tree", centre: XY, edge: XY): Shape | null {
  const radius = Math.hypot(edge.x - centre.x, edge.y - centre.y);
  if (radius === 0) return null;
  return { kind, points: [centre], diameter: 2 * radius };
}

/** The name of a new obstacle of the kind: the word and the count of that kind, as the API names them. */
export function nameOf(kind: ObstacleKind, among: readonly Obstacle[]): string {
  return `${WORD_OF_KIND[kind]} ${among.filter((obstacle) => obstacle.kind === kind).length + 1}`;
}

/** The size of a shape, in the words of the list: a box by its sides, a tank by its diameter, a wall by its length, a building by its area. */
export function sizeOf(shape: Shape): string {
  const { kind, points } = shape;
  if (kind === "box") {
    const edges = edgesOf(points);
    return `${shown(edges[0] ?? 0, 1)} × ${shown(edges[1] ?? 0, 1)}`;
  }
  if (isRound(kind)) return `⌀ ${shown(shape.diameter ?? 0, 1)}`;
  if (kind === "wall") {
    const along = points.slice(1).reduce((sum, point, n) => sum + Math.hypot(point.x - points[n].x, point.y - points[n].y), 0);
    return `${shown(along, 1)} m`;
  }
  return `${shown(Math.round(areaOf(points)), 0)} m²`;
}

/** The label of an obstacle on the map: its name and its height. */
export function labelOf(obstacle: Obstacle): string {
  return `${obstacle.name} · ${shown(obstacle.height, 1)} m high`;
}

/** The point of a shape its label stands under: the lowest, and of those the leftmost. */
export function foldOf(shape: Shape): XY {
  if (isRound(shape.kind)) {
    const [centre] = shape.points;
    return { x: centre.x, y: centre.y - (shape.diameter ?? 0) / 2 };
  }
  return [...shape.points].sort((a, b) => a.y - b.y || a.x - b.x)[0];
}

/** The obstacles as the API takes them: the points in WGS84, the diameter, the height, the name. */
export function mapShapesOf(obstacles: readonly Obstacle[], frame: Frame): MapShapeRequest[] {
  return obstacles.map((obstacle) => ({
    name: obstacle.name,
    kind: obstacle.kind,
    points: obstacle.points.map((point) => {
      const { lon, lat } = toLonLat(frame, point);
      return [lon, lat] as [number, number];
    }),
    ...(obstacle.diameter === null ? {} : { diameter: obstacle.diameter }),
    height: obstacle.height,
  }));
}

/** The shapes of a roof shown on the map again, as obstacles in the frame, numbered from one. */
export function obstaclesOfMap(shapes: readonly MapShapeRequest[], frame: Frame): Obstacle[] {
  return shapes.map((shape, index) => ({
    id: index + 1,
    kind: shape.kind ?? "box",
    name: shape.name ?? "",
    points: shape.points.map(([lon, lat]) => toMetres(frame, { lon, lat })),
    diameter: shape.diameter ?? null,
    height: shape.height,
  }));
}

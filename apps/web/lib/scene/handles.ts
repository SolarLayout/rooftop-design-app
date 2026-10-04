// The handles of the selected obstacle (plan/phase-05-plan.md, step 19, decision 12; the board "Obstacle
// edited on the roof"): a corner changes the size with the opposite corner still, the turn handle the
// rotation, the height handle the height. Pure functions in the engine's metres; the drop commits.
import { Plane, Ray, Vector3 } from "three";
import { SNAP_DEGREES } from "../../components/ui/design-numbers";
import type { Obstacle } from "../api";
import { boxWithCorner } from "../outline/obstacles";
import { withObstacleField } from "../geometry/obstacle-fields";
import { toScene, type XY, type XYZ } from "../geometry/adapter";
import { onTheRoofPlane, SNAP_M } from "./drag";
import type { HeightAt } from "../geometry/obstacles";

export type BoxOnTheRoof = { x: number; y: number; length: number; width: number; rotationDeg: number };

/** The least a side, a diameter or a height can be dragged to. */
const LEAST_SIDE = 0.1;
const LEAST_HEIGHT = 0.05;

const toSnap = (value: number, step: number) => Number((Math.round(value / step) * step).toFixed(6));

/** The four corners of a box in the plan, counter-clockwise from the one at minus length, minus width. */
export function cornersOf({ x, y, length, width, rotationDeg }: BoxOnTheRoof): XY[] {
  const turn = (rotationDeg * Math.PI) / 180;
  const at = (dx: number, dy: number): XY => [x + dx * Math.cos(turn) - dy * Math.sin(turn), y + dx * Math.sin(turn) + dy * Math.cos(turn)];
  return [at(-length / 2, -width / 2), at(length / 2, -width / 2), at(length / 2, width / 2), at(-length / 2, width / 2)];
}

/** The box with corner `index` dragged to `at`: the opposite corner stays, the sides follow, snapped to 0.1 m. */
export function resizedByCorner(box: BoxOnTheRoof, index: number, at: XY): BoxOnTheRoof {
  const corners = cornersOf(box).map(([x, y]) => ({ x, y }));
  const moved = boxWithCorner(corners, index, { x: at[0], y: at[1] });
  const opposite = corners[(index + 2) % 4];
  const turn = (box.rotationDeg * Math.PI) / 180;
  const along: XY = [Math.cos(turn), Math.sin(turn)];
  const across: XY = [-Math.sin(turn), Math.cos(turn)];
  const dragged = moved[index];
  const d = { x: dragged.x - opposite.x, y: dragged.y - opposite.y };
  const length = Math.max(LEAST_SIDE, toSnap(Math.abs(d.x * along[0] + d.y * along[1]), SNAP_M));
  const width = Math.max(LEAST_SIDE, toSnap(Math.abs(d.x * across[0] + d.y * across[1]), SNAP_M));
  // The box grows from its still corner: its centre is half the new sides from it, toward the dragged one.
  const signAlong = Math.sign(d.x * along[0] + d.y * along[1]) || 1;
  const signAcross = Math.sign(d.x * across[0] + d.y * across[1]) || 1;
  const x = opposite.x + (signAlong * length * along[0] + signAcross * width * across[0]) / 2;
  const y = opposite.y + (signAlong * length * along[1] + signAcross * width * across[1]) / 2;
  return { ...box, x: Number(x.toFixed(6)), y: Number(y.toFixed(6)), length, width };
}

/**
 * The rotation the turn handle gives: the handle stands off the box's north side (its +y before the turn),
 * so the pointer's bearing about the centre, counter-clockwise from north, is the turn; snapped to a right
 * angle within 3° (the map's rule), in whole degrees, from −180 to 180.
 */
export function turnedTo({ x, y }: BoxOnTheRoof, pointer: XY): number {
  const degrees = (Math.atan2(-(pointer[0] - x), pointer[1] - y) * 180) / Math.PI;
  const nearest = Math.round(degrees / 90) * 90;
  const snapped = Math.abs(degrees - nearest) <= SNAP_DEGREES ? nearest : Math.round(degrees);
  const wrapped = ((snapped + 180) % 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
}

/**
 * The height the height handle gives: where the ray of the camera crosses the vertical plane through the
 * obstacle's centre that faces the camera, above the roof there; snapped to 0.1 m, at least 0.05 m.
 */
export function heightAlongRay(ray: Ray, centre: XY, roofHeight: number): number {
  const [cx, cy, cz] = toScene([centre[0], centre[1], roofHeight]);
  const facing = new Vector3(ray.direction.x, 0, ray.direction.z);
  if (facing.lengthSq() === 0) return LEAST_HEIGHT;
  const plane = new Plane().setFromNormalAndCoplanarPoint(facing.normalize(), new Vector3(cx, cy, cz));
  const hit = ray.intersectPlane(plane, new Vector3());
  if (!hit) return LEAST_HEIGHT;
  return Math.max(LEAST_HEIGHT, toSnap(hit.y - cy, SNAP_M));
}

/** The diameter the edge handle of a tank or a tree's crown gives: twice the pointer's distance from the centre, snapped, at least 0.1 m. */
export function diameterTo([cx, cy]: XY, pointer: XY): number {
  return Math.max(LEAST_SIDE, toSnap(2 * Math.hypot(pointer[0] - cx, pointer[1] - cy), SNAP_M));
}

/** The handles of the selected obstacle: a corner of its top, the turn, the height, or the edge of a tank or a crown. */
export type HandleId = "corner-0" | "corner-1" | "corner-2" | "corner-3" | "turn" | "height" | "edge";

/** A point a handle is placed by: a handle itself, or the foot of a stem and the way it points. */
export type HandlePoint = { id: HandleId | "turn-foot" | "turn-north" | "height-foot" | "height-up"; at: XYZ };

const boxOf = ({ x, y, length, width, rotation_deg }: Obstacle): BoxOnTheRoof => ({ x, y, length, width, rotationDeg: rotation_deg });

/**
 * The points the handles of an obstacle are placed by, in the engine's metres (the board "Obstacle edited
 * on the roof"): a box has a handle at each corner of its top, the turn handle on a stem off the middle of
 * its north edge (its +y before the turn, turned with it), the height handle on a stem up from the middle
 * of its top; a tank or a tree one handle at the east of its edge, at its top; a wall or a building none.
 */
export function handlePointsOf(obstacle: Obstacle, heightAt: HeightAt): HandlePoint[] {
  const { kind, x, y, height } = obstacle;
  const top = heightAt([x, y]) + height;
  if (kind === "cylinder" || kind === "tree") return [{ id: "edge", at: [x + obstacle.diameter / 2, y, top] }];
  if (kind !== "box") return [];
  const corners = cornersOf(boxOf(obstacle));
  const turn = (obstacle.rotation_deg * Math.PI) / 180;
  const north: XY = [-Math.sin(turn), Math.cos(turn)];
  const foot: XY = [(corners[2][0] + corners[3][0]) / 2, (corners[2][1] + corners[3][1]) / 2];
  return [
    ...corners.map(([cx, cy], n): HandlePoint => ({ id: `corner-${n}` as HandleId, at: [cx, cy, top] })),
    { id: "turn-foot", at: [foot[0], foot[1], top] },
    { id: "turn-north", at: [foot[0] + north[0], foot[1] + north[1], top] },
    { id: "height-foot", at: [x, y, top] },
    { id: "height-up", at: [x, y, top + 1] },
  ];
}

/** The frame of the scene the rays are in: about the roof's centroid, the roof's height under a point. */
export type About = { centroid: XY; heightAt: HeightAt };

/**
 * The obstacle a handle drag gives: the pointer's ray against the plane of the obstacle's top for a
 * corner, the turn and an edge; against the vertical through its centre for the height. The same obstacle
 * when the ray misses, or nothing changes.
 */
export function obstacleByHandle(obstacle: Obstacle, handle: HandleId, ray: Ray, { centroid: [cx, cy], heightAt }: About): Obstacle {
  const { x, y, height } = obstacle;
  const foot = heightAt([x, y]);
  if (handle === "height") return withObstacleField(obstacle, "height", heightAlongRay(ray, [x - cx, y - cy], foot));
  const hit = onTheRoofPlane(ray, foot + height);
  if (!hit) return obstacle;
  const at: XY = [hit[0] + cx, hit[1] + cy];
  if (handle === "edge") return withObstacleField(obstacle, "diameter", diameterTo([x, y], at));
  if (handle === "turn") return withObstacleField(obstacle, "rotation_deg", turnedTo(boxOf(obstacle), at));
  const resized = resizedByCorner(boxOf(obstacle), Number(handle.slice("corner-".length)), at);
  return (["x", "y", "length", "width"] as const).reduce((box, field) => withObstacleField(box, field, resized[field]), obstacle);
}

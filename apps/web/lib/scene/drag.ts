// A drag of an obstacle on the roof plane (plan/phase-05-plan.md, step 19, decision 12): where the pointer
// points on the plane, the place snapped to 0.1 m, the obstacle kept inside the roof. Pure functions in
// the engine's metres about the scene's origin; the drop commits what they give.
import { Plane, Ray, Vector3 } from "three";
import { fromScene, type XY } from "./adapter";

/** The grid a dragged obstacle snaps to, in metres. */
export const SNAP_M = 0.1;

const UP = new Vector3(0, 1, 0);

/** Where a ray of the camera meets the roof plane at `height`, in the engine's metres; null when it never does. */
export function onTheRoofPlane(ray: Ray, height: number): XY | null {
  const plane = new Plane(UP, -height);
  const hit = ray.intersectPlane(plane, new Vector3());
  if (!hit) return null;
  const [x, y] = fromScene([hit.x, hit.y, hit.z]);
  return [Number(x.toFixed(6)), Number(y.toFixed(6))];
}

const toSnap = (value: number) => Number((Math.round(value / SNAP_M) * SNAP_M).toFixed(6));

export function snapped([x, y]: XY): XY {
  return [toSnap(x) === 0 ? 0 : toSnap(x), toSnap(y) === 0 ? 0 : toSnap(y)];
}

/** The place brought inside the roof's box by the obstacle's half sides, so that it never leaves the roof. */
export function keptInside([x, y]: XY, roof: readonly XY[], halfLength: number, halfWidth: number): XY {
  const xs = roof.map(([px]) => px);
  const ys = roof.map(([, py]) => py);
  const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);
  return [clamp(x, Math.min(...xs) + halfLength, Math.max(...xs) - halfLength), clamp(y, Math.min(...ys) + halfWidth, Math.max(...ys) - halfWidth)];
}

export type Dragged = { x: number; y: number; halfLength: number; halfWidth: number };

/** Where the pointer went on the plane, from where the press began to where it is now. */
export type Pointer = { from: XY; to: XY };

/** The obstacle's new centre: its own moved by what the pointer moved, snapped, kept inside the roof. */
export function movedTo(obstacle: Dragged, pointer: Pointer, roof: readonly XY[]): XY {
  const moved: XY = [obstacle.x + pointer.to[0] - pointer.from[0], obstacle.y + pointer.to[1] - pointer.from[1]];
  return keptInside(snapped(moved), roof, obstacle.halfLength, obstacle.halfWidth);
}

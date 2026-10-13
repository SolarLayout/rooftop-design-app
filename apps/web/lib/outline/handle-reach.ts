// The handles of the obstacle picked on Find's map, against a drag from inside it (issue 238, item 27). A small obstacle
// on the screen is no larger than its corners' handles, so a drag from inside it grabbed a corner and reshaped it. The
// move comes first. Pure; the outline's layer measures the handles and the obstacle on the screen.
import { edgesOf } from "../geometry/measure";
import { isRound, type Obstacle } from "./obstacles";

/** Where a handle takes a press: its whole target, its dot alone, or nowhere (the handle is not shown). */
export type Reach = "target" | "dot" | "none";

/** The obstacle's shortest side, in metres: a tank's or a tree's diameter, a wall's shortest stretch, a box's or a building's shortest edge. */
export function shortestSideOf(obstacle: Obstacle): number {
  if (isRound(obstacle.kind)) return obstacle.diameter ?? 0;
  const { points } = obstacle;
  const sides = obstacle.kind === "wall" ? points.slice(1).map((point, n) => Math.hypot(point.x - points[n].x, point.y - points[n].y)) : edgesOf(points);
  return sides.length === 0 ? 0 : Math.min(...sides);
}

/**
 * The whole target while the obstacle is at least two targets across, so that a target reaches at most half-way in;
 * the dot alone while it is at least a dot and a half across, so that two dots leave half a dot clear between them;
 * below that no handle, and a drag from anywhere inside moves it.
 */
export function handleReachOf({ sidePx, targetPx, dotPx }: { sidePx: number; targetPx: number; dotPx: number }): Reach {
  if (sidePx >= 2 * targetPx) return "target";
  if (sidePx >= 1.5 * dotPx) return "dot";
  return "none";
}

// An obstacle picked on Find's map (D79), as the Studio's Roof lens moves it on the roof: a drag moves it
// in steps of 0.1 m and stops at the roof's edge; a box and a building turn by their handle, a tank and a
// wall only move. Pure, in the metres of the frame.
import { NUDGE_MM } from "../../components/ui/design-numbers";
import { shown } from "../../components/ui/number-entry";
import type { XY } from "../geometry/measure";
import { isRound, obstacleMovedBy, sizeOf, type Obstacle, type ObstacleKind } from "./obstacles";
import { isInside, moveLabelOf, type Lift } from "./roof-move";

// A drag moves an obstacle in the steps of a nudge, 0.1 m, as the Studio's drag snaps it.
const SNAP_M = NUDGE_MM / 1000;
// A tank's round edge is tested at this many points.
const TANK_SIDES = 16;

/** The points of an obstacle's footprint: its own, or a tank's round edge. */
export function footprintOf(obstacle: Obstacle): readonly XY[] {
  if (!isRound(obstacle.kind)) return obstacle.points;
  const [centre] = obstacle.points;
  const radius = (obstacle.diameter ?? 0) / 2;
  return Array.from({ length: TANK_SIDES }, (_, n) => {
    const angle = (2 * Math.PI * n) / TANK_SIDES;
    return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
  });
}

/** Whether every point of the obstacle's footprint is inside the roof. */
export function isOnRoof(obstacle: Obstacle, roof: readonly XY[]): boolean {
  return footprintOf(obstacle).every((point) => isInside(roof, point));
}

/**
 * The move an obstacle on the roof takes of what the pointer moved: in steps of 0.1 m, as far as it stays on
 * the roof, sliding along the edge it meets. One that was not on the roof (a building beside it) moves freely.
 */
export function movedOnRoof(obstacle: Obstacle, by: XY, roof: readonly XY[]): XY {
  const steps = { x: Math.round(by.x / SNAP_M), y: Math.round(by.y / SNAP_M) };
  const at = (x: number, y: number): XY => ({ x: Number((x * SNAP_M).toFixed(6)), y: Number((y * SNAP_M).toFixed(6)) });
  if (!isOnRoof(obstacle, roof) || isOnRoof(obstacleMovedBy(obstacle, at(steps.x, steps.y)), roof)) return at(steps.x, steps.y);
  const fits = (x: number, y: number) => isOnRoof(obstacleMovedBy(obstacle, at(x, y)), roof);
  let x = 0;
  let y = 0;
  // A step at a time toward where the pointer is, east or west, then north or south, while it fits.
  for (let moved = true; moved; ) {
    moved = false;
    const sx = Math.sign(steps.x - x);
    if (sx !== 0 && fits(x + sx, y)) {
      x += sx;
      moved = true;
    }
    const sy = Math.sign(steps.y - y);
    if (sy !== 0 && fits(x, y + sy)) {
      y += sy;
      moved = true;
    }
  }
  return at(x, y);
}

/** A box and a building turn; a tank (round, the same however it is turned) and a wall only move. */
export function canTurn(kind: ObstacleKind): boolean {
  return kind === "box" || kind === "building";
}

/** What the label beside an obstacle says while it is moved or turned: what it is and what changed. */
export function obstacleLiftLabelOf(obstacle: Obstacle, lift: Lift): string {
  if (lift.kind === "move") return `${obstacle.name} · ${moveLabelOf(lift.by)}`;
  const size = obstacle.kind === "box" ? `${sizeOf(obstacle)} m` : sizeOf(obstacle);
  return `${obstacle.name} · ${size} · turned ${shown(Math.round(-lift.degrees) + 0, 0)}°`;
}

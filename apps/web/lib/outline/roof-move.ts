// The closed roof picked up whole on Find's map (D79): moved by a drag or the arrow keys, turned about
// its middle by a handle off its north edge, its obstacles with it. Pure, in the metres of the frame.
import { shown } from "../../components/ui/number-entry";
import { STEM_TURN } from "../../components/ui/design-numbers";
import { bearingOf, centroidOf, facingOf, isClockwise, type Hemisphere, type XY } from "../geometry/measure";
import { obstacleMovedBy, obstacleTurnedAbout, type Obstacle } from "./obstacles";
import { turnedAbout } from "./rectangle";

/** The move or the turn of the picked roof under way, from where it stood when it was picked up. */
export type Lift = { kind: "move"; by: XY } | { kind: "turn"; degrees: number };

/** What moves with the roof: its corners and its obstacles. */
export type Carried = { corners: readonly XY[]; obstacles: readonly Obstacle[] };

/** Whether `at` is inside the outline (the even-odd rule); an outline of fewer than three corners holds nothing. */
export function isInside(points: readonly XY[], at: XY): boolean {
  if (points.length < 3) return false;
  let inside = false;
  points.forEach((a, index) => {
    const b = points[(index + points.length - 1) % points.length];
    if (a.y > at.y !== b.y > at.y && at.x < ((b.x - a.x) * (at.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  });
  return inside;
}

export function movedBy({ corners, obstacles }: Carried, by: XY): Carried {
  return { corners: corners.map(({ x, y }) => ({ x: x + by.x, y: y + by.y })), obstacles: obstacles.map((obstacle) => obstacleMovedBy(obstacle, by)) };
}

/** Turned about the middle of the roof by `degrees`, counter-clockwise. */
export function turnedBy({ corners, obstacles }: Carried, degrees: number): Carried {
  const centre = centroidOf(corners);
  return { corners: turnedAbout(corners, centre, degrees), obstacles: obstacles.map((obstacle) => obstacleTurnedAbout(obstacle, centre, degrees)) };
}

/** The outward normal of edge `index`, of unit length. */
function outwardOf(corners: readonly XY[], index: number): XY {
  const a = corners[index];
  const b = corners[(index + 1) % corners.length];
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const along = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  return isClockwise(corners) ? { x: -along.y, y: along.x } : { x: along.y, y: -along.x };
}

/** Degrees from -180 up to 180. */
const wrapped = (degrees: number) => {
  const turn = ((((degrees + 180) % 360) + 360) % 360) - 180;
  return turn === -180 ? 180 : turn;
};

/** The edge whose outside looks nearest north: the turn handle stands off its middle. */
export function northEdgeOf(corners: readonly XY[]): number {
  let best = 0;
  let least = Infinity;
  corners.forEach((_, index) => {
    const { x, y } = outwardOf(corners, index);
    const off = Math.abs(wrapped(bearingOf(x, y)));
    if (off < least - 1e-9) {
      least = off;
      best = index;
    }
  });
  return best;
}

/**
 * Where the turn handle stands: on a stem of 44 px square off the middle of the north edge. The edge is
 * chosen on the roof as it was picked up (`base`), so that it stays the same edge while it turns.
 */
export function turnHandleOf(base: readonly XY[], corners: readonly XY[], metresPerPx: number): { foot: XY; handle: XY } {
  const edge = northEdgeOf(base);
  const a = corners[edge];
  const b = corners[(edge + 1) % corners.length];
  const foot = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const out = outwardOf(corners, edge);
  const up = STEM_TURN * metresPerPx;
  return { foot, handle: { x: foot.x + out.x * up, y: foot.y + out.y * up } };
}

/**
 * The turn a drag of the handle gives, in degrees counter-clockwise: the angle swept about the middle of
 * the roof from where the drag began. Where the north edge would then look within `snapWithin` degrees
 * of north, it is turned to look due north.
 */
export function turnOfDrag(corners: readonly XY[], from: XY, to: XY, snapWithin: number): number {
  const centre = centroidOf(corners);
  const angle = ({ x, y }: XY) => (Math.atan2(y - centre.y, x - centre.x) * 180) / Math.PI;
  const turn = wrapped(angle(to) - angle(from));
  const { x, y } = outwardOf(corners, northEdgeOf(corners));
  // A bearing runs clockwise, a turn counter-clockwise.
  const looks = wrapped(bearingOf(x, y) - turn);
  return Math.abs(looks) <= snapWithin ? wrapped(turn + looks) : turn;
}

/** What the label beside the roof says while it is moved or turned: how far, or the turn and where it now faces. */
export function liftLabelOf(lift: Lift, corners: readonly XY[], hemisphere: Hemisphere): string {
  if (lift.kind === "move") {
    const { x, y } = lift.by;
    return `${shown(Math.abs(x), 1)} m ${x < 0 ? "W" : "E"} · ${shown(Math.abs(y), 1)} m ${y < 0 ? "S" : "N"}`;
  }
  const facing = facingOf(corners, hemisphere);
  const turn = `${shown(-lift.degrees + 0, 1)}°`;
  return facing ? `${turn} · faces ${Math.round(facing.degrees)}° ${facing.compass}` : turn;
}

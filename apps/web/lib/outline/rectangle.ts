// The rectangle tool: a box dragged across the roof, then turned to the building by its handle.
import { bearingOf, type XY } from "./measure";

/** The four corners of the box between two opposite corners, counter-clockwise from the lowest left. */
export function rectangleOf(from: XY, to: XY): XY[] | null {
  const left = Math.min(from.x, to.x);
  const right = Math.max(from.x, to.x);
  const bottom = Math.min(from.y, to.y);
  const top = Math.max(from.y, to.y);
  if (right - left === 0 || top - bottom === 0) return null;
  return [
    { x: left, y: bottom },
    { x: right, y: bottom },
    { x: right, y: top },
    { x: left, y: top },
  ];
}

/** The points turned about `centre` by `degrees`, counter-clockwise. */
export function turnedAbout(points: readonly XY[], centre: XY, degrees: number): XY[] {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return points.map(({ x, y }) => {
    const dx = x - centre.x;
    const dy = y - centre.y;
    return { x: centre.x + dx * cos - dy * sin, y: centre.y + dx * sin + dy * cos };
  });
}

/**
 * The turn that the handle gives, in degrees counter-clockwise from north: straight above the centre is
 * none. Within `snapWithin` degrees of north it is none.
 */
export function turnOfHandle(centre: XY, handle: XY, snapWithin = 0): number {
  const bearing = bearingOf(handle.x - centre.x, handle.y - centre.y);
  const turn = bearing <= 180 ? -bearing : 360 - bearing;
  return Math.abs(turn) <= snapWithin ? 0 : turn;
}

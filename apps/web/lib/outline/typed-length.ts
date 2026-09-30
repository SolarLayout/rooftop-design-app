// A length typed into an edge corrects the outline: the edge scales about its midpoint. With the corners
// squared a rectangle stays one: the two corners at each end of the edge move together, so that the
// opposite edge follows (plan/phase-04-find-and-outline.md, "Type a measured length").
import { edgesOf, type XY } from "./measure";

const RIGHT_ANGLE_WITHIN = 1e-6;

/** Whether four corners make a rectangle: every corner a right angle. */
export function isRectangle(points: readonly XY[]): boolean {
  if (points.length !== 4) return false;
  return points.every((corner, index) => {
    const before = points[(index + 3) % 4];
    const after = points[(index + 1) % 4];
    const dot = (before.x - corner.x) * (after.x - corner.x) + (before.y - corner.y) * (after.y - corner.y);
    return Math.abs(dot) <= RIGHT_ANGLE_WITHIN * Math.hypot(before.x - corner.x, before.y - corner.y) * Math.hypot(after.x - corner.x, after.y - corner.y) + 1e-9;
  });
}

/** The outline with edge `edge` made `length` long. The same outline when the length is nothing or less. */
export function withEdgeLength(points: readonly XY[], edge: number, length: number, squared: boolean): readonly XY[] {
  if (!(length > 0) || points.length < 2 || edge < 0 || edge >= edgesOf(points).length) return points;
  const a = points[edge];
  const b = points[(edge + 1) % points.length];
  const now = Math.hypot(b.x - a.x, b.y - a.y);
  if (now === 0) return points;
  const unit = { x: (b.x - a.x) / now, y: (b.y - a.y) / now };
  const half = (length - now) / 2;
  const moved = points.map((point) => ({ ...point }));
  const move = (index: number, sign: number) => {
    moved[index] = { x: points[index].x + sign * half * unit.x, y: points[index].y + sign * half * unit.y };
  };
  move(edge, -1);
  move((edge + 1) % points.length, 1);
  if (squared && isRectangle(points)) {
    move((edge + 3) % 4, -1);
    move((edge + 2) % 4, 1);
  }
  return moved;
}

// What an outline measures: its edges, its area, its centre, which way round it goes, and the
// direction its long side faces. Pure functions of points in a flat frame of metres, x east, y north.

export type XY = { x: number; y: number };

export type Hemisphere = "north" | "south";

export type Facing = { degrees: number; compass: string };

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const distance = (a: XY, b: XY) => Math.hypot(b.x - a.x, b.y - a.y);

/** The length of each edge, from each corner to the next; the last edge closes on the first. */
export function edgesOf(points: readonly XY[]): number[] {
  if (points.length < 2) return [];
  if (points.length === 2) return [distance(points[0], points[1])];
  return points.map((point, index) => distance(point, points[(index + 1) % points.length]));
}

/** The middle of each edge, where its label stands. */
export function midpointsOf(points: readonly XY[]): XY[] {
  if (points.length < 2) return [];
  const edges = points.length === 2 ? [points.slice(0, 2)] : points.map((point, index) => [point, points[(index + 1) % points.length]]);
  return edges.map(([a, b]) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }));
}

/** Twice the signed area: positive counter-clockwise. */
function doubleSignedArea(points: readonly XY[]): number {
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
}

/** The area, in square metres; nothing for fewer than three corners. */
export function areaOf(points: readonly XY[]): number {
  return points.length < 3 ? 0 : Math.abs(doubleSignedArea(points)) / 2;
}

export function isClockwise(points: readonly XY[]): boolean {
  return doubleSignedArea(points) < 0;
}

/** The centroid of the area; for fewer than three corners, the mean of the points. */
export function centroidOf(points: readonly XY[]): XY {
  const twice = doubleSignedArea(points);
  if (points.length < 3 || twice === 0) {
    const n = points.length || 1;
    return { x: points.reduce((sum, p) => sum + p.x, 0) / n, y: points.reduce((sum, p) => sum + p.y, 0) / n };
  }
  let x = 0;
  let y = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const cross = point.x * next.y - next.x * point.y;
    x += (point.x + next.x) * cross;
    y += (point.y + next.y) * cross;
  });
  return { x: x / (3 * twice), y: y / (3 * twice) };
}

/** A bearing in degrees clockwise from north, from 0 up to 360, of a direction (dx east, dy north). */
export function bearingOf(dx: number, dy: number): number {
  const degrees = (Math.atan2(dx, dy) * 180) / Math.PI;
  return ((degrees % 360) + 360) % 360;
}

/** The word of the compass nearest a bearing. */
export function compassOf(degrees: number): string {
  return COMPASS[((Math.round(degrees / 45) % 8) + 8) % 8];
}

/**
 * The direction the long side faces: the outward normal of the longest edge, taken toward the equator
 * (decision of the plan, 16). Where neither normal is nearer the equator, east is taken.
 */
export function facingOf(points: readonly XY[], hemisphere: Hemisphere): Facing | null {
  if (points.length < 3) return null;
  const edges = edgesOf(points);
  const longest = edges.indexOf(Math.max(...edges));
  const a = points[longest];
  const b = points[(longest + 1) % points.length];
  const along = { x: b.x - a.x, y: b.y - a.y };
  // The outward normal of an edge of a counter-clockwise outline is to its right.
  const outward = isClockwise(points) ? { x: -along.y, y: along.x } : { x: along.y, y: -along.x };
  const candidates = [outward, { x: -outward.x, y: -outward.y }];
  const towardEquator = hemisphere === "north" ? -1 : 1;
  const [best] = [...candidates].sort((p, q) => {
    const byEquator = q.y * towardEquator - p.y * towardEquator;
    return Math.abs(byEquator) > 1e-9 ? byEquator : q.x - p.x;
  });
  const degrees = bearingOf(best.x, best.y);
  return { degrees, compass: compassOf(degrees) };
}

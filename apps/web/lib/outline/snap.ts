// Snapping while a corner is placed or dragged: to a right angle with the edge before, to a parallel of
// an existing edge, and closing on the first corner (plan/phase-04-find-and-outline.md, "Snapping").
import { bearingOf, type XY } from "../geometry/measure";

export type SnappedTo = "right-angle" | "parallel" | null;

export type Snapping = {
  /** Where the pointer is. */
  candidate: XY;
  /** The corner before the one placed; null for the first. */
  previous: XY | null;
  /** The corner before that; null for the second. */
  before: XY | null;
  /** The edges that are drawn already, each as its two ends. */
  edges: readonly (readonly [XY, XY])[];
  /** Degrees within which an angle snaps. */
  within: number;
  /**
   * Metres within which a snap may carry the corner from the pointer: a few pixels of the map. Far from the
   * corner before, 3° is metres wide; without it the corner would stick to the line, then jump.
   */
  reach: number;
  /** Whether right angles are snapped to ("Square the corners"). */
  squared: boolean;
};

const turn = (from: number, to: number) => {
  const d = ((to - from) % 360) + 360;
  return ((d + 180) % 360) - 180;
};

const MICROMETRE = 1e-6;
const rounded = (value: number) => Math.round(value / MICROMETRE) * MICROMETRE;

/**
 * `candidate` brought onto the line from `pivot` at the bearing `degrees`: its foot on that line, so that
 * what the pointer meant along the line is kept, as snapping to an axis does.
 */
function atBearing(pivot: XY, candidate: XY, degrees: number): XY {
  const radians = (degrees * Math.PI) / 180;
  const unit = { x: Math.sin(radians), y: Math.cos(radians) };
  const along = (candidate.x - pivot.x) * unit.x + (candidate.y - pivot.y) * unit.y;
  return { x: rounded(pivot.x + along * unit.x), y: rounded(pivot.y + along * unit.y) };
}

/** The corner as it is placed: snapped to a right angle, else to a parallel, else where it is. */
export function snappedCorner({ candidate, previous, before, edges, within, reach, squared }: Snapping): { corner: XY; snappedTo: SnappedTo } {
  if (!previous) return { corner: candidate, snappedTo: null };
  const bearing = bearingOf(candidate.x - previous.x, candidate.y - previous.y);
  /** The corner on the line at `degrees`, when the line is within the angle and the reach of the pointer. */
  const onto = (degrees: number): XY | null => {
    if (Math.abs(turn(bearing, degrees)) > within) return null;
    const corner = atBearing(previous, candidate, degrees);
    return Math.hypot(corner.x - candidate.x, corner.y - candidate.y) <= reach ? corner : null;
  };

  if (squared && before) {
    const ofEdgeBefore = bearingOf(previous.x - before.x, previous.y - before.y);
    for (const right of [ofEdgeBefore + 90, ofEdgeBefore - 90]) {
      const corner = onto(right);
      if (corner) return { corner, snappedTo: "right-angle" };
    }
  }
  for (const [a, b] of edges) {
    const ofEdge = bearingOf(b.x - a.x, b.y - a.y);
    for (const parallel of [ofEdge, ofEdge + 180]) {
      const corner = onto(parallel);
      if (corner) return { corner, snappedTo: "parallel" };
    }
  }
  return { corner: candidate, snappedTo: null };
}

/** Whether a press at `candidate` is on the first corner: within `withinPx` on a map of `metresPerPx`. */
export function closesOnFirst(first: XY, candidate: XY, withinPx: number, metresPerPx: number): boolean {
  return Math.hypot(candidate.x - first.x, candidate.y - first.y) <= withinPx * metresPerPx;
}

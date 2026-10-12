// The outline of the roof edited in the plan of the Roof step (V2 · 7, D103; audit V2-59): a corner dragged on the stage and
// let go. Snapped to 0.1 m, as every drag of the stage is; an outline that would cross itself, or close to less than a
// square metre, is refused and the roof stays as it was. Pure, in the roof's metres.
import { SNAP_M } from "../stores/drag";
import type { XY } from "./adapter";
import { areaOf } from "./measure";

const LEAST_AREA_M2 = 1;

const toSnap = (value: number) => Number((Math.round(value / SNAP_M) * SNAP_M).toFixed(6));

/** Whether segments ab and cd cross at a point inside both (touching at an end is not crossing). */
function cross(a: XY, b: XY, c: XY, d: XY): boolean {
  const side = (p: XY, q: XY, r: XY) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const [d1, d2, d3, d4] = [side(c, d, a), side(c, d, b), side(a, b, c), side(a, b, d)];
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** Whether a closed outline crosses itself: any two edges that are not neighbours cross. */
function crossesItself(outline: readonly XY[]): boolean {
  const n = outline.length;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (cross(outline[i]!, outline[(i + 1) % n]!, outline[j]!, outline[(j + 1) % n]!)) return true;
    }
  }
  return false;
}

/** The outline with corner *index* at *at*, snapped; the same outline when it does not move; null when refused. */
export function withCornerMoved(outline: readonly XY[], index: number, at: XY): XY[] | null {
  const moved: XY = [toSnap(at[0]), toSnap(at[1])];
  const before = outline[index];
  if (!before) return null;
  if (before[0] === moved[0] && before[1] === moved[1]) return outline as XY[];
  const after = outline.map((corner, at_) => (at_ === index ? moved : corner));
  if (crossesItself(after) || areaOf(after.map(([x, y]) => ({ x, y }))) < LEAST_AREA_M2) return null;
  return after;
}

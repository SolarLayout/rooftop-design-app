// The reveal of Present (plan/phase-10-plan.md, step 17, decision 9): the building and the obstacles rising, the
// modules filling row by row. The engine places the positions of a layout row by row (rooftop_core/placement.py),
// so the first share of them in the layout's order is the first rows: the instanced mesh draws that many, and no
// geometry is made or written for it (plan/reference/r3f-notes.md, fixes 11 and 12). Pure functions; the Studio
// shows everything, at a share of 1.

const clamp = (share: number) => Math.min(1, Math.max(0, share));

/** How many of `total` positions are drawn at a share of the reveal: none at 0, all at 1. */
export function revealedCountOf(total: number, share: number): number {
  return Math.round(total * clamp(share));
}

/** The least a height is scaled by: a scale of 0 has no inverse, and three cannot light what has none. */
export const LEAST_HEIGHT = 0.001;

/** The scale of a height at a share of its rise: its own at 1, a hair at 0. */
export function risenScaleOf(share: number): number {
  return Math.max(LEAST_HEIGHT, clamp(share));
}

/** How far the roof plane stands under its height while the building rises from the ground `depth` below it. */
export function liftOf(share: number, depth: number): number {
  return (clamp(share) - 1) * depth;
}

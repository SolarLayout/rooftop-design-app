// The note of a footprint found by Detect building (issue 238, item 5). The press takes the footprint as the outline at
// once; the note says so, and its one button is Undo. Pure; Find shows the note while this holds.
import type { XY } from "../geometry/measure";

/**
 * Whether the note still stands: while the outline is the footprint taken, so that its Undo takes back the footprint and
 * nothing after it. A note that nothing was found (`taken` null) stands until it is closed.
 */
export function footprintNoteStays(taken: readonly XY[] | null, corners: readonly XY[]): boolean {
  if (taken === null) return true;
  return taken.length === corners.length && taken.every((corner, n) => corner.x === corners[n].x && corner.y === corners[n].y);
}

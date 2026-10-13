// The note of a footprint found by Detect building (issue 238, item 5). The press takes the footprint as the outline at
// once; the note says so, and its one button is Undo. Pure; Find shows the note while this holds.
import { SCREEN_MARGIN } from "../../components/ui/design-numbers";
import type { XY } from "../geometry/measure";

type Size = { width: number; height: number };

/** How far the note stands from the press, across and down (the board "Find": the callout at the press). */
export const NOTE_GAP = 32;

/** One axis: after the press where it fits, else before it where that fits, else held inside, its start first. */
function along(at: number, extent: number, room: number): number {
  const after = at + NOTE_GAP;
  if (after + extent <= room - SCREEN_MARGIN) return after;
  const before = at - NOTE_GAP - extent;
  if (before >= SCREEN_MARGIN) return before;
  return Math.max(SCREEN_MARGIN, Math.min(after, room - extent - SCREEN_MARGIN));
}

/**
 * Where the note stands (issue 238, item 31), in whole pixels of the screen, over the map's visible area (the stage, as it
 * is on the screen; the press `at` is in its pixels): below and to the right of the press; above it or to its left where
 * that side has no room; held 8 inside the stage where neither has (a phone's width, a short stage).
 */
export function footprintNotePlaceOf({ at, size, stage }: { at: XY; size: Size; stage: Size & { left: number; top: number } }): XY {
  return { x: Math.round(stage.left + along(at.x, size.width, stage.width)), y: Math.round(stage.top + along(at.y, size.height, stage.height)) };
}

/**
 * Whether the note still stands: while the outline is the footprint taken, so that its Undo takes back the footprint and
 * nothing after it. A note that nothing was found (`taken` null) stands until it is closed.
 */
export function footprintNoteStays(taken: readonly XY[] | null, corners: readonly XY[]): boolean {
  if (taken === null) return true;
  return taken.length === corners.length && taken.every((corner, n) => corner.x === corners[n].x && corner.y === corners[n].y);
}

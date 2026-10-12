// The one line on Find's map for the first outline (V2 · 4, D98; before it the tips of D79): "Click the roof, then drag it to move it ·
// drag ○ to turn it", once the outline is closed, gone for good on this device once the roof is moved or turned. The
// roof's own handles say the rest. Pure; the device remembers it gone (lib/device/tips-seen.ts).
import { isClosedAndSettled, type OutlineState } from "./outline-state";

export type TipId = "roof";

/** Whether the line shows: the outline closed and still, nothing drawn or awaiting its height, and the line not gone. */
export function showsMapLineOf(state: OutlineState, gone: ReadonlySet<TipId>): boolean {
  return isClosedAndSettled(state) && state.pending === null && state.drawing === null && !gone.has("roof");
}

/** The line's move done between two states: the roof lifted and let go as a step of Undo. */
export function tipDoneBy(before: OutlineState, after: OutlineState): TipId | null {
  const { lift } = before;
  if (!lift || lift.of !== "roof" || after.lift !== null || after.history === before.history) return null;
  return "roof";
}

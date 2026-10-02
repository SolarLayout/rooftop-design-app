// Where the callout of what is selected stands (docs/design/components.md, "Callout on the stage"; the board
// "Obstacle edited on the roof"; plan/phase-06-plan.md, step 15). Pure: of the anchor's height on the stage,
// the size and whether the selected obstacle's handles stand.
import type { Size } from "../../components/studio/use-size";

/**
 * Pixels the callout needs over its dot: its line of 40 and a chip of about 60, clear of the stage's top, where
 * the title, the view controls and on phone the time stand.
 */
export const ROOM_ABOVE = 160;

export type CalloutPlace = "above" | "below" | null;

export function calloutPlaceOf({ y, size, hasHandles }: { y: number; size: Size; hasHandles: boolean }): CalloutPlace {
  if (size === "phone" && hasHandles) return null;
  return y < ROOM_ABOVE ? "below" : "above";
}

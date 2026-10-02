// Where the callout of what is selected stands (docs/design/components.md, "Callout on the stage"; the board
// "Obstacle edited on the roof"; plan/phase-06-plan.md, step 15). Pure: of the anchor's height on the stage,
// the size and whether the selected obstacle's handles stand.
import type { Size } from "../../components/studio/use-size";

/**
 * Pixels the callout needs over its dot: its line of 40 and a chip of about 60, clear of the stage's top, where
 * the title, the view controls and on phone the time stand.
 */
export const ROOM_ABOVE = 160;

/**
 * On phone the stage has no title: over its dot the callout needs to be clear of the time and the view controls
 * alone (48), with its line of 40 and its chip of about 60.
 */
export const ROOM_ABOVE_ON_PHONE = 148;

/** Pixels the callout needs under its dot: its line and its chip, and clear of the legend and the attribution at the stage's bottom. */
export const ROOM_BELOW = 154;

export type CalloutPlace = "above" | "below" | null;

type Of = {
  /** The dot's height on the stage, from its top. */
  y: number;
  size: Size;
  hasHandles: boolean;
  /** The stage's height; unknown before the scene has drawn. */
  stageHeight?: number;
};

export function calloutPlaceOf({ y, size, hasHandles, stageHeight }: Of): CalloutPlace {
  if (size === "phone" && hasHandles) return null;
  if (size === "phone" && stageHeight !== undefined) {
    // Under the dot, as the board "Strings on the roof" hangs it, where it fits over the legend; else over it (plan/phase-07-plan.md, step 22).
    if (y + ROOM_BELOW <= stageHeight) return "below";
    return y >= ROOM_ABOVE_ON_PHONE ? "above" : "below";
  }
  return y < ROOM_ABOVE ? "below" : "above";
}

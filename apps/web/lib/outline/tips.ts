// Find's tips (D79, components.md "Tip"): one at a time, shown when its move becomes possible, gone for good once
// its move is done or Got it is pressed. Pure; the device remembers what is gone (lib/device/tips-seen.ts).
import { isClosedAndSettled, type OutlineState } from "./outline-state";

export type TipId = "roof" | "obstacle";

/** A row of a tip: the key or the gesture, in its chip, and what it does. */
export type TipRow = { key: string; does: string };

export type Tip = { title: string; pointer: readonly TipRow[]; touch: readonly TipRow[] };

export const TIPS: Readonly<Record<TipId, Tip>> = {
  roof: {
    title: "Move or turn the roof",
    pointer: [
      { key: "Click", does: "inside the roof to pick it up" },
      { key: "Drag", does: "inside it to move it" },
      { key: "◯", does: "drag the round handle to turn it" },
      { key: "← ↑ → ↓", does: "nudge 0.1 m, with Shift 1 m" },
    ],
    touch: [
      { key: "Press", does: "inside the roof to pick it up" },
      { key: "Drag", does: "with one finger inside it to move it" },
      { key: "◯", does: "drag the round handle to turn it" },
      { key: "2 fingers", does: "move the map, as always" },
    ],
  },
  obstacle: {
    title: "Move or turn an obstacle",
    pointer: [
      { key: "Click", does: "an obstacle to pick it" },
      { key: "Drag", does: "it to move it" },
      { key: "◯", does: "turns a box or a building" },
      { key: "Delete", does: "removes it" },
    ],
    touch: [
      { key: "Press", does: "an obstacle to pick it" },
      { key: "Drag", does: "it to move it" },
      { key: "◯", does: "turns a box or a building" },
    ],
  },
};

/** The tip to show: the roof's once it is closed, then the obstacles' once there is one; none while a shape awaits its height or is drawn. */
export function tipShownOf(state: OutlineState, gone: ReadonlySet<TipId>): TipId | null {
  if (!isClosedAndSettled(state) || state.pending !== null || state.drawing !== null) return null;
  if (!gone.has("roof")) return "roof";
  if (!gone.has("obstacle") && state.obstacles.length > 0) return "obstacle";
  return null;
}

/** The tip whose move was done between two states: a lift of the roof or of an obstacle let go as a step of Undo. */
export function tipDoneBy(before: OutlineState, after: OutlineState): TipId | null {
  const { lift } = before;
  if (!lift || after.lift !== null || after.history === before.history) return null;
  return lift.of === "roof" ? "roof" : "obstacle";
}

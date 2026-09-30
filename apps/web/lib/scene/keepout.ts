// The words of a kept-clear area on the roof (plan/phase-05-plan.md, step 8, decision 4): what /layout
// answered about one part of the keep-out, and the shade-free window of the array.
import type { Keepout } from "../api";

export type Window = {
  /** Solar hours the window runs from and to. */
  from: number;
  to: number;
  /** When shaded positions are allowed, the area is used after all: the words say so. */
  allowShaded: boolean;
};

export type Callout = { title: string; detail: string };

/** A solar hour as the clock writes it, "09:15". */
export function hourOf(hour: number): string {
  const whole = Math.floor(hour);
  const minutes = Math.round((hour - whole) * 60);
  return `${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function positionsOf(count: number): string {
  if (count === 0) return "no whole position";
  return `${count} ${count === 1 ? "position" : "positions"}`;
}

/** The callout of a part: how many positions it keeps clear (or shades), and what casts it, when. */
export function calloutOf(part: Keepout, window: Window): Callout {
  const what = part.cause === "parapet" ? "The parapet" : (part.obstacle ?? "An obstacle");
  return {
    title: `${window.allowShaded ? "Shaded in the window" : "Kept clear"} · ${positionsOf(part.positions)}`,
    detail: `${what} shades this area between ${hourOf(window.from)} and ${hourOf(window.to)}`,
  };
}

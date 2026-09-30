// The words of a kept-clear area on the roof (plan/phase-05-plan.md, step 8, decision 4): what /layout
// answered about one part of the keep-out, and the shade-free window of the array.
import type { Keepout } from "../api";
import { areaOf, centroidOf } from "../outline/measure";
import type { XY } from "./adapter";

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

/** Where the callout of a part is hung: the centroid of its largest polygon; null when it has none. */
export function anchorOf(part: Keepout): XY | null {
  const largest = part.polygons
    .map((polygon) => polygon.exterior.map(([x, y]) => ({ x, y })))
    .sort((a, b) => areaOf(b) - areaOf(a))[0];
  if (!largest) return null;
  const { x, y } = centroidOf(largest);
  return [x, y];
}

// The stops of the bottom sheet: where they are, where a drag ends, and where a key leads (Sheet).

/** Peek shows the handle and what is first in the sheet; half takes half the room; full all of it. */
export type Stop = "peek" | "half" | "full";

/** How high the sheet is at each stop, in pixels. */
export type Heights = Record<Stop, number>;

const FROM_THE_LOWEST: readonly Stop[] = ["peek", "half", "full"];

// How far of the way to the next stop a drag must go to end there.
const ENOUGH = 1 / 4;

/**
 * Where the stops are in a room that is `room` high, for a sheet that shows `peek` of itself when it
 * is closed and takes `half` of the room at its middle stop. They never cross: peek is the lowest, full
 * the highest.
 */
export function heightsOf(room: number, peek: number, half = 1 / 2): Heights {
  const full = Math.max(0, room);
  const lowest = Math.min(peek, full);
  return { peek: lowest, half: Math.min(full, Math.max(lowest, Math.round(full * half))), full };
}

/**
 * The share of a room `room` high that lies under what stands `above` high at its top, from 0 to 1; null
 * while the room has no height. A sheet that takes this share at half meets the foot of what is above it.
 */
export function shareUnder(room: number, above: number): number | null {
  if (room <= 0) return null;
  return Math.min(1, Math.max(0, (room - above) / room));
}

/** How high the sheet is while it is dragged: it follows the pointer, between peek and full. */
export function heightAfterDrag(heightAtStart: number, pointerAtStart: number, pointer: number, heights: Heights): number {
  return Math.min(heights.full, Math.max(heights.peek, heightAtStart + pointerAtStart - pointer));
}

function nearestStop(height: number, heights: Heights): Stop {
  return FROM_THE_LOWEST.reduce((best, stop) =>
    Math.abs(heights[stop] - height) < Math.abs(heights[best] - height) ? stop : best,
  );
}

/**
 * The stop the sheet goes to when it is let go at `height`: the nearest, and the next one in the
 * direction of the drag when the drag went a quarter of the way there.
 */
export function stopAfterDrag(from: Stop, height: number, heights: Heights): Stop {
  const nearest = nearestStop(height, heights);
  if (nearest !== from) return nearest;

  const dragged = height - heights[from];
  const next = FROM_THE_LOWEST[FROM_THE_LOWEST.indexOf(from) + Math.sign(dragged)];
  if (next === undefined || next === from) return from;

  const way = Math.abs(heights[next] - heights[from]);
  return way > 0 && Math.abs(dragged) >= way * ENOUGH ? next : from;
}

/** The stop a key leads to, or null when the key changes nothing. */
export function stopAfterKey(stop: Stop, key: string): Stop | null {
  const at = FROM_THE_LOWEST.indexOf(stop);
  const to = (() => {
    switch (key) {
      case "ArrowUp":
        return FROM_THE_LOWEST[at + 1];
      case "ArrowDown":
        return FROM_THE_LOWEST[at - 1];
      case "Home":
        return "peek";
      case "End":
        return "full";
      case "Enter":
      case " ":
        return FROM_THE_LOWEST[(at + 1) % FROM_THE_LOWEST.length];
      default:
        return undefined;
    }
  })();
  return to === undefined || to === stop ? null : to;
}

// A press on the handle moves the sheet by less than this; more is a drag.
const NO_DRAG = 4;

/**
 * The stop after the handle was let go. A press that did not move the sheet opens it one stop further,
 * as Enter does; a drag ends where a drag ends.
 */
export function stopAfterRelease(from: Stop, heightAtStart: number, height: number, heights: Heights): Stop {
  if (Math.abs(height - heightAtStart) < NO_DRAG) return stopAfterKey(from, "Enter") ?? from;
  return stopAfterDrag(from, height, heights);
}

const VALUE: Record<Stop, number> = { peek: 0, half: 50, full: 100 };

/** How far the sheet is open at a stop, from 0 to 100, for a screen reader. */
export function valueOf(stop: Stop): number {
  return VALUE[stop];
}

const WORDS: Record<Stop, string> = { peek: "Closed", half: "Half open", full: "Open" };

/** The stop in words, for a screen reader. */
export function wordsOf(stop: Stop): string {
  return WORDS[stop];
}

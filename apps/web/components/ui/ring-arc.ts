// The geometry of a progress ring (ProgressRing): a circle on a square of 24, as the icons are.

/** Sides of a ring: 12 for the state of saving, 16 beside a value, 20 in a row, 44 on the stage. */
export type RingSize = 12 | 16 | 20 | 44;

// How wide the line is, in pixels on the screen (docs/design/components.md, "Progress ring").
const LINE: Record<RingSize, number> = { 12: 1.5, 16: 2, 20: 2.5, 44: 3 };

const SQUARE = 24;
// What stays free between the ring and the edge of the square.
const MARGIN = 0.5;

const inside = (share: number) => Math.min(1, Math.max(0, share));

export type Arc = {
  radius: number;
  /** The width of the line, in units of the square. */
  line: number;
  /** The way around the ring. */
  around: number;
  /** How much of the way is filled. */
  filled: number;
};

/** The ring of a size, filled for a share of the way, from 0 to 1. */
export function arcOf(share: number, size: RingSize): Arc {
  const line = (LINE[size] * SQUARE) / size;
  const radius = SQUARE / 2 - line / 2 - MARGIN;
  const around = 2 * Math.PI * radius;
  return { radius, line, around, filled: around * inside(share) };
}

/**
 * How far, in whole percent. Before the end it is 99 at the most: progress is for showing, and a run is
 * over when its result is there.
 */
export function percentOf(share: number): number {
  const percent = Math.round(inside(share) * 100);
  return share < 1 ? Math.min(99, percent) : percent;
}

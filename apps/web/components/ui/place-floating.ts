// Where a thing floats beside its control: a tooltip over it, a list under it (Tooltip, FloatingList).

import { SCREEN_MARGIN } from "./design-numbers";

export type Box = { left: number; top: number; width: number; height: number };
export type Size = { width: number; height: number };
export type Side = "above" | "below";

type Asked = {
  /** The control, as it is on the screen. */
  anchor: Box;
  /** The thing that floats. */
  size: Size;
  screen: Size;
  /** The side it is on when there is room. */
  side: Side;
  /** Its left edge on the left edge of the control, or its middle on the middle of the control. */
  align: "start" | "middle";
  /** What stays between the two. */
  gap: number;
};

export type Place = { x: number; y: number; side: Side };

const inside = (value: number, least: number, most: number) => Math.max(least, Math.min(value, most));

/**
 * The place of the thing, in whole pixels of the screen. It goes to the other side where its own has no
 * room and the other has; it never leaves the screen at the sides, and its top stays on the screen.
 */
export function placeOf({ anchor, size, screen, side, align, gap }: Asked): Place {
  const y: Record<Side, number> = {
    above: anchor.top - gap - size.height,
    below: anchor.top + anchor.height + gap,
  };
  const hasRoom: Record<Side, boolean> = {
    above: y.above >= SCREEN_MARGIN,
    below: y.below + size.height <= screen.height - SCREEN_MARGIN,
  };
  const other: Side = side === "above" ? "below" : "above";
  const taken = !hasRoom[side] && hasRoom[other] ? other : side;

  const x = align === "start" ? anchor.left : anchor.left + anchor.width / 2 - size.width / 2;

  return {
    x: Math.round(inside(x, SCREEN_MARGIN, Math.max(SCREEN_MARGIN, screen.width - size.width - SCREEN_MARGIN))),
    y: Math.round(inside(y[taken], SCREEN_MARGIN, Math.max(SCREEN_MARGIN, screen.height - size.height - SCREEN_MARGIN))),
    side: taken,
  };
}

/**
 * Whether a control is still where it was, within a pixel: a scroll or a resize somewhere on the page need not have
 * moved it, and what floats beside it has no reason to go then.
 */
export function isStill(before: Box, now: Box, within = 1): boolean {
  return (["left", "top", "width", "height"] as const).every((side) => Math.abs(before[side] - now[side]) <= within);
}

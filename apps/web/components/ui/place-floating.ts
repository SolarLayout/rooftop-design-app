// Where a thing floats beside its control: a tooltip over it, a list under it (Tooltip, FloatingList), the value of
// a block of the single-line diagram at its right (ValueTooltip).

import { SCREEN_MARGIN } from "./design-numbers";

export type Box = { left: number; top: number; width: number; height: number };
export type Size = { width: number; height: number };
export type Side = "above" | "below" | "left" | "right";

type Asked = {
  /** The control, as it is on the screen. */
  anchor: Box;
  /** The thing that floats. */
  size: Size;
  screen: Size;
  /** The side it is on when there is room. */
  side: Side;
  /**
   * Over or under the control: its left edge on the left edge of the control, its middle on the middle of the control, or
   * its right edge on the right edge (the menu of a card, whose button stands at the card's right). Beside it: its top on
   * the top of the control, its middle on the middle, or its bottom on the bottom.
   */
  align: "start" | "middle" | "end";
  /** What stays between the two. */
  gap: number;
};

export type Place = { x: number; y: number; side: Side };

const OTHER: Record<Side, Side> = { above: "below", below: "above", left: "right", right: "left" };

const inside = (value: number, least: number, most: number) => Math.max(least, Math.min(value, most));

/**
 * The place of the thing, in whole pixels of the screen. It goes to the other side where its own has no
 * room and the other has; it never leaves the screen at the sides, and its top stays on the screen.
 */
export function placeOf({ anchor, size, screen, side, align, gap }: Asked): Place {
  const isBeside = side === "left" || side === "right";
  const along: Record<Side, number> = {
    above: anchor.top - gap - size.height,
    below: anchor.top + anchor.height + gap,
    left: anchor.left - gap - size.width,
    right: anchor.left + anchor.width + gap,
  };
  const hasRoom: Record<Side, boolean> = {
    above: along.above >= SCREEN_MARGIN,
    below: along.below + size.height <= screen.height - SCREEN_MARGIN,
    left: along.left >= SCREEN_MARGIN,
    right: along.right + size.width <= screen.width - SCREEN_MARGIN,
  };
  const taken = !hasRoom[side] && hasRoom[OTHER[side]] ? OTHER[side] : side;

  const alongTheControl = (start: number, length: number, extent: number) => (align === "start" ? start : align === "end" ? start + length - extent : start + length / 2 - extent / 2);
  const x = isBeside ? along[taken] : alongTheControl(anchor.left, anchor.width, size.width);
  const y = isBeside ? alongTheControl(anchor.top, anchor.height, size.height) : along[taken];

  return {
    x: Math.round(inside(x, SCREEN_MARGIN, Math.max(SCREEN_MARGIN, screen.width - size.width - SCREEN_MARGIN))),
    y: Math.round(inside(y, SCREEN_MARGIN, Math.max(SCREEN_MARGIN, screen.height - size.height - SCREEN_MARGIN))),
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

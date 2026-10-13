// What of the outline's handles and labels on Find's map follows the state while one of them is held (issue 238, item
// 28). Pure; the outline's layer reads it on each change of the state.

/** A corner held (of the roof, a midpoint made a corner, or an obstacle's), the rectangle's turn handle held, or nothing. */
export type Held = "corner" | "turn" | null;

export type Follows = {
  /** The corners, the midpoints, the edges' lengths and the obstacles' labels and handles. */
  handles: boolean;
  /** The handle that turns the rectangle. */
  turnHandle: boolean;
};

/**
 * A corner held is the drag's own, and the handles are made anew when their number changes (a midpoint dragged makes a
 * corner): nothing is redrawn under the hand. The rectangle's turn handle is the drag's too; the corners and the edges'
 * lengths follow the turn as it is made.
 */
export function followsOf(held: Held): Follows {
  if (held === "corner") return { handles: false, turnHandle: false };
  if (held === "turn") return { handles: true, turnHandle: false };
  return { handles: true, turnHandle: true };
}

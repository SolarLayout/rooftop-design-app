// The cursor over Find's map says what a drag does (D79).

export type MapCursor = "grab" | "grabbing" | "crosshair" | "move";

export type Pointing = {
  /** A drawing tool in hand needs the press. */
  draws: boolean;
  /** The pointer is over what is picked: the roof picked up, or the obstacle picked. */
  overPicked: boolean;
  /** The map pans, or what is picked is moved or turned. */
  dragged: boolean;
};

/** A closed hand while something is dragged; the move cursor over what is picked; the crosshair while a tool draws; else an open hand. */
export function mapCursorOf({ draws, overPicked, dragged }: Pointing): MapCursor {
  if (dragged) return "grabbing";
  if (overPicked) return "move";
  return draws ? "crosshair" : "grab";
}

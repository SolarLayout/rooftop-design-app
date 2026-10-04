// The roof entered by hand (the board "Enter dimensions by hand"): a rectangle by its length, its width
// and where its long side faces, or a table of corners, in metres about the place typed or found. The
// corners go to the outline reducer as a roof loaded, at that place, and everything after is the same as
// for a roof drawn on the map: the tiles, the roof type, Build.
import type { LonLat } from "./frame";
import type { XY } from "../geometry/measure";
import { turnedAbout } from "./rectangle";

export type Shape = "rectangle" | "corners";

/** A row of the corner table: metres east and north of the middle of the roof; null until typed. */
export type Row = { east: number | null; north: number | null };

export type ByHand = {
  lat: number | null;
  lon: number | null;
  shape: Shape;
  length: number | null;
  width: number | null;
  /** Where the long side faces, in degrees clockwise from north. */
  faces: number | null;
  rows: readonly Row[];
};

export const NOTHING_ENTERED: ByHand = { lat: null, lon: null, shape: "rectangle", length: null, width: null, faces: null, rows: [] };

/** Fewest corners a roof needs. */
const FEWEST_CORNERS = 3;

/** The direction the long side of a rectangle faces before it is turned: south, as the demo's does. */
const FACES_BEFORE_TURN = 180;

/**
 * The four corners of a rectangle about the origin, counter-clockwise from the south-west before it is
 * turned, its long side facing `faces` degrees clockwise from north. The longer of the two sides is
 * the long one, whichever is called the length.
 */
export function cornersOfRectangle(length: number, width: number, faces: number): XY[] {
  const long = Math.max(length, width) / 2;
  const short = Math.min(length, width) / 2;
  const before: XY[] = [
    { x: -long, y: -short },
    { x: long, y: -short },
    { x: long, y: short },
    { x: -long, y: short },
  ];
  // Turned counter-clockwise by this, a side that faced south faces `faces`.
  const turn = FACES_BEFORE_TURN - faces;
  return turnedAbout(before, { x: 0, y: 0 }, turn).map(({ x, y }) => ({ x: rounded(x), y: rounded(y) }));
}

const rounded = (value: number) => Math.round(value * 1e9) / 1e9 + 0;

/** The corners of the table, in its order; a row that is not complete is left out. */
export function cornersOfTable(rows: readonly Row[]): XY[] {
  return rows.flatMap((row) => (row.east === null || row.north === null ? [] : [{ x: row.east, y: row.north }]));
}

/** Where the roof is and its corners, once enough is entered to draw it; null before. */
export function isEntered(entered: ByHand): { at: LonLat; corners: XY[] } | null {
  const { lat, lon } = entered;
  if (lat === null || lon === null) return null;
  const at = { lat, lon };
  if (entered.shape === "rectangle") {
    const { length, width, faces } = entered;
    if (length === null || width === null || faces === null) return null;
    return { at, corners: cornersOfRectangle(length, width, faces) };
  }
  const corners = cornersOfTable(entered.rows);
  return corners.length < FEWEST_CORNERS ? null : { at, corners };
}

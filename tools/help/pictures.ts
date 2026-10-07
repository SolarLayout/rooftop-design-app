// The pictures of the how-tos (D81): what each picture shows, as what the hand does on Find's map before it is taken, and
// what of the screen is kept. Pure; e2e/help-pictures takes them (`bun help:pictures`) into apps/web/public/help/<dir>/.

export type Point = { x: number; y: number };
/** The extent of the roof on the screen, in CSS pixels. */
export type Box = { left: number; top: number; right: number; bottom: number };
/** A part of the screen kept in a picture, as Playwright's screenshot takes it. */
export type Clip = { x: number; y: number; width: number; height: number };
export type Margin = { left: number; top: number; right: number; bottom: number };

/** Where on the roof: fractions of its box, across from its left and down from its top. */
export type Spot = { across: number; down: number };

/**
 * What the hand does before a picture: a click; a drag by so many pixels; a turn by the round handle, clockwise on the
 * screen. A drag or a turn that is held is caught before the button is let go, then taken back, so that the next picture
 * begins from the roof as it was.
 */
export type Act =
  | { kind: "click"; at: Spot }
  | { kind: "drag"; from: Spot; by: Point; held: boolean }
  | { kind: "turn"; degrees: number; held: boolean };

/** A picture: its name in the folder (its step's number) and what the hand does after the picture before it. */
export type Shot = { name: string; acts: readonly Act[] };

/** A how-to's pictures: its folder under public/help, the window they are taken in, the margin kept round the roof. */
export type HowTo = { dir: string; window: { width: number; height: number }; margin: Margin; shots: readonly Shot[] };

/** A clear spot inside the demo roof: away from its corners, its edges' labels and its obstacles. */
const CLEAR = { across: 0.17, down: 0.22 };

// Wide enough that the demo roof stands clear of Find's panel; the margin keeps the handle above the roof and the
// labels at its right.
const ROOF_WINDOW = { width: 1800, height: 900 };
const ROOF_MARGIN = { left: 60, top: 72, right: 140, bottom: 56 };

export const HOW_TOS: readonly HowTo[] = [
  {
    dir: "find/move-the-roof",
    window: ROOF_WINDOW,
    margin: ROOF_MARGIN,
    shots: [
      { name: "1", acts: [] },
      { name: "2", acts: [{ kind: "click", at: CLEAR }] },
      { name: "3", acts: [{ kind: "drag", from: CLEAR, by: { x: 30, y: 12 }, held: true }] },
      { name: "4", acts: [{ kind: "turn", degrees: 16, held: true }] },
    ],
  },
];

export function boxOf(points: readonly Point[]): Box {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
}

export function pointOf(box: Box, spot: Spot): Point {
  return { x: box.left + (box.right - box.left) * spot.across, y: box.top + (box.bottom - box.top) * spot.down };
}

export function clipAround(box: Box, margin: Margin): Clip {
  const x = Math.round(box.left - margin.left);
  const y = Math.round(box.top - margin.top);
  return { x, y, width: Math.round(box.right + margin.right) - x, height: Math.round(box.bottom + margin.bottom) - y };
}

/** The points a turn passes through: round *centre* from *from*, by *degrees* clockwise on the screen, in *steps*. */
export function arcFrom(centre: Point, from: Point, degrees: number, steps: number): Point[] {
  const radius = Math.hypot(from.x - centre.x, from.y - centre.y);
  const start = Math.atan2(from.y - centre.y, from.x - centre.x);
  return Array.from({ length: steps }, (_, index) => {
    const angle = start + ((degrees * Math.PI) / 180) * ((index + 1) / steps);
    return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
  });
}

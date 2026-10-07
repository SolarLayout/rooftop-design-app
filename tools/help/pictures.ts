// The pictures of the how-tos (D81): what each picture shows, as what the hand does on Find's map before it is taken, and
// what of the screen is kept. Pure; e2e/help-pictures takes them (`bun help:pictures`) into apps/web/public/help/<dir>/.
// A how-to's clips (Phase 15) are written here too, beside its pictures, and recorded by e2e/help-clips (`bun help:clips`).
import type { ClipSpec } from "./clips";

export type Point = { x: number; y: number };
/** The extent of the roof on the screen, in CSS pixels. */
export type Box = { left: number; top: number; right: number; bottom: number };
/** A part of the screen kept in a picture, as Playwright's screenshot takes it. */
export type Clip = { x: number; y: number; width: number; height: number };
export type Margin = { left: number; top: number; right: number; bottom: number };
export type Size = { width: number; height: number };

/** Where on the roof: fractions of its box, across from its left and down from its top. */
export type Spot = { across: number; down: number };
/** Where on the map: metres east and north of its middle, as the demo's place is when it is searched. */
export type Metres = { east: number; north: number };
/** A place written either way: a spot on the roof (the demo roof, opened by Edit), or metres from the map's middle. */
export type Place = Spot | Metres;

/**
 * What the hand does before a picture:
 * - `tool`: a tool of the toolbar chosen, by its name;
 * - `corner`: a press on the map, a corner placed (or the first pressed again, to close);
 * - `click`: a press inside the roof;
 * - `drag`: from a spot of the roof by so many pixels; `draw`: from one place of the map to another (a rectangle);
 * - `turn`: the handle of that name dragged round the roof's middle, clockwise on the screen;
 * - `found`: Detect building pressed at a place until its footprint is proposed;
 * - `press`: a button, by its name (Use this outline);
 * - `fill`: a field, by its label, given words (an obstacle's height), then left so that it takes them;
 * - `key`: a key pressed (Enter, to end a wall).
 * A turn goes round the roof's middle, or round the obstacle picked.
 * A drag, a draw or a turn that is held is caught before the button is let go; a held drag or turn is then taken back, so
 * the next picture begins from the roof as it was.
 */
export type Act =
  | { kind: "tool"; name: string }
  | { kind: "corner"; at: Place }
  | { kind: "click"; at: Spot }
  | { kind: "drag"; from: Spot; by: Point; held: boolean }
  | { kind: "draw"; from: Place; to: Place; held: boolean }
  | { kind: "turn"; handle: string; degrees: number; held: boolean; around?: "roof" | "obstacle" }
  | { kind: "found"; at: Metres }
  | { kind: "press"; name: string }
  | { kind: "fill"; label: string; text: string }
  | { kind: "key"; key: string };

/**
 * A picture: its name in the folder (its step's number), what the hand does after the picture before it, and, for a
 * dialog that opens in the middle of the screen, the dialog kept in place of the how-to's part.
 */
export type Shot = { name: string; acts: readonly Act[]; keep?: "dialog" };

/**
 * A how-to's pictures: its folder under public/help, the window they are taken in, how it begins (the demo roof opened
 * on Find by Edit, or the demo's place searched with nothing drawn), and what is kept: the roof with a margin round it,
 * or a part of a size round the map's middle (or round a place in metres from it).
 */
export type HowTo = {
  dir: string;
  window: Size;
  start: "edit" | "place";
  /** Steps of the map's Zoom in after it begins, for a thing too small at the roof's scale (a building to detect). */
  zoomIn?: number;
  keep: { around: "roof"; margin: Margin } | { around: "middle"; size: Size; at?: Metres };
  shots: readonly Shot[];
  /** Its clips, each named for the step it plays in (tools/help/clips.ts). */
  clips?: readonly ClipSpec[];
};

/** A clear spot inside the demo roof: away from its corners, its edges' labels and its obstacles. */
const CLEAR = { across: 0.17, down: 0.22 };
/** The demo roof's stair room: a press there picks it. */
const STAIR_ROOM = { across: 0.23, down: 0.5 };

// Wide enough that the demo roof stands clear of Find's panel; the margin keeps the handle above the roof and the
// labels at its right.
const WINDOW = { width: 1800, height: 900 };
const ROOF_MARGIN = { left: 60, top: 72, right: 140, bottom: 56 };
/** Round the demo's place: a roof of 90 by 40 m with its handle and labels, and the building west of it. */
const MIDDLE = { width: 520, height: 300 };

/** The demo's roof, 90 by 40 m about the place, its corners from the south-west. */
const SW = { east: -45, north: -20 };
const SE = { east: 45, north: -20 };
const NE = { east: 45, north: 20 };
const NW = { east: -45, north: 20 };
/** A large building of the footprints' fixture south-west of the demo's place, large enough to show its edges' labels. */
const A_BUILDING = { east: -10, north: -26.5 };

export const HOW_TOS: readonly HowTo[] = [
  {
    dir: "find/move-the-roof",
    window: WINDOW,
    start: "edit",
    keep: { around: "roof", margin: ROOF_MARGIN },
    shots: [
      { name: "1", acts: [] },
      { name: "2", acts: [{ kind: "click", at: CLEAR }] },
      { name: "3", acts: [{ kind: "drag", from: CLEAR, by: { x: 30, y: 12 }, held: true }] },
      { name: "4", acts: [{ kind: "turn", handle: "Turn the roof", degrees: 16, held: true }] },
    ],
    clips: [
      {
        name: "3",
        before: [{ kind: "click", at: CLEAR }],
        acts: [{ kind: "rest", seconds: 0.4 }, { kind: "drag", from: CLEAR, by: { x: 30, y: 12 }, back: true }, { kind: "rest", seconds: 0.6 }],
      },
      {
        // It picks the roof itself: a turn taken back to nothing lets the roof go, so the clip ends as it began.
        name: "4",
        before: [],
        acts: [{ kind: "rest", seconds: 0.4 }, { kind: "click", at: CLEAR }, { kind: "turn", handle: "Turn the roof", degrees: 16, back: true }, { kind: "rest", seconds: 0.6 }],
      },
    ],
  },
  {
    dir: "find/corners",
    window: WINDOW,
    start: "place",
    keep: { around: "middle", size: MIDDLE },
    shots: [
      { name: "1", acts: [{ kind: "corner", at: SW }, { kind: "corner", at: SE }, { kind: "corner", at: NE }] },
      { name: "2", acts: [{ kind: "corner", at: NW }] },
      { name: "3", acts: [{ kind: "corner", at: SW }] },
    ],
    clips: [
      {
        name: "2",
        before: [],
        acts: [
          { kind: "rest", seconds: 0.4 },
          { kind: "click", at: SW },
          { kind: "click", at: SE },
          { kind: "click", at: NE },
          { kind: "click", at: NW },
          { kind: "click", at: SW },
          { kind: "rest", seconds: 0.8 },
        ],
      },
    ],
  },
  {
    dir: "find/rectangle",
    window: WINDOW,
    start: "place",
    keep: { around: "middle", size: MIDDLE },
    shots: [
      { name: "1", acts: [{ kind: "tool", name: "Rectangle" }, { kind: "draw", from: NW, to: SE, held: true }] },
      { name: "2", acts: [{ kind: "turn", handle: "Turn the rectangle", degrees: 12, held: false }] },
    ],
    clips: [
      { name: "1", before: [{ kind: "tool", name: "Rectangle" }], acts: [{ kind: "rest", seconds: 0.4 }, { kind: "draw", from: NW, to: SE }, { kind: "rest", seconds: 0.8 }] },
      {
        name: "2",
        before: [{ kind: "tool", name: "Rectangle" }, { kind: "draw", from: NW, to: SE, held: false }],
        acts: [{ kind: "rest", seconds: 0.4 }, { kind: "turn", handle: "Turn the rectangle", degrees: 12, back: true }, { kind: "rest", seconds: 0.6 }],
      },
    ],
  },
  {
    dir: "find/detect",
    // Taller: the building and its callout stand above the toolbar.
    window: { width: 1800, height: 1100 },
    start: "place",
    zoomIn: 1,
    // Round the building and the callout that opens below it and to its right.
    keep: { around: "middle", size: { width: 560, height: 320 }, at: { east: 10.6, north: -32.5 } },
    shots: [
      { name: "1", acts: [{ kind: "tool", name: "Detect building" }] },
      { name: "2", acts: [{ kind: "found", at: A_BUILDING }] },
      { name: "3", acts: [{ kind: "press", name: "Use this outline" }] },
    ],
  },
  {
    dir: "find/box",
    window: WINDOW,
    start: "edit",
    keep: { around: "roof", margin: ROOF_MARGIN },
    shots: [
      { name: "1", acts: [{ kind: "tool", name: "Box" }, { kind: "draw", from: { across: 0.06, down: 0.12 }, to: { across: 0.18, down: 0.36 }, held: true }] },
      { name: "2", acts: [], keep: "dialog" },
      { name: "3", acts: [{ kind: "fill", label: "Height", text: "2.5" }, { kind: "press", name: "Add the box" }] },
    ],
  },
  {
    dir: "find/tank",
    window: WINDOW,
    start: "edit",
    keep: { around: "roof", margin: ROOF_MARGIN },
    shots: [
      { name: "1", acts: [{ kind: "tool", name: "Tank" }, { kind: "draw", from: { across: 0.12, down: 0.24 }, to: { across: 0.15, down: 0.24 }, held: true }] },
      { name: "2", acts: [{ kind: "fill", label: "Height", text: "2" }, { kind: "press", name: "Add the tank" }] },
    ],
  },
  {
    dir: "find/wall",
    window: WINDOW,
    start: "edit",
    keep: { around: "roof", margin: ROOF_MARGIN },
    shots: [
      {
        name: "1",
        acts: [
          { kind: "tool", name: "Wall" },
          { kind: "corner", at: { across: 0.2, down: 0.92 } },
          { kind: "corner", at: { across: 0.6, down: 0.92 } },
        ],
      },
      { name: "2", acts: [{ kind: "key", key: "Enter" }, { kind: "fill", label: "Height", text: "1.2" }, { kind: "press", name: "Add the wall" }] },
    ],
  },
  {
    dir: "find/building",
    window: WINDOW,
    start: "edit",
    // West of the roof, in the open: its label runs east, toward the roof, clear of Find's panel.
    keep: { around: "roof", margin: { left: 130, top: 72, right: 140, bottom: 56 } },
    shots: [
      {
        name: "1",
        acts: [
          { kind: "tool", name: "Building" },
          { kind: "corner", at: { across: -0.26, down: 0.15 } },
          { kind: "corner", at: { across: -0.08, down: 0.15 } },
          { kind: "corner", at: { across: -0.08, down: 0.8 } },
          { kind: "corner", at: { across: -0.26, down: 0.8 } },
        ],
      },
      { name: "2", acts: [{ kind: "corner", at: { across: -0.26, down: 0.15 } }, { kind: "fill", label: "Height", text: "9" }, { kind: "press", name: "Add the building" }] },
    ],
  },
  {
    dir: "find/move-an-obstacle",
    window: WINDOW,
    start: "edit",
    keep: { around: "roof", margin: ROOF_MARGIN },
    shots: [
      { name: "1", acts: [{ kind: "click", at: STAIR_ROOM }] },
      { name: "2", acts: [{ kind: "drag", from: STAIR_ROOM, by: { x: 24, y: -12 }, held: true }] },
      { name: "3", acts: [{ kind: "turn", handle: "Turn the obstacle", degrees: 25, held: true, around: "obstacle" }] },
    ],
    clips: [
      {
        name: "2",
        before: [{ kind: "click", at: STAIR_ROOM }],
        acts: [{ kind: "rest", seconds: 0.4 }, { kind: "drag", from: STAIR_ROOM, by: { x: 24, y: -12 }, back: true }, { kind: "rest", seconds: 0.6 }],
      },
      {
        // It picks the obstacle itself and leaves it turned: a turn taken back to nothing is taken for a press where the
        // handle is, inside the roof, which picks the roof.
        name: "3",
        before: [],
        acts: [
          { kind: "rest", seconds: 0.4 },
          { kind: "click", at: STAIR_ROOM },
          { kind: "turn", handle: "Turn the obstacle", degrees: 25, back: false, around: "obstacle" },
          { kind: "rest", seconds: 0.8 },
        ],
      },
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

/** A place written either way, on the screen: a spot on the roof's box, or metres from the map's middle. */
export function placeOnScreen(place: Place, box: Box | null, map: { middle: Point; pixelsPerMetre: number }): Point {
  if ("across" in place) {
    if (!box) throw new Error("A spot on the roof was asked for, and there is no roof on the map.");
    return pointOf(box, place);
  }
  return screenOf(map.middle, map.pixelsPerMetre, place);
}

/** A place in metres on the screen: east is right, north is up, at so many pixels a metre. */
export function screenOf(middle: Point, pixelsPerMetre: number, at: Metres): Point {
  return { x: middle.x + at.east * pixelsPerMetre, y: middle.y - at.north * pixelsPerMetre };
}

export function clipAround(box: Box, margin: Margin): Clip {
  const x = Math.round(box.left - margin.left);
  const y = Math.round(box.top - margin.top);
  return { x, y, width: Math.round(box.right + margin.right) - x, height: Math.round(box.bottom + margin.bottom) - y };
}

/** A part of the screen of a size, round a point. */
export function clipAt(middle: Point, size: Size): Clip {
  return { x: Math.round(middle.x - size.width / 2), y: Math.round(middle.y - size.height / 2), width: size.width, height: size.height };
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

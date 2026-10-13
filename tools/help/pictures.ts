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
/** A place written either way: a spot on the roof (the demo's roof, outlined on Find), or metres from the map's middle. */
export type Place = Spot | Metres;

/**
 * What the hand does before a picture:
 * - `tool`: a tool of the toolbar chosen, by its name;
 * - `corner`: a press on the map, a corner placed (or the first pressed again, to close);
 * - `click`: a press inside the roof;
 * - `drag`: from a spot of the roof by so many pixels; `draw`: from one place of the map to another (a rectangle);
 * - `turn`: the handle of that name dragged round the roof's middle, clockwise on the screen;
 * - `found`: Detect building pressed at a place until its footprint is proposed;
 * - `press`: a button, by its name (Add, Close);
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
 * A picture: its name in the folder (the number of the step it shows; a step without a picture is skipped), and what the
 * hand does after the picture before it.
 */
export type Shot = { name: string; acts: readonly Act[] };

/**
 * A how-to's pictures: its folder under public/help, the window they are taken in, how it begins (`place`: Find fresh at
 * the demo's place, nothing drawn; `demo`: the same, then the demo's roof outlined by the hand and its obstacles drawn,
 * DEMO_ACTS), and what is kept: the roof with a margin round it, a part of a size round a spot of the roof (an obstacle,
 * closer in), or a part of a size round the map's middle (or round a place in metres from it).
 */
export type HowTo = {
  dir: string;
  window: Size;
  start: "demo" | "place";
  /** Steps of the map's Zoom in after it begins, for a thing too small at the roof's scale (a building to detect). */
  zoomIn?: number;
  keep: { around: "roof"; margin: Margin } | { around: "spot"; at: Spot; size: Size } | { around: "middle"; size: Size; at?: Metres };
  shots: readonly Shot[];
  /** Its clips, each named for the step it plays in (tools/help/clips.ts). */
  clips?: readonly ClipSpec[];
};

/** A clear spot inside the demo roof: away from its corners, its edges' labels and its obstacles. */
const CLEAR = { across: 0.17, down: 0.22 };
/** The middle of the demo roof's stair room, between its corners' handles: a press there picks it, a drag from it moves it. */
const STAIR_ROOM = { across: 0.251, down: 0.555 };

// Wide enough that the demo roof stands clear of Find's column; the margin keeps the handle above the roof and the
// obstacles' labels at its right (the AC units', which reach past its edge).
const WINDOW = { width: 1800, height: 900 };
const ROOF_MARGIN = { left: 60, top: 72, right: 175, bottom: 56 };
/** Round the demo's place: a roof of 90 by 40 m with its handle and labels, and the building west of it. */
const MIDDLE = { width: 520, height: 300 };

/** The demo's roof, 90 by 40 m about the place, its corners from the south-west. */
const SW = { east: -45, north: -20 };
const SE = { east: 45, north: -20 };
const NE = { east: 45, north: 20 };
const NW = { east: -45, north: 20 };
/** A large building of the footprints' fixture south-west of the demo's place, large enough to show its edges' labels: pressed near its
 * south-east corner, so that the note, below and to the right of the press, leaves its corners and lengths in sight. */
const A_BUILDING = { east: -5.4, north: -30.9 };

/** An obstacle of the demo, about the demo's place: a box by its middle and its sides, a tank by its middle and diameter. */
export type DemoObstacle =
  | { kind: "box"; east: number; north: number; length: number; width: number; height: number }
  | { kind: "tank"; east: number; north: number; diameter: number; height: number };

/**
 * The demo's obstacles (apps/api/src/rooftop_core/demo.py), moved from its roof's south-west corner to its middle, where
 * the demo's place is: the stair room, the water tank, the four AC units. Drawn on Find they take the names of their kind
 * (Box 1, Tank 1, Box 2 to 5): Find names what is drawn, the Studio renames it.
 */
export const DEMO_OBSTACLES: readonly DemoObstacle[] = [
  { kind: "box", east: -22.5, north: -2, length: 5, width: 4, height: 3 },
  { kind: "tank", east: 17, north: 4, diameter: 2.5, height: 2 },
  ...[0, 1, 2, 3].map((n): DemoObstacle => ({ kind: "box", east: 25.75 + 3 * n, north: -16.5, length: 1.5, width: 1, height: 1.2 })),
];

/** The height card's field (Find's HeightDialog). */
const HEIGHT_FIELD = "Height above the roof";

/**
 * The hand drawing an obstacle and giving its height: a box from its south-east corner to its north-west (a press is
 * taken away from the obstacle drawn before it, which stays picked), a tank from its middle out to its east edge.
 */
export function actsOfObstacle(obstacle: DemoObstacle): Act[] {
  const { east, north } = obstacle;
  const draw: Act =
    obstacle.kind === "box"
      ? { kind: "draw", from: { east: east + obstacle.length / 2, north: north - obstacle.width / 2 }, to: { east: east - obstacle.length / 2, north: north + obstacle.width / 2 }, held: false }
      : { kind: "draw", from: { east, north }, to: { east: east + obstacle.diameter / 2, north }, held: false };
  return [{ kind: "tool", name: obstacle.kind === "box" ? "Box" : "Tank" }, draw, { kind: "fill", label: HEIGHT_FIELD, text: String(obstacle.height) }, { kind: "press", name: "Add" }];
}

/** South of the demo roof, on the open ground: a press there lets go of what is picked. */
const SOUTH_OF_THE_ROOF = { east: 0, north: -32 };

/**
 * The start `demo` (issue 238, item 6: Find is for a new roof, so no design's roof is opened on it): from Find at the
 * demo's place, its roof outlined by its four corners and closed on the first, its south and east edges typed to the
 * demo's lengths, its obstacles drawn with their heights,
 * then nothing picked and the box in hand, as Find leaves a closed roof.
 */
export const DEMO_ACTS: readonly Act[] = [
  ...[SW, SE, NE, NW, SW].map((at): Act => ({ kind: "corner", at })),
  // The scale bar's width is in whole pixels: the corners land within a few tenths of a metre, and the edges typed make
  // the roof the demo's to the tenth. Edges is closed again, as a new device has it.
  { kind: "press", name: "Edges" },
  { kind: "fill", label: "South", text: "90" },
  { kind: "fill", label: "East", text: "40" },
  { kind: "press", name: "Edges" },
  ...DEMO_OBSTACLES.flatMap(actsOfObstacle),
  { kind: "tool", name: "Box" },
  { kind: "corner", at: SOUTH_OF_THE_ROOF },
];

export const HOW_TOS: readonly HowTo[] = [
  {
    dir: "find/move-the-roof",
    window: WINDOW,
    start: "demo",
    // Wider and taller than the others: the roof dragged east and turned takes the AC units' shared label further right and down.
    keep: { around: "roof", margin: { ...ROOF_MARGIN, right: 205, bottom: 92 } },
    shots: [
      { name: "1", acts: [] },
      { name: "2", acts: [{ kind: "click", at: CLEAR }, { kind: "drag", from: CLEAR, by: { x: 30, y: 12 }, held: true }] },
      { name: "3", acts: [{ kind: "turn", handle: "Turn the roof", degrees: 16, held: true }] },
    ],
    clips: [
      {
        name: "2",
        before: [{ kind: "click", at: CLEAR }],
        acts: [{ kind: "rest", seconds: 0.4 }, { kind: "drag", from: CLEAR, by: { x: 30, y: 12 }, back: true }, { kind: "rest", seconds: 0.6 }],
      },
      {
        // It picks the roof itself: a turn taken back to nothing lets the roof go, so the clip ends as it began.
        name: "3",
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
    keep: { around: "middle", size: { width: 560, height: 360 }, at: { east: 10.6, north: -35.3 } },
    shots: [
      { name: "1", acts: [{ kind: "tool", name: "Detect building" }] },
      { name: "2", acts: [{ kind: "found", at: A_BUILDING }] },
      // The footprint is the outline from the press: the note's Undo would take it back, its Close keeps it.
      { name: "3", acts: [{ kind: "press", name: "Close" }] },
    ],
  },
  {
    dir: "find/box",
    window: WINDOW,
    start: "demo",
    keep: { around: "roof", margin: ROOF_MARGIN },
    shots: [
      { name: "1", acts: [{ kind: "tool", name: "Box" }, { kind: "draw", from: { across: 0.25, down: 0.12 }, to: { across: 0.37, down: 0.36 }, held: true }] },
      // Let go, the box asks its height in a card beside it: the height typed, Add ready.
      { name: "2", acts: [{ kind: "fill", label: "Height above the roof", text: "2.5" }] },
      { name: "3", acts: [{ kind: "press", name: "Add" }] },
    ],
  },
  {
    dir: "find/tank",
    window: WINDOW,
    start: "demo",
    keep: { around: "roof", margin: ROOF_MARGIN },
    shots: [
      { name: "1", acts: [{ kind: "tool", name: "Tank" }, { kind: "draw", from: { across: 0.12, down: 0.24 }, to: { across: 0.15, down: 0.24 }, held: true }] },
      { name: "2", acts: [{ kind: "fill", label: "Height above the roof", text: "2" }, { kind: "press", name: "Add" }] },
    ],
  },
  {
    dir: "find/tree",
    window: WINDOW,
    start: "demo",
    keep: { around: "roof", margin: ROOF_MARGIN },
    shots: [
      // In the roof's south-west, clear of the stair room, the edges' lengths and the tank's picture.
      { name: "1", acts: [{ kind: "tool", name: "Tree" }, { kind: "draw", from: { across: 0.11, down: 0.8 }, to: { across: 0.175, down: 0.8 }, held: true }] },
      { name: "2", acts: [{ kind: "fill", label: "Height above the roof", text: "6" }, { kind: "press", name: "Add" }] },
    ],
  },
  {
    dir: "find/wall",
    window: WINDOW,
    start: "demo",
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
      // Step 2, the last point clicked again, has no picture.
      { name: "3", acts: [{ kind: "key", key: "Enter" }, { kind: "fill", label: "Height above the roof", text: "1.2" }, { kind: "press", name: "Add" }] },
    ],
  },
  {
    dir: "find/building",
    window: WINDOW,
    start: "demo",
    // West of the roof, in the open, and high enough that its label runs east, toward the roof, over the west edge's length.
    keep: { around: "roof", margin: { ...ROOF_MARGIN, left: 130 } },
    shots: [
      {
        name: "1",
        acts: [
          { kind: "tool", name: "Building" },
          { kind: "corner", at: { across: -0.32, down: 0.05 } },
          { kind: "corner", at: { across: -0.14, down: 0.05 } },
          { kind: "corner", at: { across: -0.14, down: 0.6 } },
          { kind: "corner", at: { across: -0.32, down: 0.6 } },
        ],
      },
      // Step 2, the first corner clicked again, has no picture.
      { name: "3", acts: [{ kind: "corner", at: { across: -0.32, down: 0.05 } }, { kind: "fill", label: "Height above the roof", text: "9" }, { kind: "press", name: "Add" }] },
    ],
  },
  {
    dir: "find/move-an-obstacle",
    window: WINDOW,
    start: "demo",
    // Close in, so that the stair room is larger than its corners' handles and a drag from inside it moves it.
    zoomIn: 1,
    // Round the stair room, its handle above it and the label of its turn at its right.
    keep: { around: "spot", at: { across: 0.405, down: 0.5 }, size: { width: 600, height: 300 } },
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

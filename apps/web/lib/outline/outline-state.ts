// The outline as it is drawn: corners in metres in a flat frame around the place of the first corner,
// closed or not, one corner selected, and the history of it. A reducer: every rule of drawing is here
// and tested without a browser; the map and the panel draw what it holds.
import { CLOSE_WITHIN, CLOSE_WITHIN_TOUCH, SNAP_DEGREES } from "../../components/ui/design-numbers";
import { frameAt, type Frame, type LonLat } from "./frame";
import { canRedo, canUndo, historyOf, redone, undone, withNext, type History } from "./history";
import { areaOf, bearingOf, centroidOf, compassOf, edgesOf, facingOf, isClockwise, type Facing, type XY } from "./measure";
import { nudged, nudgeOfKey } from "./nudge";
import { boxOf as obstacleBoxOf, boxWithCorner, FEWEST_POINTS, nameOf, tankOf, type Obstacle, type ObstacleKind, type Shape } from "./obstacles";
import { rectangleOf, turnedAbout, turnOfHandle } from "./rectangle";
import { closesOnFirst, snappedCorner } from "./snap";
import { isRectangle, withEdgeLength } from "./typed-length";

/** A box drawn with the rectangle tool: its four corners before the turn, and the turn. */
export type Box = { base: readonly XY[]; turn: number };

/** What the history keeps: the corners, whether they are closed, the box they came from, and the obstacles. */
export type Drawn = { corners: readonly XY[]; closed: boolean; rectangle: Box | null; obstacles: readonly Obstacle[] };

export type OutlineState = {
  /** The frame of metres, made where the first corner was placed; null before it. */
  frame: Frame | null;
  corners: readonly XY[];
  closed: boolean;
  /** The corner being edited: the last placed, the one dragged, the one chosen in the list. */
  selected: number | null;
  /** "Square the corners": right angles are snapped to. */
  squared: boolean;
  /** The box the corners are, while they are one: it can be turned by its handle. Null for any other outline. */
  rectangle: Box | null;
  /** The obstacles on the roof, each with its height. */
  obstacles: readonly Obstacle[];
  /** The obstacle being drawn: a box or a tank while it is dragged, a wall or a building point by point. */
  drawing: Shape | null;
  /** A shape that is done and awaits its height; nothing else is drawn until it has one or is discarded. */
  pending: Shape | null;
  /** The id of the selected obstacle: its corners drag, Delete removes it. */
  selectedObstacle: number | null;
  /** The id the next obstacle gets. */
  nextId: number;
  history: History<Drawn>;
};

export type OutlineEvent =
  | { type: "began"; at: LonLat }
  | { type: "placed"; at: XY; metresPerPx: number; touch: boolean }
  | { type: "close" }
  | { type: "cornerMoved"; index: number; at: XY }
  | { type: "cornerDropped" }
  | { type: "midpointTaken"; edge: number; at: XY }
  | { type: "selected"; index: number | null }
  | { type: "nudged"; key: string; shift: boolean }
  | { type: "removed" }
  | { type: "steppedBack" }
  | { type: "undone" }
  | { type: "redone" }
  | { type: "cleared" }
  | { type: "edgeLength"; edge: number; length: number }
  | { type: "squared"; squared: boolean }
  | { type: "boxDragged"; from: XY; to: XY }
  | { type: "boxDropped" }
  | { type: "boxTurned"; handle: XY }
  | { type: "turnDropped" }
  | { type: "footprintTaken"; corners: readonly XY[] }
  | { type: "loaded"; at: LonLat; corners: readonly XY[]; obstacles?: readonly Obstacle[] }
  | { type: "shapeDragged"; kind: "box" | "cylinder"; from: XY; to: XY }
  | { type: "shapeDropped" }
  | { type: "shapePlaced"; kind: "wall" | "building"; at: XY; metresPerPx: number; touch: boolean }
  | { type: "heightGiven"; height: number; name: string }
  | { type: "pendingDiscarded" }
  | { type: "obstacleSelected"; id: number | null }
  | { type: "obstacleCornerMoved"; id: number; index: number; at: XY }
  | { type: "obstacleCornerDropped" }
  | { type: "obstacleRemoved"; id: number };

export type Measurements = {
  edges: number[];
  /** Square metres once the outline is closed; null before. */
  area: number | null;
  facing: Facing | null;
  corners: number;
};

const NOTHING: Drawn = { corners: [], closed: false, rectangle: null, obstacles: [] };
const FEWEST_CORNERS = 3;

/**
 * Four corners whose angles are all within the snap of a right angle, made an exact rectangle when they
 * are closed with the corners squared: the first edge is kept, the others are set square to it.
 */
function squaredUp(corners: readonly XY[], squared: boolean): readonly XY[] {
  if (!squared || corners.length !== 4) return corners;
  const within = Math.sin((SNAP_DEGREES * Math.PI) / 180);
  const isSquare = corners.every((corner, index) => {
    const before = corners[(index + 3) % 4];
    const after = corners[(index + 1) % 4];
    const a = Math.hypot(before.x - corner.x, before.y - corner.y);
    const b = Math.hypot(after.x - corner.x, after.y - corner.y);
    const cosine = ((before.x - corner.x) * (after.x - corner.x) + (before.y - corner.y) * (after.y - corner.y)) / (a * b);
    return a > 0 && b > 0 && Math.abs(cosine) <= within;
  });
  if (!isSquare) return corners;
  const [c0, c1, c2] = corners;
  const length = Math.hypot(c1.x - c0.x, c1.y - c0.y);
  const along = { x: (c1.x - c0.x) / length, y: (c1.y - c0.y) / length };
  const across = { x: -along.y, y: along.x };
  const depth = (c2.x - c1.x) * across.x + (c2.y - c1.y) * across.y;
  const rounded = (value: number) => Math.round(value * 1e6) / 1e6;
  return [
    c0,
    c1,
    { x: rounded(c1.x + depth * across.x), y: rounded(c1.y + depth * across.y) },
    { x: rounded(c0.x + depth * across.x), y: rounded(c0.y + depth * across.y) },
  ];
}

export const START: OutlineState = {
  frame: null,
  corners: [],
  closed: false,
  selected: null,
  squared: true,
  rectangle: null,
  obstacles: [],
  drawing: null,
  pending: null,
  selectedObstacle: null,
  nextId: 1,
  history: historyOf(NOTHING),
};

const drawnOf = (state: OutlineState): Drawn => ({ corners: state.corners, closed: state.closed, rectangle: state.rectangle, obstacles: state.obstacles });

/** A new state of drawing, as one step of the history. The obstacles stay as they are unless given. */
function stepped(state: OutlineState, drawn: Omit<Drawn, "obstacles"> & { obstacles?: readonly Obstacle[] }, selected: number | null): OutlineState {
  const next: Drawn = { obstacles: state.obstacles, ...drawn };
  return { ...state, ...next, selected, selectedObstacle: drawn.obstacles ? state.selectedObstacle : null, history: withNext(state.history, next) };
}

/** A new set of obstacles, as one step of the history, with one of them selected. */
function withObstacles(state: OutlineState, obstacles: readonly Obstacle[], selectedObstacle: number | null): OutlineState {
  const next: Drawn = { ...drawnOf(state), obstacles };
  return { ...state, obstacles, selected: null, selectedObstacle, history: withNext(state.history, next) };
}

/** Whether an obstacle can be drawn now: on a closed roof, while none awaits its height. */
const canDraw = (state: OutlineState) => state.closed && state.pending === null;

/** The shape being drawn of the kind, or a new one. */
function drawingOf(state: OutlineState, kind: ObstacleKind): Shape {
  return state.drawing?.kind === kind ? state.drawing : { kind, points: [], diameter: null };
}

/** The shape being drawn is done: it awaits its height. */
const done = (state: OutlineState, shape: Shape): OutlineState => ({ ...state, drawing: null, pending: shape, selectedObstacle: null });

/** A state that follows, but is not a step of its own: while a corner is dragged. The box is a polygon after it. */
function moved(state: OutlineState, corners: readonly XY[], selected: number | null): OutlineState {
  return { ...state, corners, selected, rectangle: null };
}

/** The box whose corners these are, turned as before: what a typed length leaves of it. */
function boxOf(corners: readonly XY[], rectangle: Box | null): Box | null {
  if (!rectangle) return null;
  return { base: turnedAbout(corners, centroidOf(corners), -rectangle.turn), turn: rectangle.turn };
}

function edgesDrawn(corners: readonly XY[], closed: boolean): [XY, XY][] {
  const count = closed ? corners.length : corners.length - 1;
  return Array.from({ length: Math.max(0, count) }, (_, n) => [corners[n], corners[(n + 1) % corners.length]]);
}

/** A corner at `at`, snapped against its neighbours `before` and `after` and the other edges. */
function snappedAgainst(state: OutlineState, at: XY, before: XY | null, beforeThat: XY | null, without: readonly number[]): XY {
  const edges = edgesDrawn(state.corners, state.closed).filter((_, n) => !without.includes(n));
  return snappedCorner({ candidate: at, previous: before, before: beforeThat, edges, within: SNAP_DEGREES, squared: state.squared }).corner;
}

export function outlineAfter(state: OutlineState, event: OutlineEvent): OutlineState {
  switch (event.type) {
    case "began":
      return state.frame ? state : { ...state, frame: frameAt(event.at) };

    case "placed": {
      if (state.closed) return state;
      const { corners } = state;
      const first = corners[0];
      if (first && corners.length >= FEWEST_CORNERS && closesOnFirst(first, event.at, event.touch ? CLOSE_WITHIN_TOUCH : CLOSE_WITHIN, event.metresPerPx)) {
        return stepped(state, { corners: squaredUp(corners, state.squared), closed: true, rectangle: null }, null);
      }
      const previous = corners[corners.length - 1] ?? null;
      const beforeThat = corners[corners.length - 2] ?? null;
      const corner = snappedAgainst(state, event.at, previous, beforeThat, []);
      return stepped(state, { corners: [...corners, corner], closed: false, rectangle: null }, corners.length);
    }

    case "close": {
      const { drawing } = state;
      if (drawing) return drawing.points.length >= FEWEST_POINTS[drawing.kind] ? done(state, drawing) : state;
      if (state.closed || state.corners.length < FEWEST_CORNERS) return state;
      return stepped(state, { corners: squaredUp(state.corners, state.squared), closed: true, rectangle: null }, null);
    }

    case "cornerMoved": {
      const { corners } = state;
      if (event.index < 0 || event.index >= corners.length) return state;
      const n = corners.length;
      const before = n > 1 ? corners[(event.index + n - 1) % n] : null;
      const beforeThat = n > 2 ? corners[(event.index + n - 2) % n] : null;
      const at = snappedAgainst(state, event.at, state.closed || event.index > 0 ? before : null, state.closed || event.index > 1 ? beforeThat : null, [
        (event.index + n - 1) % n,
        event.index,
      ]);
      return moved(state, corners.map((corner, index) => (index === event.index ? at : corner)), event.index);
    }

    case "cornerDropped":
      return { ...state, history: withNext(state.history, drawnOf(state)) };

    case "midpointTaken": {
      const { corners } = state;
      const count = edgesDrawn(corners, state.closed).length;
      if (event.edge < 0 || event.edge >= count) return state;
      const added = [...corners.slice(0, event.edge + 1), event.at, ...corners.slice(event.edge + 1)];
      return stepped(state, { corners: added, closed: state.closed, rectangle: null }, event.edge + 1);
    }

    case "selected":
      return { ...state, selected: event.index, selectedObstacle: null };

    case "nudged": {
      const nudge = nudgeOfKey(event.key, event.shift);
      if (!nudge || state.selected === null) return state;
      return stepped(state, { corners: nudged(state.corners, state.selected, nudge), closed: state.closed, rectangle: null }, state.selected);
    }

    case "removed": {
      if (state.selectedObstacle !== null) return withObstacles(state, state.obstacles.filter((obstacle) => obstacle.id !== state.selectedObstacle), null);
      if (state.selected === null || state.corners.length <= FEWEST_CORNERS) return state;
      const corners = state.corners.filter((_, index) => index !== state.selected);
      return stepped(state, { corners, closed: state.closed, rectangle: null }, null);
    }

    case "steppedBack": {
      const { drawing } = state;
      if (drawing) return { ...state, drawing: drawing.points.length > 1 ? { ...drawing, points: drawing.points.slice(0, -1) } : null };
      if (state.closed || state.corners.length === 0) return state;
      return stepped(state, { corners: state.corners.slice(0, -1), closed: false, rectangle: null }, state.corners.length - 2 >= 0 ? state.corners.length - 2 : null);
    }

    case "undone": {
      if (!canUndo(state.history)) return state;
      const history = undone(state.history);
      return { ...state, ...history.present, selected: null, selectedObstacle: null, drawing: null, history };
    }

    case "redone": {
      if (!canRedo(state.history)) return state;
      const history = redone(state.history);
      return { ...state, ...history.present, selected: null, selectedObstacle: null, drawing: null, history };
    }

    case "cleared":
      if (state.corners.length === 0 && state.obstacles.length === 0) return state;
      return { ...stepped(state, NOTHING, null), drawing: null, pending: null };

    case "edgeLength": {
      const corners = withEdgeLength(state.corners, event.edge, event.length, state.squared);
      if (corners === state.corners) return state;
      return stepped(state, { corners, closed: state.closed, rectangle: boxOf(corners, state.rectangle) }, state.selected);
    }

    case "squared":
      return { ...state, squared: event.squared };

    case "boxDragged": {
      const base = rectangleOf(event.from, event.to);
      if (!base) return { ...state, corners: [], closed: false, rectangle: null, selected: null };
      return { ...state, corners: base, closed: true, rectangle: { base, turn: 0 }, selected: null };
    }

    case "boxDropped":
      if (!state.rectangle) return state;
      return stepped(state, drawnOf(state), null);

    case "boxTurned": {
      if (!state.rectangle) return state;
      const { base } = state.rectangle;
      const centre = centroidOf(base);
      const turn = turnOfHandle(centre, event.handle, SNAP_DEGREES);
      return { ...state, corners: turnedAbout(base, centre, turn), rectangle: { base, turn }, selected: null };
    }

    case "turnDropped":
      if (!state.rectangle) return state;
      return stepped(state, drawnOf(state), null);

    case "footprintTaken":
      if (event.corners.length < FEWEST_CORNERS) return state;
      return stepped(state, { corners: event.corners, closed: true, rectangle: null }, null);

    case "loaded": {
      if (event.corners.length < FEWEST_CORNERS) return state;
      const obstacles = event.obstacles ?? [];
      const drawn: Drawn = { corners: event.corners, closed: true, rectangle: null, obstacles };
      return { ...START, frame: frameAt(event.at), ...drawn, squared: state.squared, nextId: Math.max(0, ...obstacles.map((obstacle) => obstacle.id)) + 1, history: historyOf(drawn) };
    }

    case "shapeDragged": {
      if (!canDraw(state)) return state;
      const shape: Shape | null = event.kind === "box" ? boxed(obstacleBoxOf(event.from, event.to)) : tankOf(event.from, event.to);
      return { ...state, drawing: shape, selectedObstacle: null };
    }

    case "shapeDropped":
      return state.drawing ? done(state, state.drawing) : state;

    case "shapePlaced": {
      if (!canDraw(state)) return state;
      const drawing = drawingOf(state, event.kind);
      const { points } = drawing;
      const within = event.touch ? CLOSE_WITHIN_TOUCH : CLOSE_WITHIN;
      const endsOn = event.kind === "wall" ? points[points.length - 1] : points[0];
      if (endsOn && points.length >= FEWEST_POINTS[event.kind] && closesOnFirst(endsOn, event.at, within, event.metresPerPx)) return done(state, drawing);
      return { ...state, drawing: { ...drawing, points: [...points, event.at] }, selectedObstacle: null };
    }

    case "heightGiven": {
      const { pending } = state;
      if (!pending) return state;
      const obstacle: Obstacle = { ...pending, id: state.nextId, name: event.name.trim() || nameOf(pending.kind, state.obstacles), height: event.height };
      return { ...withObstacles(state, [...state.obstacles, obstacle], obstacle.id), pending: null, nextId: state.nextId + 1 };
    }

    case "pendingDiscarded":
      return state.pending ? { ...state, pending: null } : state;

    case "obstacleSelected":
      return { ...state, selectedObstacle: event.id, selected: null };

    case "obstacleCornerMoved": {
      const obstacles = state.obstacles.map((obstacle) => (obstacle.id === event.id ? withCornerAt(obstacle, event.index, event.at) : obstacle));
      return { ...state, obstacles, selected: null, selectedObstacle: event.id };
    }

    case "obstacleCornerDropped":
      return { ...state, history: withNext(state.history, drawnOf(state)) };

    case "obstacleRemoved":
      return withObstacles(state, state.obstacles.filter((obstacle) => obstacle.id !== event.id), null);
  }
}

const boxed = (points: XY[] | null): Shape | null => (points ? { kind: "box", points, diameter: null } : null);

/** An obstacle with corner `index` at `at`: a box stays a rectangle, a tank's one handle sets its diameter, a wall or a building bends. */
function withCornerAt(obstacle: Obstacle, index: number, at: XY): Obstacle {
  if (obstacle.kind === "box") return { ...obstacle, points: boxWithCorner(obstacle.points, index, at) };
  if (obstacle.kind === "cylinder") {
    const [centre] = obstacle.points;
    const diameter = 2 * Math.hypot(at.x - centre.x, at.y - centre.y);
    return diameter > 0 ? { ...obstacle, diameter } : obstacle;
  }
  if (index < 0 || index >= obstacle.points.length) return obstacle;
  return { ...obstacle, points: obstacle.points.map((point, n) => (n === index ? at : point)) };
}

/** What the panel shows of the outline. */
export function measurementsOf(state: OutlineState, hemisphere: "north" | "south" = "north"): Measurements {
  return {
    edges: state.closed ? edgesOf(state.corners) : edgesDrawn(state.corners, false).map(([a, b]) => Math.hypot(b.x - a.x, b.y - a.y)),
    area: state.closed ? areaOf(state.corners) : null,
    facing: state.closed ? facingOf(state.corners, hemisphere) : null,
    corners: state.corners.length,
  };
}

const SIDE: Record<string, string> = { N: "North", NE: "North-east", E: "East", SE: "South-east", S: "South", SW: "South-west", W: "West", NW: "North-west" };

/** The names of the edges: the side a rectangle's edge is on; the number of any other edge. */
export function edgeNamesOf(state: OutlineState): string[] {
  const { corners, closed } = state;
  const count = edgesDrawn(corners, closed).length;
  if (!(closed && isRectangle(corners))) return Array.from({ length: count }, (_, n) => `Edge ${n + 1}`);
  const clockwise = isClockwise(corners);
  return corners.map((a, n) => {
    const b = corners[(n + 1) % corners.length];
    const along = { x: b.x - a.x, y: b.y - a.y };
    const outward = clockwise ? { x: -along.y, y: along.x } : { x: along.y, y: -along.x };
    return SIDE[compassOf(bearingOf(outward.x, outward.y))] ?? `Edge ${n + 1}`;
  });
}

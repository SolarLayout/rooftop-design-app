// The outline as it is drawn: corners in metres in a flat frame around the place of the first corner,
// closed or not, one corner selected, and the history of it. A reducer: every rule of drawing is here
// and tested without a browser; the map and the panel draw what it holds.
import { CLOSE_WITHIN, CLOSE_WITHIN_TOUCH, SNAP_DEGREES } from "../../components/ui/design-numbers";
import { frameAt, type Frame, type LonLat } from "./frame";
import { canRedo, canUndo, historyOf, redone, undone, withNext, type History } from "./history";
import { areaOf, bearingOf, compassOf, edgesOf, facingOf, isClockwise, type Facing, type XY } from "./measure";
import { nudged, nudgeOfKey } from "./nudge";
import { closesOnFirst, snappedCorner } from "./snap";
import { isRectangle, withEdgeLength } from "./typed-length";

/** What the history keeps: the corners and whether they are closed. */
export type Drawn = { corners: readonly XY[]; closed: boolean };

export type OutlineState = {
  /** The frame of metres, made where the first corner was placed; null before it. */
  frame: Frame | null;
  corners: readonly XY[];
  closed: boolean;
  /** The corner being edited: the last placed, the one dragged, the one chosen in the list. */
  selected: number | null;
  /** "Square the corners": right angles are snapped to. */
  squared: boolean;
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
  | { type: "squared"; squared: boolean };

export type Measurements = {
  edges: number[];
  /** Square metres once the outline is closed; null before. */
  area: number | null;
  facing: Facing | null;
  corners: number;
};

const NOTHING: Drawn = { corners: [], closed: false };
const FEWEST_CORNERS = 3;

export const START: OutlineState = { frame: null, corners: [], closed: false, selected: null, squared: true, history: historyOf(NOTHING) };

const drawnOf = (state: OutlineState): Drawn => ({ corners: state.corners, closed: state.closed });

/** A new state of drawing, as one step of the history. */
function stepped(state: OutlineState, drawn: Drawn, selected: number | null): OutlineState {
  return { ...state, ...drawn, selected, history: withNext(state.history, drawn) };
}

/** A state that follows, but is not a step of its own: while a corner is dragged. */
function moved(state: OutlineState, corners: readonly XY[], selected: number | null): OutlineState {
  return { ...state, corners, selected };
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
        return stepped(state, { corners, closed: true }, null);
      }
      const previous = corners[corners.length - 1] ?? null;
      const beforeThat = corners[corners.length - 2] ?? null;
      const corner = snappedAgainst(state, event.at, previous, beforeThat, []);
      return stepped(state, { corners: [...corners, corner], closed: false }, corners.length);
    }

    case "close":
      if (state.closed || state.corners.length < FEWEST_CORNERS) return state;
      return stepped(state, { corners: state.corners, closed: true }, null);

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
      return stepped(state, { corners: added, closed: state.closed }, event.edge + 1);
    }

    case "selected":
      return { ...state, selected: event.index };

    case "nudged": {
      const nudge = nudgeOfKey(event.key, event.shift);
      if (!nudge || state.selected === null) return state;
      return stepped(state, { corners: nudged(state.corners, state.selected, nudge), closed: state.closed }, state.selected);
    }

    case "removed": {
      if (state.selected === null || state.corners.length <= FEWEST_CORNERS) return state;
      const corners = state.corners.filter((_, index) => index !== state.selected);
      return stepped(state, { corners, closed: state.closed }, null);
    }

    case "steppedBack":
      if (state.closed || state.corners.length === 0) return state;
      return stepped(state, { corners: state.corners.slice(0, -1), closed: false }, state.corners.length - 2 >= 0 ? state.corners.length - 2 : null);

    case "undone": {
      if (!canUndo(state.history)) return state;
      const history = undone(state.history);
      return { ...state, ...history.present, selected: null, history };
    }

    case "redone": {
      if (!canRedo(state.history)) return state;
      const history = redone(state.history);
      return { ...state, ...history.present, selected: null, history };
    }

    case "cleared":
      if (state.corners.length === 0) return state;
      return stepped(state, NOTHING, null);

    case "edgeLength": {
      const corners = withEdgeLength(state.corners, event.edge, event.length, state.squared);
      if (corners === state.corners) return state;
      return stepped(state, { corners, closed: state.closed }, state.selected);
    }

    case "squared":
      return { ...state, squared: event.squared };
  }
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

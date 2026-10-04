import { describe, expect, test } from "bun:test";
import type { XY } from "../geometry/measure";
import { edgeNamesOf, measurementsOf, outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";

// The outline as it is drawn: corners in metres in a flat frame, closed or not, one selected, the
// history of it. A reducer, so that every rule is tested without a browser.

const PUNE = { lon: 73.86, lat: 18.52 };
const M_PER_PX = 0.283;

const after = (state: OutlineState, ...events: OutlineEvent[]) => events.reduce(outlineAfter, state);

/** The 90 by 40 rectangle placed corner by corner, in metres of the frame at Pune. */
function placed(...corners: XY[]): OutlineState {
  return after(
    START,
    { type: "began", at: PUNE },
    ...corners.map((xy): OutlineEvent => ({ type: "placed", at: xy, metresPerPx: M_PER_PX, touch: false })),
  );
}

const RECTANGLE: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];

describe("placing corners", () => {
  test("the first corner begins the frame at the place given; each corner after it is placed in metres", () => {
    const state = placed(...RECTANGLE);

    expect(state.frame?.centre).toEqual(PUNE);
    expect(state.corners).toEqual(RECTANGLE);
    expect(state.closed).toBe(false);
    expect(state.selected).toBe(3);
  });

  test("a corner within 3° of a right angle is squared, when the corners are squared", () => {
    const off = { x: 90 + 40 * Math.tan((2 * Math.PI) / 180), y: 40 };

    const state = placed({ x: 0, y: 0 }, { x: 90, y: 0 }, off);

    expect(state.corners[2].x).toBeCloseTo(90, 6);
    expect(state.corners[2].y).toBeCloseTo(40, 6);
  });

  test("with the corners not squared, it is placed where it is", () => {
    const off = { x: 90 + 40 * Math.tan((2 * Math.PI) / 180), y: 40 };

    const state = after(placed({ x: 0, y: 0 }, { x: 90, y: 0 }), { type: "squared", squared: false }, { type: "placed", at: off, metresPerPx: M_PER_PX, touch: false });

    expect(state.corners[2]).toEqual(off);
  });

  test("a press on the first corner closes the outline, with three corners or more", () => {
    const three = placed(RECTANGLE[0], RECTANGLE[1], RECTANGLE[2]);

    const closed = outlineAfter(three, { type: "placed", at: { x: -45 + 1, y: -20 + 1 }, metresPerPx: M_PER_PX, touch: false });

    expect(closed.closed).toBe(true);
    expect(closed.corners).toHaveLength(3);
  });

  test("a press on the first corner with two corners is no close: a third corner", () => {
    const two = placed(RECTANGLE[0], RECTANGLE[1]);

    const state = outlineAfter(two, { type: "placed", at: { x: -44, y: -19 }, metresPerPx: M_PER_PX, touch: false });

    expect(state.closed).toBe(false);
    expect(state.corners).toHaveLength(3);
  });

  test("Enter closes with three corners or more; with fewer it does nothing", () => {
    expect(outlineAfter(placed(...RECTANGLE), { type: "close" }).closed).toBe(true);
    expect(outlineAfter(placed(RECTANGLE[0], RECTANGLE[1]), { type: "close" }).closed).toBe(false);
  });

  test("closing squares four corners that are within 3° of a rectangle: the first edge is kept, the rest set square to it", () => {
    // Drawn by hand: the corners a little off, as presses on a map are.
    const drawn = placed({ x: -45, y: -20 }, { x: 45.2, y: -19.9 }, { x: 45.4, y: 20.3 }, { x: -44.8, y: 20.1 });

    const closed = outlineAfter(drawn, { type: "close" });

    const { edges, area } = measurementsOf(closed);
    expect(closed.corners[0]).toEqual({ x: -45, y: -20 });
    expect(closed.corners[1]).toEqual({ x: 45.2, y: -19.9 });
    expect(edges[0]).toBeCloseTo(edges[2], 6);
    expect(edges[1]).toBeCloseTo(edges[3], 6);
    expect(edgeNamesOf(closed)).toEqual(["South", "East", "North", "West"]);
    expect(area).toBeCloseTo(edges[0] * edges[1], 6);
  });

  test("closing leaves four corners alone when one is further than 3° from a right angle, or the corners are not squared", () => {
    const skewed = placed({ x: -45, y: -20 }, { x: 45, y: -20 }, { x: 50, y: 20 }, { x: -40, y: 20 });
    const closed = outlineAfter(skewed, { type: "close" });
    expect(closed.corners[2]).toEqual({ x: 50, y: 20 });

    const notSquared = after(
      START,
      { type: "began", at: PUNE },
      { type: "squared", squared: false },
      ...[{ x: -45, y: -20 }, { x: 45.2, y: -19.9 }, { x: 45.4, y: 20.3 }, { x: -44.8, y: 20.1 }].map(
        (at): OutlineEvent => ({ type: "placed", at, metresPerPx: M_PER_PX, touch: false }),
      ),
      { type: "close" },
    );
    expect(notSquared.corners[2]).toEqual({ x: 45.4, y: 20.3 });
  });

  test("a closed outline takes no more corners by a press on the map", () => {
    const closed = outlineAfter(placed(...RECTANGLE), { type: "close" });

    expect(outlineAfter(closed, { type: "placed", at: { x: 0, y: 50 }, metresPerPx: M_PER_PX, touch: false })).toBe(closed);
  });
});

describe("moving corners", () => {
  test("a corner dragged follows the pointer, squared to its neighbours when within 3°", () => {
    const state = outlineAfter(placed(...RECTANGLE), { type: "close" });

    const dragged = outlineAfter(state, { type: "cornerMoved", index: 2, at: { x: 45 + 0.5, y: 25 } });

    expect(dragged.corners[2].x).toBeCloseTo(45, 6);
    expect(dragged.corners[2].y).toBeCloseTo(25, 6);
  });

  test("a drag is one step of the history: while it goes on, nothing is pushed; when it ends, the state before it can be undone to", () => {
    const state = outlineAfter(placed(...RECTANGLE), { type: "close" });

    const dragging = after(state, { type: "cornerMoved", index: 2, at: { x: 50, y: 30 } }, { type: "cornerMoved", index: 2, at: { x: 55, y: 35 } });
    expect(dragging.history.past).toHaveLength(state.history.past.length);
    const dropped = outlineAfter(dragging, { type: "cornerDropped" });

    expect(dropped.history.past).toHaveLength(state.history.past.length + 1);
    expect(outlineAfter(dropped, { type: "undone" }).corners).toEqual(RECTANGLE);
  });

  test("a midpoint dragged becomes a corner between its two", () => {
    const state = outlineAfter(placed(...RECTANGLE), { type: "close" });

    const added = outlineAfter(state, { type: "midpointTaken", edge: 0, at: { x: 0, y: -25 } });

    expect(added.corners).toHaveLength(5);
    expect(added.corners[1]).toEqual({ x: 0, y: -25 });
    expect(added.selected).toBe(1);
  });

  test("a selected corner is nudged by the arrows, a step each", () => {
    const state = after(placed(...RECTANGLE), { type: "close" }, { type: "selected", index: 1 });

    const nudged = after(state, { type: "nudged", key: "ArrowUp", shift: false }, { type: "nudged", key: "ArrowRight", shift: true });

    expect(nudged.corners[1]).toEqual({ x: 46, y: -19.9 });
  });

  test("the selected corner can be removed while three stay", () => {
    const state = after(placed(...RECTANGLE), { type: "close" }, { type: "selected", index: 1 });

    const removed = outlineAfter(state, { type: "removed" });

    expect(removed.corners).toHaveLength(3);
    expect(outlineAfter(removed, { type: "removed" }).corners).toHaveLength(3);
  });
});

describe("while drawing", () => {
  test("Escape takes the last corner back", () => {
    const state = outlineAfter(placed(RECTANGLE[0], RECTANGLE[1], RECTANGLE[2]), { type: "steppedBack" });

    expect(state.corners).toHaveLength(2);
  });

  test("undo, redo and clear", () => {
    const state = placed(RECTANGLE[0], RECTANGLE[1]);

    const back = outlineAfter(state, { type: "undone" });
    expect(back.corners).toHaveLength(1);
    expect(outlineAfter(back, { type: "redone" }).corners).toHaveLength(2);
    const empty = outlineAfter(state, { type: "cleared" });
    expect(empty.corners).toEqual([]);
    expect(empty.closed).toBe(false);
    expect(outlineAfter(empty, { type: "undone" }).corners).toHaveLength(2);
  });
});

describe("the rectangle tool", () => {
  const dragged = (state: OutlineState, from: XY, to: XY) => after(state, { type: "began", at: PUNE }, { type: "boxDragged", from, to });

  test("a box dragged across the roof is four corners, closed, from the lowest left; while it is dragged nothing is pushed", () => {
    const dragging = dragged(START, { x: 45, y: 20 }, { x: -45, y: -20 });

    expect(dragging.corners).toEqual(RECTANGLE);
    expect(dragging.closed).toBe(true);
    expect(dragging.history.past).toHaveLength(0);
    expect(dragging.rectangle).toEqual({ base: RECTANGLE, turn: 0 });
  });

  test("dropped, the box is one step, and the panel names its sides", () => {
    const dropped = outlineAfter(dragged(START, { x: -45, y: -20 }, { x: 45, y: 20 }), { type: "boxDropped" });

    expect(dropped.history.past).toHaveLength(1);
    expect(edgeNamesOf(dropped)).toEqual(["South", "East", "North", "West"]);
    expect(outlineAfter(dropped, { type: "undone" }).corners).toEqual([]);
  });

  test("a drag of no width or no height draws nothing", () => {
    expect(dragged(START, { x: 0, y: 0 }, { x: 10, y: 0 }).corners).toEqual([]);
  });

  test("the handle turns the box about its centre, snapped to north within 3°; dropped, it is a step", () => {
    const box = outlineAfter(dragged(START, { x: -45, y: -20 }, { x: 45, y: 20 }), { type: "boxDropped" });

    const turning = outlineAfter(box, { type: "boxTurned", handle: { x: -30 * Math.sin(Math.PI / 6), y: 30 * Math.cos(Math.PI / 6) } });
    expect(turning.rectangle?.turn).toBeCloseTo(30, 6);
    expect(measurementsOf(turning).facing?.degrees).toBeCloseTo(150, 6);
    expect(measurementsOf(turning).edges.map((edge) => Math.round(edge * 1e6) / 1e6)).toEqual([90, 40, 90, 40]);
    expect(turning.history.past).toHaveLength(box.history.past.length);

    const nearNorth = outlineAfter(box, { type: "boxTurned", handle: { x: -30 * Math.sin(Math.PI / 90), y: 30 * Math.cos(Math.PI / 90) } });
    expect(nearNorth.rectangle?.turn).toBe(0);

    const dropped = outlineAfter(turning, { type: "turnDropped" });
    expect(dropped.history.past).toHaveLength(box.history.past.length + 1);
  });

  test("once a corner is dragged the box is a polygon like any other: no turn handle", () => {
    const box = outlineAfter(dragged(START, { x: -45, y: -20 }, { x: 45, y: 20 }), { type: "boxDropped" });

    const moved = after(box, { type: "cornerMoved", index: 2, at: { x: 50, y: 30 } }, { type: "cornerDropped" });

    expect(moved.rectangle).toBeNull();
    expect(outlineAfter(moved, { type: "boxTurned", handle: { x: -30, y: 0 } })).toBe(moved);
  });

  test("a typed length keeps the box a box: the base follows", () => {
    const box = outlineAfter(dragged(START, { x: -45, y: -20 }, { x: 45, y: 20 }), { type: "boxDropped" });

    const longer = outlineAfter(box, { type: "edgeLength", edge: 0, length: 100 });

    expect(measurementsOf(longer).edges).toEqual([100, 40, 100, 40]);
    expect(longer.rectangle?.base[1]).toEqual({ x: 50, y: -20 });
  });

  test("clear, undo and a new box start over", () => {
    const box = outlineAfter(dragged(START, { x: -45, y: -20 }, { x: 45, y: 20 }), { type: "boxDropped" });

    expect(outlineAfter(box, { type: "cleared" }).rectangle).toBeNull();
    expect(outlineAfter(box, { type: "undone" }).rectangle).toBeNull();
    expect(outlineAfter(outlineAfter(box, { type: "undone" }), { type: "redone" }).rectangle).toEqual({ base: RECTANGLE, turn: 0 });
  });
});

describe("a footprint detected", () => {
  test("taken as the outline: closed, a step, a polygon like any other", () => {
    const corners: XY[] = [{ x: -30, y: -10 }, { x: 30, y: -12 }, { x: 31, y: 15 }, { x: 0, y: 20 }, { x: -29, y: 14 }];

    const taken = after(START, { type: "began", at: PUNE }, { type: "footprintTaken", corners });

    expect(taken.corners).toEqual(corners);
    expect(taken.closed).toBe(true);
    expect(taken.rectangle).toBeNull();
    expect(taken.history.past).toHaveLength(1);
    expect(measurementsOf(taken).corners).toBe(5);
    expect(outlineAfter(taken, { type: "undone" }).corners).toEqual([]);
  });

  test("fewer than three corners are no footprint", () => {
    const state = after(START, { type: "began", at: PUNE });

    expect(outlineAfter(state, { type: "footprintTaken", corners: [{ x: 0, y: 0 }, { x: 1, y: 1 }] })).toBe(state);
  });
});

describe("an outline loaded from a design", () => {
  test("its corners, closed, in a frame at the design's place, with nothing to undo: the beginning of editing", () => {
    const loaded = outlineAfter(placed(RECTANGLE[0]), { type: "loaded", at: PUNE, corners: RECTANGLE });

    expect(loaded.corners).toEqual(RECTANGLE);
    expect(loaded.closed).toBe(true);
    expect(loaded.frame?.centre).toEqual(PUNE);
    expect(loaded.history.past).toHaveLength(0);
    expect(edgeNamesOf(loaded)).toEqual(["South", "East", "North", "West"]);
  });
});

describe("typed lengths", () => {
  test("a length typed into an edge corrects the outline; squared, the rectangle stays one", () => {
    const state = outlineAfter(placed(...RECTANGLE), { type: "close" });

    const changed = outlineAfter(state, { type: "edgeLength", edge: 1, length: 50 });

    expect(measurementsOf(changed).edges.map((edge) => Math.round(edge * 100) / 100)).toEqual([90, 50, 90, 50]);
    expect(measurementsOf(changed).area).toBeCloseTo(4500, 6);
  });
});

describe("what is measured", () => {
  test("the edges, the area, the direction the long side faces, the corners", () => {
    const state = outlineAfter(placed(...RECTANGLE), { type: "close" });

    expect(measurementsOf(state)).toEqual({
      edges: [90, 40, 90, 40],
      area: 3600,
      facing: { degrees: 180, compass: "S" },
      corners: 4,
    });
  });

  test("the edges of a rectangle are named by the side they are on; of another outline, by their number", () => {
    const closed = outlineAfter(placed(...RECTANGLE), { type: "close" });

    expect(edgeNamesOf(closed)).toEqual(["South", "East", "North", "West"]);
    expect(edgeNamesOf(outlineAfter(closed, { type: "midpointTaken", edge: 0, at: { x: 0, y: -25 } }))).toEqual(["Edge 1", "Edge 2", "Edge 3", "Edge 4", "Edge 5"]);
  });

  test("before it is closed, the area and the direction are not there", () => {
    const measured = measurementsOf(placed(RECTANGLE[0], RECTANGLE[1], RECTANGLE[2]));

    expect(measured.area).toBeNull();
    expect(measured.facing).toBeNull();
    expect(measured.edges).toEqual([90, 40]);
    expect(measured.corners).toBe(3);
  });
});

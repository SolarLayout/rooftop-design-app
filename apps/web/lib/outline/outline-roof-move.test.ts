import { describe, expect, test } from "bun:test";
import type { XY } from "../geometry/measure";
import { liftLabelOf } from "./roof-move";
import { measurementsOf, outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";

// The closed roof picked up whole in the reducer of the outline (D79): a press picks it, a drag moves it
// and its obstacles, its handle turns it about its middle, the arrows nudge it; each move or turn one step
// of Undo. Tested without a browser, as every rule of drawing is.

const PUNE = { lon: 73.86, lat: 18.52 };
const PRESS = { metresPerPx: 0.283, touch: false };

const after = (state: OutlineState, ...events: OutlineEvent[]) => events.reduce(outlineAfter, state);

const RECTANGLE: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];

const rounded = (points: readonly XY[]) => points.map(({ x, y }) => ({ x: Math.round(x * 1e6) / 1e6 + 0, y: Math.round(y * 1e6) / 1e6 + 0 }));

/** The 90 by 40 roof drawn and closed, with a tank of 2.5 at (20, 10) of height 2. */
function roofWithTank(): OutlineState {
  return after(
    START,
    { type: "began", at: PUNE },
    ...RECTANGLE.map((at): OutlineEvent => ({ type: "placed", at, ...PRESS })),
    { type: "close" },
    { type: "shapeDragged", kind: "cylinder", from: { x: 20, y: 10 }, to: { x: 21.25, y: 10 } },
    { type: "shapeDropped" },
    { type: "heightGiven", height: 2, name: "Water tank" },
  );
}

const picked = () => after(roofWithTank(), { type: "roofPicked", picked: true });

describe("picking the roof up", () => {
  test("a closed roof is picked, no step of Undo; the corner and the obstacle selected let go", () => {
    const state = after(roofWithTank(), { type: "selected", index: 1 }, { type: "roofPicked", picked: true });

    expect(state.picked).toBe(true);
    expect(state.selected).toBeNull();
    expect(state.selectedObstacle).toBeNull();
    expect(state.history.past).toHaveLength(roofWithTank().history.past.length);
  });

  test("a roof still open, or with a shape awaiting its height, is not picked", () => {
    const open = after(START, { type: "began", at: PUNE }, ...RECTANGLE.map((at): OutlineEvent => ({ type: "placed", at, ...PRESS })));
    expect(outlineAfter(open, { type: "roofPicked", picked: true }).picked).toBe(false);

    const awaiting = after(roofWithTank(), { type: "shapeDragged", kind: "box", from: { x: 0, y: 0 }, to: { x: 2, y: 2 } }, { type: "shapeDropped" });
    expect(outlineAfter(awaiting, { type: "roofPicked", picked: true }).picked).toBe(false);
  });

  test("let go by Escape, by a corner or an obstacle picked, by a press outside", () => {
    expect(outlineAfter(picked(), { type: "steppedBack" }).picked).toBe(false);
    expect(outlineAfter(picked(), { type: "selected", index: 0 }).picked).toBe(false);
    expect(outlineAfter(picked(), { type: "obstacleSelected", id: 1 }).picked).toBe(false);
    expect(outlineAfter(picked(), { type: "roofPicked", picked: false }).picked).toBe(false);
  });

  test("Escape lets the roof go and takes no corner back", () => {
    expect(outlineAfter(picked(), { type: "steppedBack" }).corners).toEqual(picked().corners);
  });

  test("while it is picked nothing new is drawn on it", () => {
    const state = after(picked(), { type: "shapeDragged", kind: "box", from: { x: 0, y: 0 }, to: { x: 2, y: 2 } });

    expect(state.drawing).toBeNull();
  });

  test("cleared, the roof is not picked", () => {
    expect(outlineAfter(picked(), { type: "cleared" }).picked).toBe(false);
  });
});

describe("moving the picked roof", () => {
  test("a drag moves the corners and the obstacles from where they stood; nothing is pushed until the drop", () => {
    const state = picked();

    const dragging = after(state, { type: "roofMoved", by: { x: 1, y: 1 } }, { type: "roofMoved", by: { x: 1.6, y: -0.6 } });

    expect(rounded(dragging.corners)).toEqual(rounded(RECTANGLE.map(({ x, y }) => ({ x: x + 1.6, y: y - 0.6 }))));
    expect(rounded(dragging.obstacles[0].points)).toEqual([{ x: 21.6, y: 9.4 }]);
    expect(dragging.lift).toEqual({ kind: "move", by: { x: 1.6, y: -0.6 } });
    expect(dragging.history).toBe(state.history);
    expect(measurementsOf(dragging).edges.map((edge) => Math.round(edge * 1e6) / 1e6)).toEqual([90, 40, 90, 40]);
    expect(liftLabelOf(dragging.lift!, dragging.corners, "north")).toBe("1.6 m E · 0.6 m S");
  });

  test("dropped, the move is one step of Undo, and the roof stays picked", () => {
    const dropped = after(picked(), { type: "roofMoved", by: { x: 1.6, y: -0.6 } }, { type: "roofDropped" });

    expect(dropped.lift).toBeNull();
    expect(dropped.picked).toBe(true);
    expect(dropped.history.past).toHaveLength(picked().history.past.length + 1);
    const undone = outlineAfter(dropped, { type: "undone" });
    expect(undone.corners).toEqual(RECTANGLE);
    expect(undone.obstacles[0].points).toEqual([{ x: 20, y: 10 }]);
  });

  test("a drag that ends where it began is no step", () => {
    const state = picked();

    const dropped = after(state, { type: "roofMoved", by: { x: 0, y: 0 } }, { type: "roofDropped" });

    expect(dropped.history).toBe(state.history);
  });

  test("a roof that is not picked is not moved", () => {
    const state = roofWithTank();

    expect(outlineAfter(state, { type: "roofMoved", by: { x: 1, y: 1 } })).toBe(state);
  });

  test("the arrows nudge the picked roof 0.1 m, 1 m with Shift, a step each", () => {
    const nudged = after(picked(), { type: "nudged", key: "ArrowRight", shift: false }, { type: "nudged", key: "ArrowDown", shift: true });

    expect(rounded(nudged.corners)[0]).toEqual({ x: -44.9, y: -21 });
    expect(rounded(nudged.obstacles[0].points)).toEqual([{ x: 20.1, y: 9 }]);
    expect(nudged.history.past).toHaveLength(picked().history.past.length + 2);
    expect(nudged.picked).toBe(true);
  });
});

describe("turning the picked roof", () => {
  // The handle stands off the middle of the north edge, (0, 20); the middle of the roof is (0, 0).
  const from = { x: 0, y: 31 };
  const clockwise = (degrees: number) => ({ x: 31 * Math.sin((degrees * Math.PI) / 180), y: 31 * Math.cos((degrees * Math.PI) / 180) });

  test("a drag of the handle turns it about its middle, the obstacles with it; the panel's Faces follows", () => {
    const state = picked();

    const turning = outlineAfter(state, { type: "roofTurned", from, to: clockwise(6) });

    expect(turning.lift?.kind).toBe("turn");
    expect(measurementsOf(turning).facing?.degrees).toBeCloseTo(186, 6);
    expect(liftLabelOf(turning.lift!, turning.corners, "north")).toBe("6.0° · faces 186° S");
    const tank = turning.obstacles[0].points[0];
    expect(Math.hypot(tank.x, tank.y)).toBeCloseTo(Math.hypot(20, 10), 6);
    expect(turning.history).toBe(state.history);
  });

  test("within 3° of north it snaps square to north", () => {
    const turning = outlineAfter(picked(), { type: "roofTurned", from, to: clockwise(2) });

    expect(rounded(turning.corners)).toEqual(RECTANGLE);
  });

  test("a turn of a box drawn with the rectangle tool keeps it a box that its own handle turns on from", () => {
    const box = after(
      START,
      { type: "began", at: PUNE },
      { type: "boxDragged", from: { x: -45, y: -20 }, to: { x: 45, y: 20 } },
      { type: "boxDropped" },
      { type: "roofPicked", picked: true },
      { type: "roofTurned", from, to: clockwise(30) },
      { type: "roofDropped" },
    );

    expect(box.rectangle?.turn).toBeCloseTo(-30, 6);
    expect(rounded(box.rectangle?.base ?? [])).toEqual(RECTANGLE);
  });

  test("dropped, the turn is one step of Undo", () => {
    const dropped = after(picked(), { type: "roofTurned", from, to: clockwise(6) }, { type: "roofDropped" });

    expect(dropped.history.past).toHaveLength(picked().history.past.length + 1);
    expect(outlineAfter(dropped, { type: "undone" }).corners).toEqual(RECTANGLE);
  });
});

import { describe, expect, test } from "bun:test";
import { centroidOf, type XY } from "../geometry/measure";
import { outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";

// An obstacle picked on Find's map in the reducer of the outline (D79): a drag moves it in steps of 0.1 m and
// keeps it on the roof, a box and a building turn by their handle, a tank and a wall only move, the arrows
// nudge it; each move or turn one step of Undo.

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

/** The 90 by 40 roof with a box of 5 by 4 at (10, 5), id 1, and a tank of 2 at (-20, 0), id 2. */
function roofWithObstacles(): OutlineState {
  return after(
    START,
    { type: "began", at: PUNE },
    ...RECTANGLE.map((at): OutlineEvent => ({ type: "placed", at, ...PRESS })),
    { type: "close" },
    { type: "shapeDragged", kind: "box", from: { x: 10, y: 5 }, to: { x: 15, y: 9 } },
    { type: "shapeDropped" },
    { type: "heightGiven", height: 3, name: "Stair room" },
    { type: "shapeDragged", kind: "cylinder", from: { x: -20, y: 0 }, to: { x: -19, y: 0 } },
    { type: "shapeDropped" },
    { type: "heightGiven", height: 2, name: "Water tank" },
  );
}

const picked = (id: number) => after(roofWithObstacles(), { type: "obstacleSelected", id });

describe("moving the obstacle picked", () => {
  test("a drag moves it in steps of 0.1 m from where it stood; nothing is pushed until the drop", () => {
    const state = picked(1);

    const dragging = after(state, { type: "obstacleMoved", id: 1, by: { x: 1.04, y: -0.66 } });

    expect(rounded(dragging.obstacles[0].points)[0]).toEqual({ x: 11, y: 4.3 });
    expect(dragging.obstacles[1]).toEqual(state.obstacles[1]);
    expect(dragging.lift).toEqual({ kind: "move", by: { x: 1, y: -0.7 }, of: 1 });
    expect(dragging.history).toBe(state.history);
    expect(dragging.selectedObstacle).toBe(1);
  });

  test("it stops at the roof's edge", () => {
    const dragging = after(picked(1), { type: "obstacleMoved", id: 1, by: { x: 50, y: 0 } });

    expect(Math.max(...dragging.obstacles[0].points.map(({ x }) => x))).toBeLessThanOrEqual(45);
    expect(Math.max(...dragging.obstacles[0].points.map(({ x }) => x))).toBeGreaterThan(44.8);
  });

  test("dropped, it is one step of Undo, and stays picked", () => {
    const state = picked(1);

    const dropped = after(state, { type: "obstacleMoved", id: 1, by: { x: 2, y: 0 } }, { type: "liftDropped" });

    expect(dropped.lift).toBeNull();
    expect(dropped.selectedObstacle).toBe(1);
    expect(dropped.history.past).toHaveLength(state.history.past.length + 1);
    expect(outlineAfter(dropped, { type: "undone" }).obstacles[0].points).toEqual(state.obstacles[0].points);
  });

  test("only the obstacle picked is moved", () => {
    const state = picked(1);

    expect(outlineAfter(state, { type: "obstacleMoved", id: 2, by: { x: 1, y: 0 } })).toBe(state);
  });

  test("the arrows nudge it 0.1 m, 1 m with Shift, a step each, kept on the roof", () => {
    const nudged = after(picked(2), { type: "nudged", key: "ArrowUp", shift: false }, { type: "nudged", key: "ArrowLeft", shift: true });

    expect(rounded(nudged.obstacles[1].points)).toEqual([{ x: -21, y: 0.1 }]);
    expect(nudged.history.past).toHaveLength(picked(2).history.past.length + 2);
    expect(nudged.selectedObstacle).toBe(2);
  });
});

describe("turning the obstacle picked", () => {
  // The box's middle is (12.5, 7); its handle stands off the middle of its north edge, (12.5, 9).
  const from = { x: 12.5, y: 20 };
  const clockwise = (degrees: number) => ({ x: 12.5 + 13 * Math.sin((degrees * Math.PI) / 180), y: 7 + 13 * Math.cos((degrees * Math.PI) / 180) });

  test("a box turns about its middle by the handle; nothing is pushed until the drop", () => {
    const state = picked(1);

    const turning = outlineAfter(state, { type: "obstacleTurned", id: 1, from, to: clockwise(12) });

    expect(turning.lift?.kind).toBe("turn");
    expect(turning.lift?.kind === "turn" && turning.lift.degrees).toBeCloseTo(-12, 6);
    expect(rounded([centroidOf(turning.obstacles[0].points)])).toEqual([{ x: 12.5, y: 7 }]);
    expect(turning.history).toBe(state.history);
    expect(after(turning, { type: "liftDropped" }).history.past).toHaveLength(state.history.past.length + 1);
  });

  test("within 3° of a right angle it snaps square", () => {
    const turning = outlineAfter(picked(1), { type: "obstacleTurned", id: 1, from, to: clockwise(88) });

    expect(turning.lift?.kind === "turn" && turning.lift.degrees).toBeCloseTo(-90, 6);
  });

  test("a tank does not turn", () => {
    const state = picked(2);

    expect(outlineAfter(state, { type: "obstacleTurned", id: 2, from: { x: -20, y: 3 }, to: { x: -17, y: 0 } })).toBe(state);
  });
});

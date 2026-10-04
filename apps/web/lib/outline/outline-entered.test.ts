import { describe, expect, test } from "bun:test";
import { cornersOfRectangle } from "./by-hand";
import type { XY } from "../geometry/measure";
import { edgeNamesOf, measurementsOf, outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";

// A roof entered by hand in the reducer (plan/phase-04-plan.md, step 15): its corners come from the
// measurements typed, at the place typed or found, and stand as a closed outline like any other. Each
// entry that changes the roof is a step; the obstacles stay while the place stays.

const PUNE = { lon: 73.86, lat: 18.52 };
const ELSEWHERE = { lon: 72.88, lat: 19.08 };
const PRESS = { metresPerPx: 0.283, touch: false };
const DEMO = cornersOfRectangle(90, 40, 180);

const after = (state: OutlineState, ...events: OutlineEvent[]) => events.reduce(outlineAfter, state);

describe("a roof entered", () => {
  test("stands closed at the place, measured and named like a roof drawn; it is a step", () => {
    const state = outlineAfter(START, { type: "entered", at: PUNE, corners: DEMO });

    expect(state.frame?.centre).toEqual(PUNE);
    expect(state.corners).toEqual(DEMO);
    expect(state.closed).toBe(true);
    expect(measurementsOf(state).area).toBeCloseTo(3600, 6);
    expect(edgeNamesOf(state)).toEqual(["South", "East", "North", "West"]);
    expect(state.history.past).toHaveLength(1);
    expect(outlineAfter(state, { type: "undone" }).corners).toHaveLength(0);
  });

  test("entered again at the same place: the corners change, the obstacles stay", () => {
    const withTank = after(
      START,
      { type: "entered", at: PUNE, corners: DEMO },
      { type: "shapeDragged", kind: "cylinder", from: { x: 30, y: 10 }, to: { x: 31.25, y: 10 } },
      { type: "shapeDropped" },
      { type: "heightGiven", height: 2, name: "" },
    );

    const wider = outlineAfter(withTank, { type: "entered", at: PUNE, corners: cornersOfRectangle(90, 50, 180) });

    expect(wider.frame).toBe(withTank.frame);
    expect(measurementsOf(wider).edges.map(Math.round)).toEqual([90, 50, 90, 50]);
    expect(wider.obstacles).toHaveLength(1);
  });

  test("entered at another place: a new frame there, and the obstacles of the old place go", () => {
    const withTank = after(
      START,
      { type: "entered", at: PUNE, corners: DEMO },
      { type: "shapeDragged", kind: "cylinder", from: { x: 30, y: 10 }, to: { x: 31.25, y: 10 } },
      { type: "shapeDropped" },
      { type: "heightGiven", height: 2, name: "" },
    );

    const moved = outlineAfter(withTank, { type: "entered", at: ELSEWHERE, corners: DEMO });

    expect(moved.frame?.centre).toEqual(ELSEWHERE);
    expect(moved.obstacles).toHaveLength(0);
    expect(moved.corners).toEqual(DEMO);
  });

  test("the same corners at the same place are no step", () => {
    const state = outlineAfter(START, { type: "entered", at: PUNE, corners: DEMO });

    expect(outlineAfter(state, { type: "entered", at: PUNE, corners: [...DEMO] })).toBe(state);
  });

  test("fewer than three corners take the roof away and keep the place: nothing to build yet", () => {
    const state = outlineAfter(START, { type: "entered", at: PUNE, corners: DEMO });

    const gone = outlineAfter(state, { type: "entered", at: PUNE, corners: DEMO.slice(0, 2) });

    expect(gone.corners).toHaveLength(0);
    expect(gone.closed).toBe(false);
    expect(gone.frame?.centre).toEqual(PUNE);
  });

  test("a roof drawn by presses after: the frame stays where the roof was entered", () => {
    const state = after(START, { type: "entered", at: PUNE, corners: DEMO }, { type: "cleared" });
    const placed: XY = { x: 1, y: 1 };

    const drawn = outlineAfter(state, { type: "placed", at: placed, ...PRESS });

    expect(drawn.frame?.centre).toEqual(PUNE);
    expect(drawn.corners).toEqual([placed]);
  });
});

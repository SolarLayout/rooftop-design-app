import { describe, expect, test } from "bun:test";
import type { XY } from "../geometry/measure";
import { outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";
import { showsMapLineOf, tipDoneBy } from "./tips";

// The one line on Find's map for the first outline (V2 · 4; before it the tips of D79): shown once the outline is
// closed, gone for good once the roof is moved or turned.

const PUNE = { lon: 73.86, lat: 18.52 };
const PRESS = { metresPerPx: 0.283, touch: false };
const NONE = new Set<never>();

const after = (state: OutlineState, ...events: OutlineEvent[]) => events.reduce(outlineAfter, state);

const RECTANGLE: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];

const placed = () => after(START, { type: "began", at: PUNE }, ...RECTANGLE.map((at): OutlineEvent => ({ type: "placed", at, ...PRESS })));
const closed = () => outlineAfter(placed(), { type: "close" });
const withBox = () =>
  after(closed(), { type: "shapeDragged", kind: "box", from: { x: 10, y: 5 }, to: { x: 15, y: 9 } }, { type: "shapeDropped" }, { type: "heightGiven", height: 3, name: "Stair room" });

describe("the line on the map", () => {
  test("not while the roof is open", () => {
    expect(showsMapLineOf(placed(), NONE)).toBe(false);
  });

  test("once it is closed, with obstacles or without", () => {
    expect(showsMapLineOf(closed(), NONE)).toBe(true);
    expect(showsMapLineOf(withBox(), NONE)).toBe(true);
  });

  test("not while a shape awaits its height", () => {
    const awaiting = after(closed(), { type: "shapeDragged", kind: "box", from: { x: 0, y: 0 }, to: { x: 2, y: 2 } }, { type: "shapeDropped" });

    expect(showsMapLineOf(awaiting, NONE)).toBe(false);
  });

  test("not once it is gone", () => {
    expect(showsMapLineOf(closed(), new Set(["roof" as const]))).toBe(false);
  });
});

describe("a tip done", () => {
  test("the roof's when the roof is moved or turned and let go", () => {
    const lifted = after(closed(), { type: "roofPicked", picked: true }, { type: "roofMoved", by: { x: 1, y: 0 } });

    expect(tipDoneBy(lifted, outlineAfter(lifted, { type: "liftDropped" }))).toBe("roof");
  });

  test("not when an obstacle is moved: the line is the roof's", () => {
    const lifted = after(withBox(), { type: "obstacleSelected", id: 1 }, { type: "obstacleMoved", id: 1, by: { x: 1, y: 0 } });

    expect(tipDoneBy(lifted, outlineAfter(lifted, { type: "liftDropped" }))).toBeNull();
  });

  test("none for a lift let go where it began, nor for anything else", () => {
    const still = after(closed(), { type: "roofPicked", picked: true }, { type: "roofMoved", by: { x: 0, y: 0 } });

    expect(tipDoneBy(still, outlineAfter(still, { type: "liftDropped" }))).toBeNull();
    expect(tipDoneBy(placed(), closed())).toBeNull();
  });
});

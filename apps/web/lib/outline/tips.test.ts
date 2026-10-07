import { describe, expect, test } from "bun:test";
import type { XY } from "../geometry/measure";
import { outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";
import { TIPS, tipDoneBy, tipShownOf } from "./tips";

// Find's tips (D79): one at a time, shown when its move becomes possible, gone for good once its move is done
// or Got it is pressed.

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

describe("the tip shown", () => {
  test("none while the roof is open", () => {
    expect(tipShownOf(placed(), NONE)).toBeNull();
  });

  test("the roof's once it is closed", () => {
    expect(tipShownOf(closed(), NONE)).toBe("roof");
  });

  test("the obstacles' once the roof's is gone and there is an obstacle", () => {
    expect(tipShownOf(withBox(), NONE)).toBe("roof");
    expect(tipShownOf(withBox(), new Set(["roof" as const]))).toBe("obstacle");
    expect(tipShownOf(closed(), new Set(["roof" as const]))).toBeNull();
  });

  test("none while a shape awaits its height", () => {
    const awaiting = after(closed(), { type: "shapeDragged", kind: "box", from: { x: 0, y: 0 }, to: { x: 2, y: 2 } }, { type: "shapeDropped" });

    expect(tipShownOf(awaiting, NONE)).toBeNull();
  });

  test("none once both are gone", () => {
    expect(tipShownOf(withBox(), new Set(["roof" as const, "obstacle" as const]))).toBeNull();
  });
});

describe("a tip done", () => {
  test("the roof's when the roof is moved or turned and let go", () => {
    const lifted = after(closed(), { type: "roofPicked", picked: true }, { type: "roofMoved", by: { x: 1, y: 0 } });

    expect(tipDoneBy(lifted, outlineAfter(lifted, { type: "liftDropped" }))).toBe("roof");
  });

  test("the obstacles' when an obstacle is moved or turned and let go", () => {
    const lifted = after(withBox(), { type: "obstacleSelected", id: 1 }, { type: "obstacleMoved", id: 1, by: { x: 1, y: 0 } });

    expect(tipDoneBy(lifted, outlineAfter(lifted, { type: "liftDropped" }))).toBe("obstacle");
  });

  test("none for a lift let go where it began, nor for anything else", () => {
    const still = after(closed(), { type: "roofPicked", picked: true }, { type: "roofMoved", by: { x: 0, y: 0 } });

    expect(tipDoneBy(still, outlineAfter(still, { type: "liftDropped" }))).toBeNull();
    expect(tipDoneBy(placed(), closed())).toBeNull();
  });
});

describe("the words", () => {
  test("two to four rows, for a pointer and for touch", () => {
    for (const tip of Object.values(TIPS)) {
      for (const rows of [tip.pointer, tip.touch]) {
        expect(rows.length).toBeGreaterThanOrEqual(2);
        expect(rows.length).toBeLessThanOrEqual(4);
      }
    }
    expect(TIPS.roof.title).toBe("Move or turn the roof");
    expect(TIPS.obstacle.pointer.map((row) => row.key)).toEqual(["Click", "Drag", "◯", "Delete"]);
  });
});

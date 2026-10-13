import { describe, expect, test } from "bun:test";
import type { XY } from "../geometry/measure";
import { ghostOf, liftLabelPlaceOf, turnHandleOfPicked } from "./lifted";
import { outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";

// What the map draws of what is picked on it (D79): the turn handle of the roof or of a box or a building,
// where it stood while it is lifted, and the label of the move or the turn.

const PUNE = { lon: 73.86, lat: 18.52 };
const PRESS = { metresPerPx: 0.283, touch: false };
const M_PER_PX = 0.25;

const after = (state: OutlineState, ...events: OutlineEvent[]) => events.reduce(outlineAfter, state);

const RECTANGLE: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];

/** The 90 by 40 roof with a box of 4 by 4 at (10, 5), id 1, and a tank of 2 at (-20, 0), id 2. */
function roofWithObstacles(): OutlineState {
  return after(
    START,
    { type: "began", at: PUNE },
    ...RECTANGLE.map((at): OutlineEvent => ({ type: "placed", at, ...PRESS })),
    { type: "close" },
    { type: "shapeDragged", kind: "box", from: { x: 10, y: 5 }, to: { x: 14, y: 9 } },
    { type: "shapeDropped" },
    { type: "heightGiven", height: 3, name: "Stair room" },
    { type: "shapeDragged", kind: "cylinder", from: { x: -20, y: 0 }, to: { x: -19, y: 0 } },
    { type: "shapeDropped" },
    { type: "heightGiven", height: 2, name: "Water tank" },
  );
}

describe("the turn handle of what is picked", () => {
  test("none while nothing is picked", () => {
    expect(turnHandleOfPicked(roofWithObstacles(), M_PER_PX)).toBeNull();
  });

  test("the roof's, off the middle of its north edge", () => {
    const roof = outlineAfter(roofWithObstacles(), { type: "roofPicked", picked: true });

    expect(turnHandleOfPicked(roof, M_PER_PX)).toEqual({ of: "roof", foot: { x: 0, y: 20 }, handle: { x: 0, y: 31 } });
  });

  test("a box's, off the middle of its north edge; a tank has none", () => {
    const box = outlineAfter(roofWithObstacles(), { type: "obstacleSelected", id: 1 });

    expect(turnHandleOfPicked(box, M_PER_PX)).toEqual({ of: 1, foot: { x: 12, y: 9 }, handle: { x: 12, y: 20 } });
    expect(turnHandleOfPicked(outlineAfter(roofWithObstacles(), { type: "obstacleSelected", id: 2 }), M_PER_PX)).toBeNull();
  });
});

describe("where it stood", () => {
  test("nothing at rest", () => {
    expect(ghostOf(outlineAfter(roofWithObstacles(), { type: "roofPicked", picked: true }))).toBeNull();
  });

  test("the roof's corners while it is lifted, closed", () => {
    const moving = after(roofWithObstacles(), { type: "roofPicked", picked: true }, { type: "roofMoved", by: { x: 1, y: 0 } });

    expect(ghostOf(moving)).toEqual({ points: RECTANGLE, closed: true });
  });

  test("the obstacle's footprint while it is lifted; a tank by its round edge", () => {
    const moving = after(roofWithObstacles(), { type: "obstacleSelected", id: 2 }, { type: "obstacleMoved", id: 2, by: { x: 1, y: 0 } });

    const ghost = ghostOf(moving);
    expect(ghost?.closed).toBe(true);
    expect(ghost?.points).toHaveLength(16);
    expect(ghost?.points[0].x).toBeCloseTo(-19, 9);
  });
});

describe("the label of a lift", () => {
  test("a move of the roof at its middle", () => {
    const moving = after(roofWithObstacles(), { type: "roofPicked", picked: true }, { type: "roofMoved", by: { x: 1.6, y: -0.6 } });

    const label = liftLabelPlaceOf(moving, M_PER_PX);
    expect(label?.text).toBe("1.6 m E · 0.6 m S");
    expect(label?.kind).toBe("move");
    expect(label?.at.x).toBeCloseTo(1.6, 9);
    expect(label?.at.y).toBeCloseTo(-0.6, 9);
  });

  // Issue 238, item 27: at its middle the label hid the obstacle it moves, as large as the label or smaller.
  test("a move of an obstacle under it, clear of it, with its name", () => {
    const moving = after(roofWithObstacles(), { type: "obstacleSelected", id: 1 }, { type: "obstacleMoved", id: 1, by: { x: 1, y: 0 } });

    const label = liftLabelPlaceOf(moving, M_PER_PX);
    expect(label?.text).toBe("Stair room · 1.0 m E · 0.0 m N");
    // Its middle 28 pixels under the obstacle's lowest point, at 0.25 m a pixel.
    expect(label?.at).toEqual({ x: 13, y: 5 - 28 * M_PER_PX });
  });

  test("a turn at the handle", () => {
    const turning = after(roofWithObstacles(), { type: "obstacleSelected", id: 1 }, { type: "obstacleTurned", id: 1, from: { x: 12, y: 20 }, to: { x: 25, y: 7 } });

    const label = liftLabelPlaceOf(turning, M_PER_PX);
    expect(label?.text).toBe("Stair room · 4.0 × 4.0 m · turned 90°");
    expect(label?.kind).toBe("turn");
    expect(label?.at.x).toBeCloseTo(25, 6);
    expect(label?.at.y).toBeCloseTo(7, 6);
  });

  test("nothing at rest", () => {
    expect(liftLabelPlaceOf(roofWithObstacles(), M_PER_PX)).toBeNull();
  });
});

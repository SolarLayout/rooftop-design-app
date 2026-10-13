import { describe, expect, test } from "bun:test";
import { handleReachOf, shortestSideOf } from "./handle-reach";
import type { Obstacle } from "./obstacles";

// The handles of the obstacle picked, against a drag from inside it (issue 238, item 27): a small obstacle on the screen
// is no larger than its corners' handles, and a drag from inside it grabbed a corner. The move comes first: a handle
// takes the press over its whole target while the obstacle is at least two targets across, on its dot alone while it is
// at least a dot and a half across, and not at all below that (zoom in to reshape it).

const box = (width: number, depth: number): Obstacle => ({
  id: 1,
  name: "Stair room",
  kind: "box",
  height: 3,
  diameter: null,
  points: [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: depth },
    { x: 0, y: depth },
  ],
});

describe("an obstacle's shortest side", () => {
  test("a box: its shorter side; a building: its shortest edge", () => {
    expect(shortestSideOf(box(5, 4))).toBe(4);
    expect(shortestSideOf({ ...box(12, 9), kind: "building" })).toBe(9);
  });

  test("a tank and a tree: across; a wall: its shortest stretch", () => {
    expect(shortestSideOf({ ...box(1, 1), kind: "cylinder", points: [{ x: 0, y: 0 }], diameter: 2.5 })).toBe(2.5);
    expect(shortestSideOf({ ...box(1, 1), kind: "tree", points: [{ x: 0, y: 0 }], diameter: 6 })).toBe(6);
    expect(shortestSideOf({ ...box(1, 1), kind: "wall", points: [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 3 }] })).toBe(3);
  });
});

describe("what a handle of the obstacle picked takes", () => {
  const SIZES = { targetPx: 24, dotPx: 18 };

  test("the whole target while the obstacle is at least two targets across", () => {
    expect(handleReachOf({ sidePx: 48, ...SIZES })).toBe("target");
    expect(handleReachOf({ sidePx: 300, ...SIZES })).toBe("target");
  });

  test("its dot alone while it is smaller, down to a dot and a half across, so that a drag from inside moves it", () => {
    expect(handleReachOf({ sidePx: 47, ...SIZES })).toBe("dot");
    expect(handleReachOf({ sidePx: 27, ...SIZES })).toBe("dot");
  });

  test("nothing below that, where two dots would leave less than half a dot between them: the drag is the move's", () => {
    expect(handleReachOf({ sidePx: 26.9, ...SIZES })).toBe("none");
  });

  test("the demo's stair room: moved, never reshaped, at the demo's zoom; its dots one zoom in; its targets two zooms in", () => {
    // 5 by 4 m at 0.283 m a pixel, the demo's zoom: 14 pixels across.
    const at = (metresPerPx: number) => handleReachOf({ sidePx: shortestSideOf(box(5, 4)) / metresPerPx, ...SIZES });
    expect(at(0.283)).toBe("none");
    expect(at(0.283 / 2)).toBe("dot");
    expect(at(0.283 / 4)).toBe("target");
  });
});

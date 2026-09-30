import { describe, expect, test } from "bun:test";
import type { XY } from "./measure";
import { nudged, nudgeOfKey } from "./nudge";

const CORNERS: XY[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
];

describe("a corner nudged by the keyboard", () => {
  test("the arrows move it a step east, west, north or south", () => {
    expect(nudgeOfKey("ArrowRight", false)).toEqual({ dx: 0.1, dy: 0 });
    expect(nudgeOfKey("ArrowLeft", false)).toEqual({ dx: -0.1, dy: 0 });
    expect(nudgeOfKey("ArrowUp", false)).toEqual({ dx: 0, dy: 0.1 });
    expect(nudgeOfKey("ArrowDown", false)).toEqual({ dx: 0, dy: -0.1 });
  });

  test("with Shift the step is a metre", () => {
    expect(nudgeOfKey("ArrowUp", true)).toEqual({ dx: 0, dy: 1 });
  });

  test("another key is no nudge", () => {
    expect(nudgeOfKey("Enter", false)).toBeNull();
  });

  test("the selected corner moves, the others stay", () => {
    expect(nudged(CORNERS, 1, { dx: 0.1, dy: 0 })).toEqual([
      { x: 0, y: 0 },
      { x: 10.1, y: 0 },
      { x: 10, y: 10 },
    ]);
  });

  test("a corner that is not there moves nothing", () => {
    expect(nudged(CORNERS, 7, { dx: 1, dy: 0 })).toBe(CORNERS);
  });
});

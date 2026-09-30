import { describe, expect, test } from "bun:test";
import { pathOf, viewBoxOf } from "./plan";

// The plan drawn without WebGL (plan/phase-05-plan.md, step 9): the same layout as an SVG in metres,
// north up. Pure functions; the component draws what they give.

const ROOF: [number, number][] = [
  [0, 0],
  [90, 0],
  [90, 40],
  [0, 40],
];

describe("the view box", () => {
  test("holds the roof with a margin around it, north up: y grows downward in SVG, so it is turned", () => {
    expect(viewBoxOf(ROOF, 5)).toEqual({ minX: -5, minY: -45, width: 100, height: 50 });
  });

  test("of nothing is a small square about the origin", () => {
    expect(viewBoxOf([], 5)).toEqual({ minX: -5, minY: -5, width: 10, height: 10 });
  });
});

describe("the path of a polygon", () => {
  test("goes corner by corner with north up and closes", () => {
    expect(pathOf({ exterior: [[0, 0], [2, 0], [2, 1]], holes: [] })).toBe("M0 0L2 0L2 -1Z");
  });

  test("a hole is a second closed part of the path", () => {
    expect(pathOf({ exterior: [[0, 0], [4, 0], [4, 4]], holes: [[[1, 1], [2, 1], [2, 2]]] })).toBe("M0 0L4 0L4 -4ZM1 -1L2 -1L2 -2Z");
  });

  test("numbers are written with at most three decimals", () => {
    expect(pathOf({ exterior: [[0.123456, 1.0000001], [1, 1], [1, 2]], holes: [] })).toBe("M0.123 -1L1 -1L1 -2Z");
  });
});

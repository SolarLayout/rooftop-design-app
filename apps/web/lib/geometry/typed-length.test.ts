import { describe, expect, test } from "bun:test";
import { edgesOf, type XY } from "./measure";
import { withEdgeLength } from "./typed-length";

const RECTANGLE: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];

const rounded = (points: readonly XY[]) => points.map(({ x, y }) => ({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 }));

describe("a length typed into an edge", () => {
  test("the edge scales about its midpoint: both its corners move, by half the change each", () => {
    const changed = withEdgeLength(RECTANGLE, 0, 100, false);

    expect(rounded(changed)).toEqual([
      { x: -50, y: -20 },
      { x: 50, y: -20 },
      { x: 45, y: 20 },
      { x: -45, y: 20 },
    ]);
    expect(edgesOf(changed)[0]).toBeCloseTo(100, 9);
  });

  test("with the corners squared the rectangle stays one: the opposite edge follows", () => {
    const changed = withEdgeLength(RECTANGLE, 0, 100, true);

    expect(rounded(changed)).toEqual([
      { x: -50, y: -20 },
      { x: 50, y: -20 },
      { x: 50, y: 20 },
      { x: -50, y: 20 },
    ]);
    expect(edgesOf(changed)).toEqual([100, 40, 100, 40]);
  });

  test("the short edge, squared: the long edges follow", () => {
    const changed = withEdgeLength(RECTANGLE, 1, 50, true);

    expect(edgesOf(changed).map((edge) => Math.round(edge * 1000) / 1000)).toEqual([90, 50, 90, 50]);
    expect(rounded(changed)[1]).toEqual({ x: 45, y: -25 });
    expect(rounded(changed)[2]).toEqual({ x: 45, y: 25 });
  });

  test("a turned rectangle stays turned", () => {
    const turned = RECTANGLE.map(({ x, y }) => ({
      x: x * Math.cos(Math.PI / 6) - y * Math.sin(Math.PI / 6),
      y: x * Math.sin(Math.PI / 6) + y * Math.cos(Math.PI / 6),
    }));

    const changed = withEdgeLength(turned, 2, 100, true);

    expect(edgesOf(changed).map((edge) => Math.round(edge * 1000) / 1000)).toEqual([100, 40, 100, 40]);
  });

  test("a polygon that is no rectangle: squared or not, the edge alone scales", () => {
    const five: XY[] = [...RECTANGLE.slice(0, 3), { x: 0, y: 30 }, RECTANGLE[3]];

    const changed = withEdgeLength(five, 0, 100, true);

    expect(rounded(changed).slice(0, 2)).toEqual([
      { x: -50, y: -20 },
      { x: 50, y: -20 },
    ]);
    expect(changed.slice(2)).toEqual(five.slice(2));
  });

  test("a length of nothing or less leaves the outline as it is", () => {
    expect(withEdgeLength(RECTANGLE, 0, 0, true)).toBe(RECTANGLE);
    expect(withEdgeLength(RECTANGLE, 0, -5, true)).toBe(RECTANGLE);
  });
});

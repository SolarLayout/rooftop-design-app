import { describe, expect, test } from "bun:test";
import { areaOf, centroidOf, edgesOf, facingOf, isClockwise, midpointsOf, type XY } from "./measure";

// The 90 by 40 m rectangle of the demo, counter-clockwise from the south-west, around its centre.
const RECTANGLE: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];
const HEXAGON: XY[] = [0, 60, 120, 180, 240, 300].map((degrees) => ({
  x: 10 * Math.cos((degrees * Math.PI) / 180),
  y: 10 * Math.sin((degrees * Math.PI) / 180),
}));

describe("edges", () => {
  test("every edge in the order of the corners, the last closing on the first", () => {
    expect(edgesOf(RECTANGLE)).toEqual([90, 40, 90, 40]);
  });

  test("a hexagon of radius 10 has six edges of 10", () => {
    for (const edge of edgesOf(HEXAGON)) expect(edge).toBeCloseTo(10, 9);
  });

  test("two corners are one edge, not yet closed; one corner is none", () => {
    expect(edgesOf(RECTANGLE.slice(0, 2))).toEqual([90]);
    expect(edgesOf(RECTANGLE.slice(0, 1))).toEqual([]);
  });

  test("the midpoints of the edges, where their labels stand", () => {
    expect(midpointsOf(RECTANGLE)).toEqual([
      { x: 0, y: -20 },
      { x: 45, y: 0 },
      { x: 0, y: 20 },
      { x: -45, y: 0 },
    ]);
  });
});

describe("area and centre", () => {
  test("3,600 m² for the rectangle, whichever way round", () => {
    expect(areaOf(RECTANGLE)).toBe(3600);
    expect(areaOf([...RECTANGLE].reverse())).toBe(3600);
  });

  test("a hexagon of radius 10 has the area of the formula", () => {
    expect(areaOf(HEXAGON)).toBeCloseTo((3 * Math.sqrt(3) * 100) / 2, 9);
  });

  test("fewer than three corners have no area", () => {
    expect(areaOf(RECTANGLE.slice(0, 2))).toBe(0);
  });

  test("the centre of the rectangle is its middle", () => {
    expect(centroidOf(RECTANGLE)).toEqual({ x: 0, y: 0 });
    expect(centroidOf([{ x: 10, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 30 }, { x: 10, y: 30 }])).toEqual({ x: 15, y: 20 });
  });
});

describe("which way round", () => {
  test("the rectangle from the south-west is counter-clockwise; reversed, clockwise", () => {
    expect(isClockwise(RECTANGLE)).toBe(false);
    expect(isClockwise([...RECTANGLE].reverse())).toBe(true);
  });
});

describe("the direction the long side faces", () => {
  test("the rectangle of the demo faces south, 180°, in the north of the world", () => {
    expect(facingOf(RECTANGLE, "north")).toEqual({ degrees: 180, compass: "S" });
  });

  test("in the south of the world the same roof faces north", () => {
    expect(facingOf(RECTANGLE, "south")).toEqual({ degrees: 0, compass: "N" });
  });

  test("a roof whose long side runs north and south faces east or west: the one nearer the equator is no nearer, east is taken", () => {
    const tall: XY[] = [
      { x: -20, y: -45 },
      { x: 20, y: -45 },
      { x: 20, y: 45 },
      { x: -20, y: 45 },
    ];
    expect(facingOf(tall, "north")).toEqual({ degrees: 90, compass: "E" });
  });

  test("a roof turned 30° counter-clockwise faces 150°, south-east", () => {
    const turned = RECTANGLE.map(({ x, y }) => ({
      x: x * Math.cos(Math.PI / 6) - y * Math.sin(Math.PI / 6),
      y: x * Math.sin(Math.PI / 6) + y * Math.cos(Math.PI / 6),
    }));
    const facing = facingOf(turned, "north");
    expect(facing?.degrees).toBeCloseTo(150, 6);
    expect(facing?.compass).toBe("SE");
  });

  test("fewer than three corners face nowhere", () => {
    expect(facingOf(RECTANGLE.slice(0, 2), "north")).toBeNull();
  });
});

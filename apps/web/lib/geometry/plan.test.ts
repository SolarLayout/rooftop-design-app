import { describe, expect, test } from "bun:test";
import type { Obstacle, Roof } from "../api";
import { fittedViewBoxOf, footprintsOf, pathOf, viewBoxOf } from "./plan";

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

const AN_OBSTACLE: Obstacle = { name: "", kind: "box", x: 0, y: 0, length: 1, width: 1, rotation_deg: 0, diameter: 1, height: 1, thickness: 0.2, trunk_height: 2, points: [], auto: false };
const obstacle = (of: Partial<Obstacle>): Obstacle => ({ ...AN_OBSTACLE, ...of });
const roof = (obstacles: Obstacle[]): Roof => ({ lat: 18.52, lon: 73.86, outline: ROOF, roof_type: "flat_tilted", source: "coordinates", obstacles }) as unknown as Roof;

describe("the footprints of the obstacles", () => {
  test("a box is its four corners, turned as the box is; a tank a disc of 24 points; a tree its crown's disc", () => {
    const footprints = footprintsOf(roof([obstacle({ x: 22.5, y: 18, length: 5, width: 4 }), obstacle({ kind: "cylinder", x: 62, y: 24, diameter: 2.5 }), obstacle({ kind: "tree", x: 95, y: 5, diameter: 4 })]));

    expect(footprints.map((polygon) => polygon.exterior.length)).toEqual([4, 24, 24, 24]);
    expect(footprints[0]!.exterior).toEqual([
      [20, 16],
      [25, 16],
      [25, 20],
      [20, 20],
    ]);
    expect(footprints[1]!.exterior[0]).toEqual([63.25, 24]);
  });

  test("a wall is a box per segment; a building its outline; what the engine added itself (the parapet) is none", () => {
    const wall = obstacle({ kind: "wall", points: [[0, 0], [10, 0], [10, 5]], thickness: 0.2 });
    const building = obstacle({ kind: "building", points: [[100, 0], [120, 0], [120, 10]] });
    const parapet = obstacle({ kind: "wall", points: [[0, 0], [90, 0]], auto: true });

    expect(footprintsOf(roof([wall, building, parapet])).map((polygon) => polygon.exterior.length)).toEqual([4, 4, 3]);
    expect(footprintsOf(roof([building]))[0]!.exterior).toEqual([
      [100, 0],
      [120, 0],
      [120, 10],
    ]);
  });
});

describe("the view box fitted to a frame", () => {
  test("a box wider than the frame grows in height about its middle; one taller grows in width", () => {
    expect(fittedViewBoxOf({ minX: 0, minY: 0, width: 100, height: 20 }, { width: 320, height: 180 })).toEqual({ minX: 0, minY: -18.125, width: 100, height: 56.25 });
    expect(fittedViewBoxOf({ minX: 0, minY: 0, width: 20, height: 100 }, { width: 320, height: 180 })).toEqual({ minX: -78.889, minY: 0, width: 177.778, height: 100 });
  });

  test("a box of the frame's own shape is left as it is", () => {
    expect(fittedViewBoxOf({ minX: -3, minY: -43, width: 96, height: 54 }, { width: 320, height: 180 })).toEqual({ minX: -3, minY: -43, width: 96, height: 54 });
  });
});

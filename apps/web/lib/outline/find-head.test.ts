import { describe, expect, test } from "bun:test";
import { buildLabelOf, cornersWordsOf, edgesFactsOf, findHeadOf, MAP_LINE, obstacleLineOf, roofTypeChoicesOf } from "./find-head";
import type { Obstacle } from "./obstacles";
import { outlineAfter, START, type OutlineEvent } from "./outline-state";

// Find's column (V2 · 4, D98): its head follows the step, never the tool; the roof type a question with a default; the
// obstacles in words; Build with the area.

describe("the head of the column", () => {
  test("the first step: find the roof", () => {
    expect(findHeadOf({ stage: "find", touch: false })).toEqual({ title: "Find the roof", line: "Search for the building, then outline its roof on the map." });
  });

  test("outlining: each corner, in the words of the pointer or of touch", () => {
    expect(findHeadOf({ stage: "outline", touch: false })).toEqual({ title: "Outline the roof", line: "Click each corner of the roof. Click the first corner again to close the outline." });
    expect(findHeadOf({ stage: "outline", touch: true }).line).toBe("Press each corner of the roof. Press the first corner again to close the outline.");
  });

  test("the outline closed: what is left, with the roof's area and corners", () => {
    expect(findHeadOf({ stage: "closed", touch: false, area: 3600.4, corners: 4 })).toEqual({
      title: "Add what stands on the roof",
      line: "The roof is outlined: 3,600 m², 4 corners. Add its obstacles, choose its type, then build.",
    });
  });

  test("by hand", () => {
    expect(findHeadOf({ stage: "hand", touch: false })).toEqual({ title: "Enter the roof by hand", line: "Type the roof's length and width. Add its obstacles in the Studio." });
  });
});

describe("the roof type, a question with a default", () => {
  test("three choices with a line each; tilted rows the default, facing the equator", () => {
    expect(roofTypeChoicesOf(18.5)).toEqual([
      { id: "flat_tilted", name: "Flat, rows facing south", line: "Tilted rows, the usual for a flat roof", isDefault: true },
      { id: "flat_ew", name: "Flat, rows facing east and west", line: "Low rows back to back: more modules, less from each", isDefault: false },
      { id: "sloped_flush", name: "Sloped", line: "Modules flush on the slope", isDefault: false },
    ]);
    expect(roofTypeChoicesOf(-33.9)[0]?.name).toBe("Flat, rows facing north");
  });
});

describe("an obstacle in words", () => {
  const obstacle = (change: Partial<Obstacle>): Obstacle => ({ id: 1, name: "Stair room", kind: "box", height: 3, diameter: null, points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }], ...change });

  test("a box: its kind, its sides and its height", () => {
    expect(obstacleLineOf(obstacle({}))).toBe("Box · 5.0 × 4.0 m · 3.0 m high");
  });

  test("a tank and a tree: across; a wall: long; a building: its area", () => {
    expect(obstacleLineOf(obstacle({ kind: "cylinder", points: [{ x: 0, y: 0 }], diameter: 2.5, height: 2 }))).toBe("Tank · 2.5 m across · 2.0 m high");
    expect(obstacleLineOf(obstacle({ kind: "tree", points: [{ x: 0, y: 0 }], diameter: 4, height: 6 }))).toBe("Tree · 4.0 m across · 6.0 m high");
    expect(obstacleLineOf(obstacle({ kind: "wall", points: [{ x: 0, y: 0 }, { x: 12, y: 0 }], height: 1 }))).toBe("Wall · 12.0 m long · 1.0 m high");
    expect(obstacleLineOf(obstacle({ kind: "building", height: 9 }))).toBe("Building · 20 m² · 9.0 m high");
  });
});

describe("Build", () => {
  test("says the area it builds", () => {
    expect(buildLabelOf(3600.4)).toBe("Build this roof · 3,600 m²");
    expect(buildLabelOf(null)).toBe("Build this roof");
  });

  test("the one line on the map for the first outline", () => {
    expect(MAP_LINE).toBe("Drag the roof to move it · drag ○ to turn it");
  });
});

describe("the corners placed, beside Undo and Clear", () => {
  test("none yet, one, or how many", () => {
    expect([0, 1, 3].map(cornersWordsOf)).toEqual(["No corners yet", "1 corner", "3 corners"]);
  });
});

describe("the edges of a closed outline, on one line", () => {
  test("how many, and where the roof faces", () => {
    const corners = [
      { x: -45, y: -20 },
      { x: 45, y: -20 },
      { x: 45, y: 20 },
      { x: -45, y: 20 },
    ];
    const events: OutlineEvent[] = [{ type: "began", at: { lon: 73.86, lat: 18.52 } }, ...corners.map((at): OutlineEvent => ({ type: "placed", at, metresPerPx: 0.283, touch: false })), { type: "close" }];
    expect(edgesFactsOf(events.reduce(outlineAfter, START))).toBe("4 edges · faces 180° S");
  });
});

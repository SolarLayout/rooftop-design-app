import { describe, expect, test } from "bun:test";
import type { XY } from "../geometry/measure";
import { canTurn, isOnRoof, movedOnRoof, obstacleLiftLabelOf } from "./obstacle-move";
import type { Obstacle } from "./obstacles";

// An obstacle picked on Find's map (D79): moved by a drag in steps of 0.1 m, kept on the roof, a box and a
// building turned by their handle, a tank and a wall only moved. Pure, in the metres of the frame.

const ROOF: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];

const box = (x: number, y: number, length = 2, width = 2): Obstacle => ({
  id: 1,
  kind: "box",
  name: "Stair room",
  height: 3,
  diameter: null,
  points: [
    { x, y },
    { x: x + length, y },
    { x: x + length, y: y + width },
    { x, y: y + width },
  ],
});
const TANK: Obstacle = { id: 2, kind: "cylinder", name: "Water tank", height: 2, diameter: 2, points: [{ x: 0, y: 0 }] };

describe("on the roof", () => {
  test("every point of its footprint inside the roof; a tank by its round edge", () => {
    expect(isOnRoof(box(0, 0), ROOF)).toBe(true);
    expect(isOnRoof(box(44, 0), ROOF)).toBe(false);
    expect(isOnRoof(TANK, ROOF)).toBe(true);
    expect(isOnRoof({ ...TANK, points: [{ x: 44.5, y: 0 }] }, ROOF)).toBe(false);
  });
});

describe("moved on the roof", () => {
  test("by what the pointer moved, in steps of 0.1 m", () => {
    const by = movedOnRoof(box(0, 0), { x: 1.04, y: -0.66 }, ROOF);

    expect(by.x).toBeCloseTo(1, 9);
    expect(by.y).toBeCloseTo(-0.7, 9);
  });

  test("it stops at the roof's edge", () => {
    const by = movedOnRoof(box(40, 0), { x: 10, y: 0 }, ROOF);

    expect(by.x).toBeGreaterThanOrEqual(2.9);
    expect(by.x).toBeLessThanOrEqual(3 + 1e-9);
    expect(by.y).toBe(0);
  });

  test("against an edge it slides along it", () => {
    const by = movedOnRoof(box(40, 0), { x: 10, y: 5 }, ROOF);

    expect(by.x).toBeLessThanOrEqual(3 + 1e-9);
    expect(by.y).toBeCloseTo(5, 9);
  });

  test("one that was not on the roof (a building beside it) moves freely", () => {
    const beside: Obstacle = { ...box(50, 0), kind: "building", name: "Building 1" };

    expect(movedOnRoof(beside, { x: 10, y: 0 }, ROOF)).toEqual({ x: 10, y: 0 });
  });
});

describe("what turns", () => {
  test("a box and a building turn; a tank and a wall only move", () => {
    expect(canTurn("box")).toBe(true);
    expect(canTurn("building")).toBe(true);
    expect(canTurn("cylinder")).toBe(false);
    expect(canTurn("wall")).toBe(false);
  });
});

describe("the label of an obstacle lifted", () => {
  test("a move says what it is and how far", () => {
    expect(obstacleLiftLabelOf(box(0, 0), { kind: "move", by: { x: 1.6, y: -0.6 } })).toBe("Stair room · 1.6 m E · 0.6 m S");
  });

  test("a turn says what it is, its size and the turn, clockwise as the compass turns", () => {
    expect(obstacleLiftLabelOf(box(0, 0, 5, 4), { kind: "turn", degrees: -12 })).toBe("Stair room · 5.0 × 4.0 m · turned 12°");
    expect(obstacleLiftLabelOf(box(0, 0, 5, 4), { kind: "turn", degrees: 12.4 })).toBe("Stair room · 5.0 × 4.0 m · turned −12°");
  });
});

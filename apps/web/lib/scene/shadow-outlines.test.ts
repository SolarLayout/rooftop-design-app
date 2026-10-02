import { describe, expect, test } from "bun:test";
import { OUTLINE_LIFT, ringsOf } from "./shadow-outlines";

// The engine's shadow outlines on the roof (plan/phase-06-plan.md, decision 9): every ring of every polygon,
// closed, at the roof's height there, lifted off it as the kept-clear areas are.

describe("the rings of the outlines", () => {
  const square = { exterior: [[0, 0], [2, 0], [2, 2], [0, 2]] as [number, number][], holes: [[[0.5, 0.5], [1, 0.5], [1, 1]]] as [number, number][][] };

  test("every exterior and every hole is a ring of points at the roof's height, lifted", () => {
    const rings = ringsOf([square], () => 1);
    expect(rings).toHaveLength(2);
    expect(rings[0]).toEqual([[0, 0, 1 + OUTLINE_LIFT], [2, 0, 1 + OUTLINE_LIFT], [2, 2, 1 + OUTLINE_LIFT], [0, 2, 1 + OUTLINE_LIFT]]);
    expect(rings[1]).toHaveLength(3);
  });

  test("over the kept-clear areas, which are lifted up to 2 cm and a little more each", () => {
    expect(OUTLINE_LIFT).toBeGreaterThan(0.03);
    expect(OUTLINE_LIFT).toBeLessThan(0.1);
  });

  test("no polygons, no rings", () => {
    expect(ringsOf([], () => 0)).toEqual([]);
  });
});

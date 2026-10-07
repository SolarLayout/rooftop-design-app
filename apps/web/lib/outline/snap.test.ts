import { describe, expect, test } from "bun:test";
import type { XY } from "../geometry/measure";
import { closesOnFirst, snappedCorner } from "./snap";

// Snapping (plan/phase-04-find-and-outline.md): 90° within 3°, parallel to an existing edge within 3°,
// close on the first corner.

const near = (a: XY, b: XY, within = 1e-6) => Math.abs(a.x - b.x) < within && Math.abs(a.y - b.y) < within;

describe("a right angle", () => {
  const before: XY = { x: 0, y: 0 };
  const previous: XY = { x: 90, y: 0 };

  test("a corner within 3° of the right angle is put at it: on the perpendicular, as far along it as the pointer went", () => {
    // 2° off the perpendicular, 40 m along it.
    const off = { x: 90 + 40 * Math.tan((2 * Math.PI) / 180), y: 40 };

    const snapped = snappedCorner({ candidate: off, previous, before, edges: [], within: 3, reach: Infinity, squared: true });

    expect(near(snapped.corner, { x: 90, y: 40 })).toBe(true);
    expect(snapped.snappedTo).toBe("right-angle");
  });

  test("a corner 5° off is left where it is", () => {
    const off = { x: 90 + 40 * Math.sin((5 * Math.PI) / 180), y: 40 * Math.cos((5 * Math.PI) / 180) };

    const snapped = snappedCorner({ candidate: off, previous, before, edges: [], within: 3, reach: Infinity, squared: true });

    expect(snapped.corner).toEqual(off);
    expect(snapped.snappedTo).toBeNull();
  });

  test("with the corners not squared, no right angle is snapped to", () => {
    const off = { x: 90 + 40 * Math.sin((2 * Math.PI) / 180), y: 40 * Math.cos((2 * Math.PI) / 180) };

    const snapped = snappedCorner({ candidate: off, previous, before, edges: [], within: 3, reach: Infinity, squared: false });

    expect(snapped.corner).toEqual(off);
  });

  test("the right angle can turn either way", () => {
    const off = { x: 90 - 40 * Math.tan((2 * Math.PI) / 180), y: -40 };

    const snapped = snappedCorner({ candidate: off, previous, before, edges: [], within: 3, reach: Infinity, squared: true });

    expect(near(snapped.corner, { x: 90, y: -40 })).toBe(true);
  });
});

describe("a snap reaches a few pixels", () => {
  const before: XY = { x: 0, y: 0 };
  const previous: XY = { x: 90, y: 0 };
  // 2° off the perpendicular, 90 m along it: 3.1 m beside the right angle.
  const off = { x: 90 + 90 * Math.tan((2 * Math.PI) / 180), y: 90 };

  test("far from its corner 3° is metres wide: a corner that the snap would carry farther than its reach is left where it is", () => {
    const snapped = snappedCorner({ candidate: off, previous, before, edges: [], within: 3, reach: 0.6, squared: true });

    expect(snapped.corner).toEqual(off);
    expect(snapped.snappedTo).toBeNull();
  });

  test("within its reach it snaps", () => {
    const snapped = snappedCorner({ candidate: off, previous, before, edges: [], within: 3, reach: 3.2, squared: true });

    expect(near(snapped.corner, { x: 90, y: 90 })).toBe(true);
    expect(snapped.snappedTo).toBe("right-angle");
  });

  test("a parallel too far is not snapped to", () => {
    const edges: [XY, XY][] = [[{ x: 0, y: 40 }, { x: 90, y: 40 }]];
    const along = { x: 90 * Math.cos((2 * Math.PI) / 180), y: 90 * Math.sin((2 * Math.PI) / 180) };

    expect(snappedCorner({ candidate: along, previous: { x: 0, y: 0 }, before: null, edges, within: 3, reach: 0.6, squared: true }).snappedTo).toBeNull();
    expect(snappedCorner({ candidate: along, previous: { x: 0, y: 0 }, before: null, edges, within: 3, reach: 4, squared: true }).snappedTo).toBe("parallel");
  });
});

describe("parallel to an edge", () => {
  test("a new edge within 3° of an existing edge's direction is turned to it", () => {
    const edges: [XY, XY][] = [[{ x: 0, y: 0 }, { x: 90, y: 0 }]];
    const previous = { x: 90, y: 40 };
    const off = { x: 0, y: 40 + 90 * Math.tan((2 * Math.PI) / 180) };

    const snapped = snappedCorner({ candidate: off, previous, before: { x: 90, y: 0 }, edges, within: 3, reach: Infinity, squared: false });

    expect(near(snapped.corner, { x: 0, y: 40 })).toBe(true);
    expect(snapped.snappedTo).toBe("parallel");
  });

  test("the right angle is taken before a parallel", () => {
    const edges: [XY, XY][] = [[{ x: 0, y: 0 }, { x: 0, y: 40 }]];
    const before = { x: 0, y: 0 };
    const previous = { x: 90, y: 0 };
    const off = { x: 90 + 40 * Math.sin((2 * Math.PI) / 180), y: 40 * Math.cos((2 * Math.PI) / 180) };

    const snapped = snappedCorner({ candidate: off, previous, before, edges, within: 3, reach: Infinity, squared: true });

    expect(snapped.snappedTo).toBe("right-angle");
  });

  test("the first corner has nothing to snap to", () => {
    const snapped = snappedCorner({ candidate: { x: 1, y: 2 }, previous: null, before: null, edges: [], within: 3, reach: Infinity, squared: true });

    expect(snapped).toEqual({ corner: { x: 1, y: 2 }, snappedTo: null });
  });
});

describe("closing on the first corner", () => {
  test("within the reach, in metres of the map, the outline closes", () => {
    expect(closesOnFirst({ x: 0, y: 0 }, { x: 2, y: 1 }, 12, 0.283)).toBe(true);
  });

  test("beyond it, not", () => {
    expect(closesOnFirst({ x: 0, y: 0 }, { x: 4, y: 0 }, 12, 0.283)).toBe(false);
  });
});

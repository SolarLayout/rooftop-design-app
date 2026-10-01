import { describe, expect, test } from "bun:test";
import { Ray, Vector3 } from "three";
import { heightAlongRay, resizedByCorner, turnedTo } from "./handles";

// The handles of the selected obstacle (plan/phase-05-plan.md, step 19; the board "Obstacle edited on the
// roof"): a corner changes the size with the opposite corner still, the turn handle the rotation snapped to
// the right angles within 3°, the height handle the height. Pure functions in the engine's metres.

const STAIR_ROOM = { x: 22.5, y: 18, length: 5, width: 4, rotationDeg: 0 };

describe("a corner dragged", () => {
  test("the opposite corner stays; the sides follow the pointer, snapped to 0.1 m", () => {
    // The north-east corner of the stair room is at (25, 20); dragged a metre east and half a metre north.
    const box = resizedByCorner(STAIR_ROOM, 2, [26.04, 20.46]);
    expect(box.length).toBeCloseTo(6, 6);
    expect(box.width).toBeCloseTo(4.5, 6);
    expect(box.x).toBeCloseTo(23, 6);
    expect(box.y).toBeCloseTo(18.25, 6);
    expect(box.rotationDeg).toBe(0);
  });

  test("a side is never smaller than a tenth of a metre", () => {
    const box = resizedByCorner(STAIR_ROOM, 2, [19, 15]);
    expect(box.length).toBeGreaterThanOrEqual(0.1);
    expect(box.width).toBeGreaterThanOrEqual(0.1);
  });

  test("a turned box keeps its turn and grows along its own sides", () => {
    const turned = { ...STAIR_ROOM, rotationDeg: 90 };
    // Turned by 90°, its length runs north: the corner at index 2 is now at (20.5, 20.5)... grown 1 m along the length.
    const box = resizedByCorner(turned, 2, [20.5, 21.5]);
    expect(box.rotationDeg).toBe(90);
    expect(box.length).toBeCloseTo(6, 6);
    expect(box.width).toBeCloseTo(4, 6);
  });
});

describe("the turn handle", () => {
  test("the rotation is the bearing of the pointer about the centre, counter-clockwise from east as the engine counts", () => {
    expect(turnedTo(STAIR_ROOM, [22.5, 30])).toBe(0);
    expect(turnedTo(STAIR_ROOM, [10, 18])).toBe(90);
    expect(turnedTo(STAIR_ROOM, [30, 25.5])).toBe(-45);
  });

  test("snaps to a right angle within 3°, and is whole degrees", () => {
    expect(turnedTo(STAIR_ROOM, [22.5 + Math.sin((2 * Math.PI) / 180) * 10, 18 + Math.cos((2 * Math.PI) / 180) * 10])).toBe(0);
    expect(turnedTo(STAIR_ROOM, [22.5 + Math.sin((5 * Math.PI) / 180) * 10, 18 + Math.cos((5 * Math.PI) / 180) * 10])).toBe(-5);
  });
});

describe("the height handle", () => {
  test("the height is where the ray crosses the vertical line through the obstacle's centre, snapped, at least 0.05", () => {
    // A ray from the south, slightly above, toward the centre at (22.5, 18): in three's metres (22.5, y, -18).
    const ray = new Ray(new Vector3(22.5, 3.44, 20), new Vector3(0, 0, -1));
    expect(heightAlongRay(ray, [22.5, 18], 0)).toBe(3.4);
    const low = new Ray(new Vector3(22.5, -2, 20), new Vector3(0, 0, -1));
    expect(heightAlongRay(low, [22.5, 18], 0)).toBe(0.05);
  });

  test("on a sloped roof the height is above the roof there", () => {
    const ray = new Ray(new Vector3(22.5, 5, 20), new Vector3(0, 0, -1));
    expect(heightAlongRay(ray, [22.5, 18], 2)).toBe(3);
  });
});

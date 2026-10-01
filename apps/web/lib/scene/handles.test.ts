import { describe, expect, test } from "bun:test";
import { Ray, Vector3 } from "three";
import type { Obstacle } from "../api";
import { diameterTo, handlePointsOf, heightAlongRay, obstacleByHandle, resizedByCorner, turnedTo } from "./handles";

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

const AN_OBSTACLE: Obstacle = { name: "Stair room", kind: "box", x: 22.5, y: 18, length: 5, width: 4, rotation_deg: 0, diameter: 1, height: 3, thickness: 0.2, trunk_height: 2, points: [], auto: false };
const FLAT = () => 0;
/** The scene about the demo roof's centroid, on a flat roof. */
const ABOUT = { centroid: [45, 20] as const, heightAt: FLAT };

describe("the edge handle of a tank", () => {
  test("the diameter is twice the pointer's distance from the centre, snapped to 0.1 m, at least 0.1", () => {
    expect(diameterTo([62, 24], [63.27, 24])).toBe(2.5);
    expect(diameterTo([62, 24], [62, 25.03])).toBe(2.1);
    expect(diameterTo([62, 24], [62, 24])).toBe(0.1);
  });
});

// The points the handles are placed by (the board "Obstacle edited on the roof"), in the engine's metres: a
// box has a handle at each corner of its top, the turn handle on a stem off the middle of its north edge, the
// height handle on a stem up from the middle of its top; a tank or a tree one at its edge; a wall or a building none.
describe("the points of the handles", () => {
  test("a box: the four corners of its top, the foot and the way of the turn stem, the foot and the way of the height stem", () => {
    const points = Object.fromEntries(handlePointsOf(AN_OBSTACLE, FLAT).map(({ id, at }) => [id, at.map((value) => Number(value.toFixed(6)))]));
    expect(points).toEqual({
      "corner-0": [20, 16, 3],
      "corner-1": [25, 16, 3],
      "corner-2": [25, 20, 3],
      "corner-3": [20, 20, 3],
      "turn-foot": [22.5, 20, 3],
      "turn-north": [22.5, 21, 3],
      "height-foot": [22.5, 18, 3],
      "height-up": [22.5, 18, 4],
    });
  });

  test("a turned box turns its corners and its turn stem with it; the height stem stays upright", () => {
    const points = Object.fromEntries(handlePointsOf({ ...AN_OBSTACLE, rotation_deg: 90 }, FLAT).map(({ id, at }) => [id, at.map((value) => Number(value.toFixed(6)))]));
    expect(points["corner-0"]).toEqual([24.5, 15.5, 3]);
    expect(points["turn-foot"]).toEqual([20.5, 18, 3]);
    expect(points["turn-north"]).toEqual([19.5, 18, 3]);
    expect(points["height-up"]).toEqual([22.5, 18, 4]);
  });

  test("on a sloped roof the top is above the roof under the centre", () => {
    const points = Object.fromEntries(handlePointsOf(AN_OBSTACLE, ([, y]) => -y / 10).map(({ id, at }) => [id, at]));
    expect(points["height-foot"]).toEqual([22.5, 18, 3 - 1.8]);
  });

  test("a tank or a tree: one handle at the east of its edge, at its top; a wall or a building: none", () => {
    expect(handlePointsOf({ ...AN_OBSTACLE, kind: "cylinder", x: 62, y: 24, diameter: 2.5, height: 2 }, FLAT)).toEqual([{ id: "edge", at: [63.25, 24, 2] }]);
    expect(handlePointsOf({ ...AN_OBSTACLE, kind: "tree", diameter: 4, height: 6 }, FLAT)).toEqual([{ id: "edge", at: [24.5, 18, 6] }]);
    expect(handlePointsOf({ ...AN_OBSTACLE, kind: "wall", points: [[0, 0], [5, 0]] }, FLAT)).toEqual([]);
    expect(handlePointsOf({ ...AN_OBSTACLE, kind: "building", points: [[0, 0], [5, 0], [5, 5]] }, FLAT)).toEqual([]);
  });
});

/** A ray straight down onto a point of the plan, in the scene's metres about the centroid. */
const downOnto = ([x, y]: readonly [number, number]) => new Ray(new Vector3(x - 45, 50, -(y - 20)), new Vector3(0, -1, 0));

describe("the obstacle a handle drag gives", () => {
  test("a corner dragged sizes the box; the opposite corner stays", () => {
    const box = obstacleByHandle(AN_OBSTACLE, "corner-2", downOnto([26.04, 20.46]), ABOUT);
    expect(box).toMatchObject({ length: 6, width: 4.5 });
    expect(box.x).toBeCloseTo(23, 6);
    expect(box.y).toBeCloseTo(18.25, 6);
  });

  test("the turn handle dragged due west of the centre turns the box to 90", () => {
    expect(obstacleByHandle(AN_OBSTACLE, "turn", downOnto([10, 18]), ABOUT).rotation_deg).toBe(90);
  });

  test("the height handle takes the height where the ray crosses the line up through the centre", () => {
    // From the south, 3.44 m above the roof, toward the centre.
    const ray = new Ray(new Vector3(22.5 - 45, 3.44, 20), new Vector3(0, 0, -1));
    expect(obstacleByHandle(AN_OBSTACLE, "height", ray, ABOUT).height).toBe(3.4);
  });

  test("the edge handle sets the diameter of a tank", () => {
    const tank: Obstacle = { ...AN_OBSTACLE, kind: "cylinder", x: 62, y: 24, diameter: 2.5, height: 2 };
    expect(obstacleByHandle(tank, "edge", downOnto([63.5, 24]), ABOUT).diameter).toBe(3);
  });

  test("a ray that misses the plane leaves the obstacle as it is", () => {
    const away = new Ray(new Vector3(0, 50, 0), new Vector3(0, 1, 0));
    expect(obstacleByHandle(AN_OBSTACLE, "corner-0", away, ABOUT)).toBe(AN_OBSTACLE);
  });
});

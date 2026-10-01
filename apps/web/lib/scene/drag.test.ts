import { describe, expect, test } from "bun:test";
import { Ray, Vector3 } from "three";
import type { Obstacle } from "../api";
import { halfSidesOf, keptInside, liveWordsOf, movedTo, onTheRoofPlane, sameObstacle, snapped } from "./drag";

// A drag of an obstacle on the roof plane (plan/phase-05-plan.md, step 19, decision 12): the pointer's
// ray against the plane, the place snapped to 0.1 m, the obstacle kept inside the roof.

const ROOF: [number, number][] = [
  [0, 0],
  [90, 0],
  [90, 40],
  [0, 40],
];

describe("the pointer on the roof plane", () => {
  test("a ray from above meets the plane where it points, in the engine's metres about the centroid", () => {
    const ray = new Ray(new Vector3(10, 50, -5), new Vector3(0, -1, 0));
    expect(onTheRoofPlane(ray, 0)).toEqual([10, 5]);
  });

  test("a ray that never meets the plane gives nothing", () => {
    const ray = new Ray(new Vector3(0, 50, 0), new Vector3(0, 1, 0));
    expect(onTheRoofPlane(ray, 0)).toBeNull();
  });

  test("the plane can be at a height, for a sloped roof's mean", () => {
    const ray = new Ray(new Vector3(0, 50, 0), new Vector3(1, -1, 0).normalize());
    expect(onTheRoofPlane(ray, 2)).toEqual([48, 0]);
  });
});

describe("the snap", () => {
  test("to a tenth of a metre", () => {
    expect(snapped([22.54, 17.96])).toEqual([22.5, 18]);
    expect(snapped([-0.04, 0.05])).toEqual([0, 0.1]);
  });
});

describe("kept inside the roof", () => {
  test("a place inside stays where it is", () => {
    expect(keptInside([22.5, 18], ROOF, 2.5, 2)).toEqual([22.5, 18]);
  });

  test("a place too near the edge is brought back by the obstacle's half sides", () => {
    expect(keptInside([89, 18], ROOF, 2.5, 2)).toEqual([87.5, 18]);
    expect(keptInside([1, 1], ROOF, 2.5, 2)).toEqual([2.5, 2]);
  });
});

describe("the obstacle moved", () => {
  test("its centre follows the pointer from where the press began, snapped and kept inside", () => {
    const moved = movedTo({ x: 22.5, y: 18, halfLength: 2.5, halfWidth: 2 }, { from: [30, 30], to: [35.04, 30.02] }, ROOF);
    expect(moved).toEqual([27.5, 18]);
  });
});

// What a drag is while it lasts (decision 12): the obstacle as the pointer has it, of the view until the drop
// commits it; the live label beside the pointer says what changes.
const STAIR_ROOM: Obstacle = { name: "Stair room", kind: "box", x: 22.5, y: 18, length: 5, width: 4, rotation_deg: 0, diameter: 1, height: 3, thickness: 0.2, trunk_height: 2, points: [], auto: false };

describe("the live words of a drag", () => {
  test("a move says where the obstacle stands; a corner its sides; the turn its rotation; the height; an edge its diameter", () => {
    expect(liveWordsOf({ index: 0, by: "move", obstacle: { ...STAIR_ROOM, x: 27.5 } })).toBe("East 27.5 m · North 18.0 m");
    expect(liveWordsOf({ index: 0, by: "corner", obstacle: { ...STAIR_ROOM, length: 6, width: 4.5 } })).toBe("6.0 × 4.5 m");
    expect(liveWordsOf({ index: 0, by: "turn", obstacle: { ...STAIR_ROOM, rotation_deg: 15 } })).toBe("Rotation 15°");
    expect(liveWordsOf({ index: 0, by: "height", obstacle: { ...STAIR_ROOM, height: 3.5 } })).toBe("3.5 m high");
    expect(liveWordsOf({ index: 0, by: "edge", obstacle: { ...STAIR_ROOM, kind: "cylinder", diameter: 2.5 } })).toBe("⌀ 2.5 m");
    expect(liveWordsOf({ index: 0, by: "edge", obstacle: { ...STAIR_ROOM, kind: "tree", diameter: 4 } })).toBe("crown ⌀ 4.0 m");
  });

  test("a place west or south of the middle of the roof is written with the true minus sign", () => {
    expect(liveWordsOf({ index: 0, by: "move", obstacle: { ...STAIR_ROOM, x: -2.5, y: -1 } })).toBe("East −2.5 m · North −1.0 m");
  });
});

describe("the half sides of an obstacle", () => {
  test("a box: half its length and half its width; turned, half the sides of the box around it", () => {
    expect(halfSidesOf(STAIR_ROOM)).toEqual({ halfLength: 2.5, halfWidth: 2 });
    const turned = halfSidesOf({ ...STAIR_ROOM, rotation_deg: 90 });
    expect(turned.halfLength).toBeCloseTo(2, 6);
    expect(turned.halfWidth).toBeCloseTo(2.5, 6);
  });

  test("a tank or a tree: its radius each way", () => {
    expect(halfSidesOf({ ...STAIR_ROOM, kind: "cylinder", diameter: 2.5 })).toEqual({ halfLength: 1.25, halfWidth: 1.25 });
    expect(halfSidesOf({ ...STAIR_ROOM, kind: "tree", diameter: 4 })).toEqual({ halfLength: 2, halfWidth: 2 });
  });
});

describe("whether two obstacles are the same", () => {
  test("the same fields are the same obstacle, however it was made; one field apart is another", () => {
    expect(sameObstacle(STAIR_ROOM, { ...STAIR_ROOM })).toBe(true);
    expect(sameObstacle(STAIR_ROOM, { ...STAIR_ROOM, x: 27.5 })).toBe(false);
    expect(sameObstacle({ ...STAIR_ROOM, points: [[1, 2]] }, { ...STAIR_ROOM, points: [[1, 2]] })).toBe(true);
    expect(sameObstacle({ ...STAIR_ROOM, points: [[1, 2]] }, { ...STAIR_ROOM, points: [[1, 3]] })).toBe(false);
  });
});

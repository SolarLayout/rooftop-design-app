import { describe, expect, test } from "bun:test";
import { Ray, Vector3 } from "three";
import { keptInside, movedTo, onTheRoofPlane, snapped } from "./drag";

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

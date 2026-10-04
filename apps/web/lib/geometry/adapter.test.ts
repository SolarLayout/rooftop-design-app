import { describe, expect, test } from "bun:test";
import { Matrix4, Vector3 } from "three";
import { boxMatrixOf, FLAT, fromScene, toScene, toScenePoint } from "./adapter";

// The engine's metres are x east, y north, z up; three's are x east, y up, z south (plan decision 1).

describe("a point", () => {
  test("east stays east, north goes to minus z, up goes to y", () => {
    expect(toScene([1, 2, 3])).toEqual([1, 3, -2]);
  });

  test("goes back the way it came", () => {
    expect(fromScene(toScene([4.5, -6, 0.1]))).toEqual([4.5, -6, 0.1]);
  });

  test("a point of the plan stands on the roof plane unless a height is given", () => {
    expect(toScenePoint([22.5, 18])).toEqual([22.5, 0, -18]);
    expect(toScenePoint([22.5, 18], 3)).toEqual([22.5, 3, -18]);
  });
});

describe("a flat shape", () => {
  test("a shape drawn in the engine's (x, y) is laid on the roof plane by the flat rotation", () => {
    const north = new Vector3(0, 1, 0).applyEuler(FLAT);
    expect(north.x).toBeCloseTo(0);
    expect(north.y).toBeCloseTo(0);
    expect(north.z).toBeCloseTo(-1);
  });
});

describe("a box", () => {
  const stairRoom = { x: 22.5, y: 18, length: 5, width: 4, height: 3, rotationDeg: 0 };

  test("stands with its middle at half its height, on the roof plane", () => {
    const at = new Vector3().setFromMatrixPosition(boxMatrixOf(stairRoom));
    expect([at.x, at.y, at.z]).toEqual([22.5, 1.5, -18]);
  });

  test("a turn counter-clockwise in the plan turns east toward north", () => {
    const turned = boxMatrixOf({ ...stairRoom, rotationDeg: 90 });
    const east = new Vector3(1, 0, 0).transformDirection(turned);
    expect(east.x).toBeCloseTo(0);
    expect(east.z).toBeCloseTo(-1);
  });

  test("its size is its scale: length along x, height along y, width along z", () => {
    const scale = new Vector3().setFromMatrixScale(boxMatrixOf(stairRoom));
    expect([scale.x, scale.y, scale.z]).toEqual([5, 3, 4]);
  });

  test("a box may stand above the roof", () => {
    const at = new Vector3().setFromMatrixPosition(boxMatrixOf({ ...stairRoom, zBottom: 2 }));
    expect(at.y).toBe(3.5);
    expect(boxMatrixOf(stairRoom)).toBeInstanceOf(Matrix4);
  });
});

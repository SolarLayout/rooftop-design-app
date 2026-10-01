import { describe, expect, test } from "bun:test";
import { OrthographicCamera, PerspectiveCamera } from "three";
import { bearingOf, labelPlacesOf, northWordsOf, pixelOf, rayAt, sameLabels, stemEndOf } from "./projection";

// What the DOM over the stage is told by the camera (plan decision 6): the labels of the roof's edges,
// placed by projection, and the bearing of the north control. Bearings are degrees clockwise from north.

describe("the bearing", () => {
  test("a camera south of the target, looking north, looks along 0", () => {
    expect(bearingOf([0, 30, 100], [0, 0, 0])).toBe(0);
  });

  test("east is 90, south 180, west 270: three's z is south", () => {
    expect(bearingOf([-100, 30, 0], [0, 0, 0])).toBe(90);
    expect(bearingOf([0, 30, -100], [0, 0, 0])).toBe(180);
    expect(bearingOf([100, 30, 0], [0, 0, 0])).toBe(270);
  });

  test("the 3D preset, from the south-west, looks north-east", () => {
    expect(bearingOf([-62, 50, 60], [0, 0, 0])).toBeCloseTo(45.94, 2);
  });

  test("straight down, as the plan looks, is north up", () => {
    expect(bearingOf([0, 100, 0], [0, 0, 0])).toBe(0);
  });

  test("the target moves with the camera: the bearing is of the line between them", () => {
    expect(bearingOf([10, 30, 110], [10, 0, 10])).toBe(0);
  });
});

describe("the words of the north control", () => {
  test.each([
    [0, "North: the view looks north"],
    [0.4, "North: the view looks north"],
    [359.6, "North: the view looks north"],
    [35, "North: the view looks 35° east of north"],
    [45.94, "North: the view looks 46° east of north"],
    [180, "North: the view looks south"],
    [314, "North: the view looks 46° west of north"],
  ])("%p is %p", (bearingDeg, words) => {
    expect(northWordsOf(bearingDeg)).toBe(words);
  });
});

describe("the places of the labels", () => {
  const demo = [
    [0, 0],
    [90, 0],
    [90, 40],
    [0, 40],
  ] as const;

  test("one at the middle of each edge, in the engine's metres, saying the edge's length to one decimal", () => {
    expect(labelPlacesOf(demo, () => 0)).toEqual([
      { words: "90.0 m", at: [45, 0, 0] },
      { words: "40.0 m", at: [90, 20, 0] },
      { words: "90.0 m", at: [45, 40, 0] },
      { words: "40.0 m", at: [0, 20, 0] },
    ]);
  });

  test("on a sloped roof each stands at the roof's height there", () => {
    const heightAt = ([, y]: readonly [number, number]) => y / 10;
    expect(labelPlacesOf(demo, heightAt).map(({ at }) => at[2])).toEqual([0, 2, 4, 2]);
  });

  test("a length is written as a number of the fields: a comma between thousands", () => {
    expect(labelPlacesOf([[0, 0], [1234.56, 0], [0, 1]], () => 0)[0].words).toBe("1,234.6 m");
  });
});

describe("a pixel of the canvas", () => {
  test("the middle of the picture is the middle of the canvas; up is up", () => {
    expect(pixelOf([0, 0], 800, 600)).toEqual([400, 300]);
    expect(pixelOf([-1, 1], 800, 600)).toEqual([0, 0]);
    expect(pixelOf([1, -1], 800, 600)).toEqual([800, 600]);
  });
});

describe("whether the labels changed", () => {
  const label = { kind: "label" as const, words: "90.0 m", x: 100.2, y: 50.4, visible: true };

  test("the same, give or take less than a pixel, is the same", () => {
    expect(sameLabels([label], [{ ...label, x: 100.4, y: 49.6 }])).toBe(true);
  });

  test("a pixel's move, a change of visibility, other words or another count is a change", () => {
    expect(sameLabels([label], [{ ...label, x: 101.2 }])).toBe(false);
    expect(sameLabels([label], [{ ...label, visible: false }])).toBe(false);
    expect(sameLabels([label], [{ ...label, words: "40.0 m" }])).toBe(false);
    expect(sameLabels([label], [label, label])).toBe(false);
    expect(sameLabels([], [])).toBe(true);
  });
});

describe("a label with a name", () => {
  const corner = { kind: "handle" as const, id: "corner-0", words: "", x: 10, y: 10, visible: true };

  test("is the same only under the same name: the handles are told apart by it", () => {
    expect(sameLabels([corner], [{ ...corner }])).toBe(true);
    expect(sameLabels([corner], [{ ...corner, id: "corner-1" }])).toBe(false);
  });
});

// A handle on a stem stands a number of pixels from the stem's foot, the way the stem points on screen.
describe("the end of a stem", () => {
  test("so many pixels from the foot toward the second point, whatever its distance", () => {
    expect(stemEndOf([100, 100], [100, 90], 44)).toEqual([100, 56]);
    expect(stemEndOf([100, 100], [103, 104], 40)).toEqual([124, 132]);
  });

  test("a stem seen end-on has no way to point: no handle", () => {
    expect(stemEndOf([100, 100], [100.2, 100.1], 44)).toBeNull();
  });
});

// A pointer on the DOM over the stage becomes a ray through the camera (plan step 19).
describe("the ray at a pixel", () => {
  /** To six decimals, a minus nought made nought. */
  const rounded = (values: number[]) => values.map((value) => Number(value.toFixed(6)) + 0);

  /** A camera 50 m up looking straight down, north up as the plan's camera is (straight down with up upward has no way to turn). */
  function lookingDown<Kind extends PerspectiveCamera | OrthographicCamera>(camera: Kind): Kind {
    camera.up.set(0, 0, -1);
    camera.position.set(0, 50, 0);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    return camera;
  }

  test("through a perspective camera looking down, the middle of the canvas looks straight down", () => {
    const ray = rayAt(lookingDown(new PerspectiveCamera(45, 4 / 3, 1, 100)), [400, 300], 800, 600);
    expect(rounded(ray.origin.toArray())).toEqual([0, 50, 0]);
    expect(rounded(ray.direction.toArray())).toEqual([0, -1, 0]);
  });

  test("a pixel right of the middle looks right of straight down", () => {
    expect(rayAt(lookingDown(new PerspectiveCamera(45, 4 / 3, 1, 100)), [600, 300], 800, 600).direction.x).toBeGreaterThan(0);
  });

  test("through an orthographic camera every ray is parallel; the origin moves with the pixel", () => {
    const ray = rayAt(lookingDown(new OrthographicCamera(-40, 40, 30, -30, 1, 100)), [600, 300], 800, 600);
    expect(rounded(ray.direction.toArray())).toEqual([0, -1, 0]);
    expect(ray.origin.x).toBeCloseTo(20, 6);
  });
});

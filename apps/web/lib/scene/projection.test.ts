import { describe, expect, test } from "bun:test";
import { bearingOf, labelPlacesOf, northWordsOf, pixelOf, sameLabels } from "./projection";

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

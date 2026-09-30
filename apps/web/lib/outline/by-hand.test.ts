import { describe, expect, test } from "bun:test";
import { cornersOfRectangle, cornersOfTable, isEntered, type ByHand } from "./by-hand";
import { areaOf, edgesOf, facingOf } from "./measure";

// The roof entered by hand (plan/phase-04-plan.md, step 15; the board "Enter dimensions by hand"): a
// rectangle by its length, its width and where its long side faces, or a table of corners, about the
// place typed or found. Pure functions; the outline reducer takes the corners as a roof loaded.

describe("a rectangle by its measurements", () => {
  test("90 by 40 facing south: the corners of the demo, counter-clockwise from the south-west, about the middle", () => {
    expect(cornersOfRectangle(90, 40, 180)).toEqual([
      { x: -45, y: -20 },
      { x: 45, y: -20 },
      { x: 45, y: 20 },
      { x: -45, y: 20 },
    ]);
  });

  test("where the long side faces is what the outline then measures", () => {
    for (const faces of [180, 170, 200, 135, 90]) {
      const corners = cornersOfRectangle(90, 40, faces);
      expect(facingOf(corners, "north")?.degrees).toBeCloseTo(faces, 6);
      expect(edgesOf(corners).map((edge) => Math.round(edge * 1e6) / 1e6)).toEqual([90, 40, 90, 40]);
      expect(areaOf(corners)).toBeCloseTo(3600, 6);
    }
  });

  test("a rectangle is the same shape turned half round: facing north is measured as south, the long side being the same", () => {
    expect(facingOf(cornersOfRectangle(90, 40, 0), "north")?.degrees).toBe(180);
  });

  test("the width may be given as the longer side: the long side is the longer of the two", () => {
    const corners = cornersOfRectangle(40, 90, 180);

    expect(facingOf(corners, "north")?.degrees).toBe(180);
    expect(Math.max(...edgesOf(corners))).toBeCloseTo(90, 9);
  });
});

describe("the corner table", () => {
  test("rows of east and north become corners; a row that is not complete is left out", () => {
    expect(
      cornersOfTable([
        { east: -45, north: -20 },
        { east: 45, north: -20 },
        { east: 45, north: null },
        { east: -45, north: 20 },
      ]),
    ).toEqual([
      { x: -45, y: -20 },
      { x: 45, y: -20 },
      { x: -45, y: 20 },
    ]);
  });
});

describe("what is entered", () => {
  const entered: ByHand = { lat: 18.52, lon: 73.86, shape: "rectangle", length: 90, width: 40, faces: 180, rows: [] };

  test("a rectangle is entered once the place and its three numbers are there; the corners are its", () => {
    expect(isEntered(entered)).toEqual({ at: { lat: 18.52, lon: 73.86 }, corners: cornersOfRectangle(90, 40, 180) });
    expect(isEntered({ ...entered, width: null })).toBeNull();
    expect(isEntered({ ...entered, lat: null })).toBeNull();
  });

  test("a table is entered once the place is there and three rows are complete", () => {
    const rows = [
      { east: 0, north: 0 },
      { east: 30, north: 0 },
      { east: 30, north: 14 },
    ];
    expect(isEntered({ ...entered, shape: "corners", rows })?.corners).toEqual(cornersOfTable(rows));
    expect(isEntered({ ...entered, shape: "corners", rows: rows.slice(0, 2) })).toBeNull();
  });
});

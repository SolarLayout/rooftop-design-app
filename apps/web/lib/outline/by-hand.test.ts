import { describe, expect, test } from "bun:test";
import { cornersOfRectangle, cornersOfTable, isEntered, LONG_SIDE_FACES, CORNERS_HINT, NOTHING_ENTERED, PLACE_HINT, placeOfPaste, type ByHand } from "./by-hand";
import { areaOf, edgesOf, facingOf } from "../geometry/measure";

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

// V2 · 4 (the board "Find", by hand): the long side faces one of four directions, south at first.
describe("where the long side faces", () => {
  test("four choices in degrees from north, south first as the board has it", () => {
    expect(LONG_SIDE_FACES).toEqual([
      { value: 180, label: "South" },
      { value: 90, label: "East" },
      { value: 0, label: "North" },
      { value: 270, label: "West" },
    ]);
  });

  test("nothing entered faces south, so that the length and the width draw the roof", () => {
    expect(NOTHING_ENTERED.faces).toBe(180);
  });
});

// Issue 238, item 19: the corners are placed about the place typed or found (isEntered), which need not be the roof's centre.
describe("the hint of the corner table", () => {
  test("says the corners are about the place", () => {
    expect(CORNERS_HINT).toBe("Type each corner in metres east and north of the place, in order. At least 3.");
    const rows = [
      { east: 10, north: 0 },
      { east: 40, north: 0 },
      { east: 40, north: 14 },
    ];
    // Not about their own middle: the corners stand where they were typed from the place.
    expect(isEntered({ ...NOTHING_ENTERED, lat: 18.5, lon: 73.9, shape: "corners", rows })?.corners[0]).toEqual({ x: 10, y: 0 });
  });
});

// Issue 238, item 4: without a map there is no search, so the Place fields take a pasted place whole, as the search reads it.
describe("a place pasted into a field of Place", () => {
  test("coordinates, as a pair, fill both fields", () => {
    expect(placeOfPaste("18.53681, 73.89428")).toEqual({ lat: 18.53681, lon: 73.89428 });
    expect(placeOfPaste("18°32′12.5″N 73°53′39.4″E")?.lat).toBeCloseTo(18.53681, 4);
  });

  test("a maps link that holds the place fills both fields", () => {
    expect(placeOfPaste("https://www.google.com/maps/@18.53681,73.89428,19z")).toEqual({ lat: 18.53681, lon: 73.89428 });
  });

  test("the hint under the fields says so", () => {
    expect(PLACE_HINT).toBe("North and east positive, to 5 decimals. A pair or a maps link pasted fills both.");
  });

  test("one number, words, or coordinates that cannot be read are left to the field", () => {
    expect(placeOfPaste("18.53681")).toBeNull();
    expect(placeOfPaste("Koregaon Park")).toBeNull();
    expect(placeOfPaste("98.5, 73.9")).toBeNull();
  });
});

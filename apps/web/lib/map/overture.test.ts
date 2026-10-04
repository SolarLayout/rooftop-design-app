import { describe, expect, test } from "bun:test";
import { edgesOf } from "../geometry/measure";
import { footprintOutline, FOOTPRINTS_ATTRIBUTION, FOOTPRINTS_URL, ringOf } from "./overture";

// A footprint of Overture, as a tile gives it, to the corners of an outline. The 90 by 40 m rectangle of
// the demo, at Pune, as the API projects it (test_roof_map.py).
const RECTANGLE = [
  [73.8595749364774, 18.519816702284242],
  [73.86042745851117, 18.51982184272995],
  [73.86042506447365, 18.52018329680534],
  [73.85957254064984, 18.520178156252225],
];

describe("the ring of a footprint", () => {
  test("a polygon's outer ring, without the point that closes it", () => {
    expect(ringOf({ type: "Polygon", coordinates: [[...RECTANGLE, RECTANGLE[0]]] })).toEqual(RECTANGLE);
  });

  test("a ring that is not closed is taken as it is", () => {
    expect(ringOf({ type: "Polygon", coordinates: [RECTANGLE] })).toEqual(RECTANGLE);
  });

  test("of a building in pieces, the largest piece", () => {
    const small = [
      [73.861, 18.521],
      [73.8611, 18.521],
      [73.8611, 18.5211],
      [73.861, 18.5211],
    ];
    expect(ringOf({ type: "MultiPolygon", coordinates: [[[...small, small[0]]], [[...RECTANGLE, RECTANGLE[0]]]] })).toEqual(RECTANGLE);
  });

  test("a point, a line or a ring of two is no footprint", () => {
    expect(ringOf({ type: "Point", coordinates: [73.86, 18.52] })).toBeNull();
    expect(ringOf({ type: "Polygon", coordinates: [[RECTANGLE[0], RECTANGLE[1]]] })).toBeNull();
  });
});

describe("the footprint as an outline", () => {
  test("its corners in metres around its centre: the demo's rectangle comes out 90 by 40 within 0.05 m", () => {
    const found = footprintOutline({ type: "Polygon", coordinates: [[...RECTANGLE, RECTANGLE[0]]] })!;

    expect(found.frame.centre.lon).toBeCloseTo(73.86, 6);
    expect(found.frame.centre.lat).toBeCloseTo(18.52, 6);
    edgesOf(found.corners).forEach((edge, n) => expect(Math.abs(edge - [90, 40, 90, 40][n])).toBeLessThan(0.05));
  });

  test("nothing of what is no footprint", () => {
    expect(footprintOutline({ type: "Point", coordinates: [0, 0] })).toBeNull();
  });
});

test("the release is pinned in the address, and the attribution is ODbL's", () => {
  expect(FOOTPRINTS_URL).toBe("https://tiles.overturemaps.org/2026-09-23.1/buildings.pmtiles");
  expect(FOOTPRINTS_ATTRIBUTION).toBe("© Overture Maps Foundation, ODbL");
});

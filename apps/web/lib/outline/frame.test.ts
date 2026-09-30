import { describe, expect, test } from "bun:test";
import { frameAt, toLonLat, toMetres } from "./frame";

// A flat frame in metres around a place on the map, for what is shown while the user draws. The
// document's metres come from the API (decision D41); this frame differs from them by the scale of the
// projection (lengths within 0.05 m over 100 m) and by the convergence of the grid: the API's y is the
// grid north of its UTM zone, which at Pune is turned 0.36° from true north.

const PUNE = { lon: 73.86, lat: 18.52 };

describe("the frame", () => {
  test("its centre is at (0, 0)", () => {
    expect(toMetres(frameAt(PUNE), PUNE)).toEqual({ x: 0, y: 0 });
  });

  test("x is east, y is north", () => {
    const frame = frameAt(PUNE);
    const east = toMetres(frame, { lon: 73.861, lat: 18.52 });
    const north = toMetres(frame, { lon: 73.86, lat: 18.521 });

    expect(east.x).toBeGreaterThan(0);
    expect(east.y).toBeCloseTo(0, 6);
    expect(north.y).toBeGreaterThan(0);
    expect(north.x).toBeCloseTo(0, 6);
  });

  test("the corners of the demo's roof, as the API gives them, come back within the turn of the grid, the edges within 5 cm", () => {
    // The API's projection (UTM 43N) of a 90 by 40 m rectangle centred on Pune (test_roof_map.py).
    const frame = frameAt(PUNE);
    const corners = [
      [73.8595749364774, 18.519816702284242],
      [73.86042745851117, 18.51982184272995],
      [73.86042506447365, 18.52018329680534],
      [73.85957254064984, 18.520178156252225],
    ];
    const expected = [
      [-45, -20],
      [45, -20],
      [45, 20],
      [-45, 20],
    ];
    const points = corners.map(([lon, lat]) => toMetres(frame, { lon, lat }));
    points.forEach(({ x, y }, n) => {
      // 45 m from the centre, turned by 0.36°: under 0.3 m.
      expect(Math.abs(x - expected[n][0])).toBeLessThan(0.3);
      expect(Math.abs(y - expected[n][1])).toBeLessThan(0.3);
    });
    const edges = points.map((point, n) => Math.hypot(points[(n + 1) % 4].x - point.x, points[(n + 1) % 4].y - point.y));
    [90, 40, 90, 40].forEach((length, n) => expect(Math.abs(edges[n] - length)).toBeLessThan(0.05));
  });

  test("metres go back to the place they came from", () => {
    const frame = frameAt(PUNE);
    const there = { lon: 73.8612345, lat: 18.5198765 };

    const back = toLonLat(frame, toMetres(frame, there));

    expect(back.lon).toBeCloseTo(there.lon, 9);
    expect(back.lat).toBeCloseTo(there.lat, 9);
  });
});

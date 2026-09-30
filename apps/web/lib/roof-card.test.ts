import { describe, expect, test } from "bun:test";
import type { Roof } from "./api";
import { roofCardOf } from "./roof-card";

const roof = (changes: Partial<Roof> = {}): Roof =>
  ({
    outline: [
      [-45, -20],
      [45, -20],
      [45, 20],
      [-45, 20],
    ],
    lat: 18.52,
    lon: 73.86,
    roof_type: "flat_tilted",
    source: "map",
    obstacles: [],
    parapet_h: 0.9,
    setback_m: 1,
    walkway_m: 0.6,
    walkway_every_modules: 24,
    walkway_every_rows: 4,
    obstacle_clearance_m: 0.5,
    slope_deg: 0,
    slope_azimuth_deg: 180,
    albedo: 0.2,
    ...changes,
  }) as Roof;

describe("the card of the roof in the Roof lens", () => {
  test("the demo's roof, outlined on the map: where, how, and its size and direction", () => {
    expect(roofCardOf(roof())).toEqual({
      place: "18.52000° N, 73.86000° E",
      how: "Outlined on satellite · 4 corners",
      size: "90.0 × 40.0 m · faces 180° S",
    });
  });

  test("a roof entered by hand, or read from a file, says so", () => {
    expect(roofCardOf(roof({ source: "coordinates" })).how).toBe("Entered by hand · 4 corners");
    expect(roofCardOf(roof({ source: "kmz" })).how).toBe("From a file · 4 corners");
    expect(roofCardOf(roof({ source: "dxf" })).how).toBe("From a file · 4 corners");
  });

  test("the obstacles are counted, when there are any", () => {
    const tank: Roof["obstacles"][number] = { name: "Tank 1", kind: "cylinder", x: 30, y: 10, length: 2, width: 2, rotation_deg: 0, diameter: 2.5, height: 2, thickness: 0.2, trunk_height: 2, points: [], auto: false };

    expect(roofCardOf(roof({ obstacles: [tank] })).how).toBe("Outlined on satellite · 4 corners · 1 obstacle");
    expect(roofCardOf(roof({ obstacles: [tank, { ...tank, name: "Tank 2" }] })).how).toBe("Outlined on satellite · 4 corners · 2 obstacles");
  });

  test("a roof that is no rectangle is said by its area", () => {
    const five = roof({
      outline: [
        [-45, -20],
        [45, -20],
        [45, 20],
        [0, 30],
        [-45, 20],
      ],
    });

    expect(roofCardOf(five)).toMatchObject({ how: "Outlined on satellite · 5 corners", size: "4,050 m² · faces 180° S" });
  });

  test("the direction is taken toward the equator, in the south of the world too", () => {
    expect(roofCardOf(roof({ lat: -33.87, lon: 151.21 })).size).toBe("90.0 × 40.0 m · faces 0° N");
  });
});

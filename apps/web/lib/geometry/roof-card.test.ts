import { describe, expect, test } from "bun:test";
import type { Roof } from "../api";
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
  test("the demo's roof, outlined on the map: where, how, what it has, and its size and direction", () => {
    expect(roofCardOf(roof())).toEqual({
      place: "18.52000° N, 73.86000° E",
      how: "Outlined on satellite",
      count: "4 corners",
      size: "90.0 × 40.0 m · long side faces 180° S",
      file: null,
    });
  });

  test("a roof entered by hand, or read from a file, says so; the file is named", () => {
    expect(roofCardOf(roof({ source: "coordinates" })).how).toBe("By hand");
    expect(roofCardOf(roof({ source: "kmz" }), "roof.kmz")).toMatchObject({ how: "From a file", file: "roof.kmz" });
    expect(roofCardOf(roof({ source: "dxf" }), "warehouse-roof.dxf")).toMatchObject({ how: "From a file", file: "warehouse-roof.dxf" });
  });

  test("a file's name is shown only when the roof came from a file", () => {
    expect(roofCardOf(roof({ source: "map" }), "roof.kmz").file).toBeNull();
    expect(roofCardOf(roof({ source: "kmz" }), "").file).toBeNull();
  });

  test("the obstacles are counted, when there are any; what the engine added itself is not", () => {
    const tank: Roof["obstacles"][number] = { name: "Tank 1", kind: "cylinder", x: 30, y: 10, length: 2, width: 2, rotation_deg: 0, diameter: 2.5, height: 2, thickness: 0.2, trunk_height: 2, points: [], auto: false };

    expect(roofCardOf(roof({ obstacles: [tank] })).count).toBe("4 corners · 1 obstacle");
    expect(roofCardOf(roof({ obstacles: [tank, { ...tank, name: "Tank 2" }] })).count).toBe("4 corners · 2 obstacles");
    expect(roofCardOf(roof({ obstacles: [tank, { ...tank, name: "Parapet", auto: true }] })).count).toBe("4 corners · 1 obstacle");
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

    expect(roofCardOf(five)).toMatchObject({ count: "5 corners", size: "4,050 m² · long side faces 180° S" });
  });

  test("the direction is taken toward the equator, in the south of the world too", () => {
    expect(roofCardOf(roof({ lat: -33.87, lon: 151.21 })).size).toBe("90.0 × 40.0 m · long side faces 0° N");
  });
});

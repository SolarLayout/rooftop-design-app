import { describe, expect, test } from "bun:test";
import type { Roof } from "../api";
import { edgesFactsOf, obstaclesFactsOf, placeFactsOf, ROOF_FIELDS, roofFieldsOf, roofTypeFactsOf, withRoofField } from "./roof-fields";

// The fields of the Roof lens (plan/phase-05-plan.md, step 11, decision 20), from
// plan/reference/functional-inventory.md, 1.1: each with its unit, its range and its decimals.

const DEMO = {
  outline: [
    [0, 0],
    [90, 0],
    [90, 40],
    [0, 40],
  ],
  lat: 18.52,
  lon: 73.86,
  roof_type: "flat_tilted",
  parapet_h: 0.9,
  setback_m: 1,
  walkway_m: 0.6,
  walkway_every_modules: 24,
  walkway_every_rows: 4,
  obstacle_clearance_m: 0.5,
  slope_deg: 0,
  slope_azimuth_deg: 180,
  albedo: 0.2,
  source: "coordinates",
  obstacles: [],
} as unknown as Roof;

describe("the fields", () => {
  test("of a flat roof with tilted rows: the edges and access, the walkway every so many modules", () => {
    expect(roofFieldsOf(DEMO).map((field) => [field.id, field.label, field.value, field.unit])).toEqual([
      ["parapet_h", "Parapet", 0.9, "m"],
      ["setback_m", "Setback", 1, "m"],
      ["walkway_m", "Walkway", 0.6, "m"],
      ["walkway_every_modules", "Every", 24, "mod"],
      ["obstacle_clearance_m", "Clearance", 0.5, "m"],
      ["albedo", "Albedo", 0.2, undefined],
    ]);
  });

  test("of an east-west or a sloped roof the walkway is every so many rows", () => {
    const fields = roofFieldsOf({ ...DEMO, roof_type: "flat_ew" });
    expect(fields.find((field) => field.id === "walkway_every_rows")).toMatchObject({ label: "Every", value: 4, unit: "rows" });
    expect(fields.some((field) => field.id === "walkway_every_modules")).toBe(false);
  });

  test("a sloped roof has its pitch and where it faces, after the edges", () => {
    const fields = roofFieldsOf({ ...DEMO, roof_type: "sloped_flush", slope_deg: 10 });
    expect(fields.slice(-2).map((field) => [field.id, field.value, field.unit])).toEqual([
      ["slope_deg", 10, "°"],
      ["slope_azimuth_deg", 180, "°"],
    ]);
  });

  test("the ranges and decimals are the inventory's", () => {
    expect(ROOF_FIELDS.parapet_h.range).toEqual({ min: 0, max: 5, decimals: 2 });
    expect(ROOF_FIELDS.setback_m.range).toEqual({ min: 0, max: 10, decimals: 2 });
    expect(ROOF_FIELDS.walkway_m.range).toEqual({ min: 0, max: 3, decimals: 2 });
    expect(ROOF_FIELDS.walkway_every_modules.range).toEqual({ min: 0, max: 500, decimals: 0 });
    expect(ROOF_FIELDS.obstacle_clearance_m.range).toEqual({ min: 0, max: 5, decimals: 2 });
    expect(ROOF_FIELDS.albedo.range).toEqual({ min: 0.05, max: 0.9, decimals: 2 });
    expect(ROOF_FIELDS.slope_deg.range).toEqual({ min: 0, max: 60, decimals: 0 });
    expect(ROOF_FIELDS.slope_azimuth_deg.range).toEqual({ min: 0, max: 359.9, decimals: 1 });
  });

});

describe("the edit a field makes", () => {
  test("sets the value on the roof and leaves the rest as it was", () => {
    const after = withRoofField(DEMO, "parapet_h", 1.2);
    expect(after.parapet_h).toBe(1.2);
    expect(after.setback_m).toBe(1);
    expect(after).not.toBe(DEMO);
  });

  test("the same value is the same roof", () => {
    expect(withRoofField(DEMO, "parapet_h", 0.9)).toBe(DEMO);
  });
});

describe("who set each field (V2 · 3)", () => {
  test("a field at the API's default is the app's", () => {
    expect(roofFieldsOf(DEMO).map((field) => field.setBy.kind)).toEqual(["default", "default", "default", "default", "default", "default"]);
  });

  test("a field typed by the user is Yours, with the default it can be given back", () => {
    const parapet = roofFieldsOf({ ...DEMO, parapet_h: 1.2 })[0];
    expect(parapet?.setBy).toEqual({ kind: "yours", byDefault: "0.90 m" });
    expect(parapet?.byDefault).toBe(0.9);
  });

  test("a sloped roof's default parapet is none and its pitch the roof type's", () => {
    const fields = roofFieldsOf({ ...DEMO, roof_type: "sloped_flush", parapet_h: 0, slope_deg: 10 });
    expect(fields.find((field) => field.id === "parapet_h")?.setBy.kind).toBe("default");
    expect(fields.find((field) => field.id === "slope_deg")?.setBy.kind).toBe("default");
  });
});

describe("the facts of each section, on one line (V2 · 3)", () => {
  test("the roof type in its words", () => {
    expect(roofTypeFactsOf(DEMO)).toBe("Flat, tilted rows · rows facing the equator");
    expect(roofTypeFactsOf({ ...DEMO, roof_type: "sloped_flush" })).toBe("Sloped, flush · modules follow the roof pitch");
  });

  test("the edges: the parapet and the setback", () => {
    expect(edgesFactsOf(DEMO)).toBe("Parapet 0.90 m · setback 1.00 m");
    expect(edgesFactsOf({ ...DEMO, parapet_h: 0 })).toBe("No parapet · setback 1.00 m");
  });

  test("the obstacles by name, those of one kind counted", () => {
    const named = (...names: string[]) => names.map((name) => ({ name })) as unknown as Roof["obstacles"];
    expect(obstaclesFactsOf(named("Stair room", "Water tank", "AC unit 1", "AC unit 2", "AC unit 3", "AC unit 4"))).toBe("Stair room, water tank, 4 AC units");
    expect(obstaclesFactsOf(named("Tree"))).toBe("Tree");
    expect(obstaclesFactsOf([])).toBe("None on the roof");
  });

  test("the place in degrees, to two decimals", () => {
    expect(placeFactsOf(DEMO)).toBe("18.52° N, 73.86° E");
    expect(placeFactsOf({ ...DEMO, lat: -33.868, lon: -151.2 })).toBe("33.87° S, 151.20° W");
  });
});

import { describe, expect, test } from "bun:test";
import type { Roof } from "../api";
import { albedoLineOf, outlineFactsOf, edgesFactsOf, obstaclesFactsOf, placeFactsOf, ROOF_FIELDS, roofFieldsOf, roofGroupsOf, roofTypeFactsOf, withRoofField } from "./roof-fields";

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
  test("of a flat roof with tilted rows: the edges and access in plain words, the walkway every so many modules; the albedo is Performance's", () => {
    expect(roofFieldsOf(DEMO).map((field) => [field.id, field.label, field.value, field.unit])).toEqual([
      ["parapet_h", "Parapet height", 0.9, "m"],
      ["setback_m", "Edge margin (setback)", 1, "m"],
      ["walkway_m", "Walkway width", 0.6, "m"],
      ["walkway_every_modules", "Walkway every", 24, "modules"],
      ["obstacle_clearance_m", "Clearance", 0.5, "m"],
    ]);
  });

  test("of an east-west or a sloped roof the walkway is every so many rows", () => {
    const fields = roofFieldsOf({ ...DEMO, roof_type: "flat_ew" });
    expect(fields.find((field) => field.id === "walkway_every_rows")).toMatchObject({ label: "Walkway every", value: 4, unit: "rows" });
    expect(fields.some((field) => field.id === "walkway_every_modules")).toBe(false);
  });

  test("a sloped roof has its pitch and where it faces, after the edges", () => {
    const fields = roofFieldsOf({ ...DEMO, roof_type: "sloped_flush", slope_deg: 10 });
    expect(fields.slice(-2).map((field) => [field.id, field.label, field.value, field.unit])).toEqual([
      ["slope_deg", "Roof pitch", 10, "°"],
      ["slope_azimuth_deg", "Direction (azimuth)", 180, "°"],
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
    expect(roofFieldsOf(DEMO).map((field) => field.setBy.kind)).toEqual(["default", "default", "default", "default", "default"]);
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
    expect(edgesFactsOf(DEMO)).toBe("Parapet 0.90 m · edge margin 1.00 m");
    expect(edgesFactsOf({ ...DEMO, parapet_h: 0 })).toBe("No parapet · edge margin 1.00 m");
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

// Fields stand in groups of what belongs together (V2 · 7, D103; the board "The Roof and Array steps"), each with the usual
// thing said under its label while the app's value stands.
describe("the groups of Edges and access", () => {
  test("at the edges, access, round obstacles, in that order, each field with its hint", () => {
    const groups = roofGroupsOf(DEMO);

    expect(groups.map((group) => [group.title, group.fields.map((field) => field.id)])).toEqual([
      ["At the edges", ["parapet_h", "setback_m"]],
      ["Access", ["walkway_m", "walkway_every_modules"]],
      ["Around obstacles", ["obstacle_clearance_m"]],
    ]);
  });

  test("the app's value is a Default with the usual thing after it; the user's is Yours, with the default it took the place of", () => {
    const fields = roofGroupsOf(DEMO).flatMap((group) => group.fields);
    const hints = Object.fromEntries(fields.map((field) => [field.id, field.hint]));

    expect(hints).toEqual({
      parapet_h: "Default · measure it on site",
      setback_m: "Default · usually 0.5 to 1.5 m",
      walkway_m: "Default",
      walkway_every_modules: "Default · one across each row",
      obstacle_clearance_m: "Default · kept free on every side",
    });
    const changed = roofGroupsOf({ ...DEMO, parapet_h: 1.2 }).flatMap((group) => group.fields).find((field) => field.id === "parapet_h");
    expect(changed?.hint).toBe("Yours · default 0.90 m");
  });

  test("a sloped roof adds the slope as a group of its own", () => {
    expect(roofGroupsOf({ ...DEMO, roof_type: "sloped_flush" }).map((group) => group.title)).toEqual(["At the edges", "Access", "Around obstacles", "Sloped roof"]);
  });
});

describe("the albedo has one home", () => {
  test("the Roof step points to Performance's assumptions with the value", () => {
    expect(albedoLineOf(DEMO)).toBe("Roof albedo 0.20 · in Performance, Assumptions");
  });
});

describe("the outline's line (V2 · 7)", () => {
  test("where the roof is, its area, and where it is edited: in the plan of the Roof step", () => {
    expect(outlineFactsOf(DEMO, 3600)).toBe("18.52° N, 73.86° E · 3,600 m² · Edit it in Plan");
    expect(outlineFactsOf(DEMO, null)).toBe("18.52° N, 73.86° E · Edit it in Plan");
  });
});

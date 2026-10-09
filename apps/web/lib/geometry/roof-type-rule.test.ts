import { describe, expect, test } from "bun:test";
import type { Roof } from "../api";
import { roofAfterBuild, withRoofType } from "./roof-type-rule";

// The roof type as a committed edit (plan/reference/functional-inventory.md, 1.1): a roof made sloped
// loses its parapet and gets a pitch, as the desktop app did; the demo's 1,068 positions are of that.

const DEMO = { roof_type: "flat_tilted", parapet_h: 0.9, slope_deg: 0, slope_azimuth_deg: 180 } as Roof;

describe("the roof type", () => {
  test("the same type is the same roof", () => {
    expect(withRoofType(DEMO, "flat_tilted")).toBe(DEMO);
  });

  test("east-west keeps the parapet", () => {
    expect(withRoofType(DEMO, "flat_ew")).toEqual({ ...DEMO, roof_type: "flat_ew" });
  });

  test("sloped takes the parapet away and gives a pitch of 10° where there was none", () => {
    expect(withRoofType(DEMO, "sloped_flush")).toEqual({ ...DEMO, roof_type: "sloped_flush", parapet_h: 0, slope_deg: 10 });
  });

  test("a pitch already set stays", () => {
    expect(withRoofType({ ...DEMO, slope_deg: 25 }, "sloped_flush").slope_deg).toBe(25);
  });

  test("back from sloped the parapet stays as it is: nothing is guessed back", () => {
    const sloped = withRoofType(DEMO, "sloped_flush");
    expect(withRoofType(sloped, "flat_tilted")).toEqual({ ...sloped, roof_type: "flat_tilted" });
  });
});

// A roof built again on Find for the design that is edited (#169): its geometry and source come from the build, its type
// through the same rule as the Roof lens, so Sloped chosen on Find is the roof Sloped chosen in the lens is.
describe("a roof built again on Find", () => {
  const OPEN = { ...DEMO, outline: [[0, 0], [10, 0], [10, 5]], lat: 18.5, lon: 73.8, obstacles: [], source: "map" } as unknown as Roof;
  const BUILT = { ...OPEN, outline: [[0, 0], [12, 0], [12, 6]], lat: 18.6, lon: 73.9, source: "coordinates", parapet_h: 0.9, slope_deg: 0 } as unknown as Roof;

  test("made sloped on Find: no parapet, and a pitch of 10° where there was none, as in the Roof lens", () => {
    const roof = roofAfterBuild(OPEN, { ...BUILT, roof_type: "sloped_flush" });
    expect(roof.roof_type).toBe("sloped_flush");
    expect(roof.parapet_h).toBe(0);
    expect(roof.slope_deg).toBe(10);
  });

  test("still sloped: the parapet and the pitch set in the Roof lens stay", () => {
    const sloped = { ...OPEN, roof_type: "sloped_flush", parapet_h: 0.3, slope_deg: 25 } as Roof;
    const roof = roofAfterBuild(sloped, { ...BUILT, roof_type: "sloped_flush" });
    expect(roof.parapet_h).toBe(0.3);
    expect(roof.slope_deg).toBe(25);
  });

  test("the outline, the place, the obstacles and the source are the build's; the rest is the design's", () => {
    const roof = roofAfterBuild({ ...OPEN, setback_m: 1.5 } as Roof, BUILT);
    expect(roof.outline).toEqual(BUILT.outline);
    expect([roof.lat, roof.lon, roof.source]).toEqual([BUILT.lat, BUILT.lon, BUILT.source]);
    expect((roof as Roof & { setback_m: number }).setback_m).toBe(1.5);
    expect(roof.parapet_h).toBe(0.9);
  });
});

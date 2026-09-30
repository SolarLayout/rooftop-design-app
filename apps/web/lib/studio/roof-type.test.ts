import { describe, expect, test } from "bun:test";
import type { Roof } from "../api";
import { withRoofType } from "./roof-type";

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

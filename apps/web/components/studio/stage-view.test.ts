import { describe, expect, test } from "bun:test";
import { subLineOf } from "./stage-view";
import type { LayoutReadouts } from "@/lib/api";

// The line under the lens's title on the stage: the roof's areas on the Roof lens, the positions on the
// Array lens (the boards "Studio, Roof lens" and "Studio, Array lens"), of the layout's read-outs.

const DEMO: LayoutReadouts = {
  positions: 790,
  tables: 28,
  rows: 6,
  pitch_m: 6.45,
  gcr: 0.709,
  profile_angle_deg: 30.5,
  roof_area_m2: 3600,
  inside_setback_area_m2: 3344,
  usable_area_m2: 3184,
  keepout_area_m2: 150,
  module_area_m2: 1646.4,
};

describe("the line under the title", () => {
  test("the Roof lens says the areas and counts the obstacles", () => {
    expect(subLineOf("roof", DEMO, 6)).toBe("3,600 m² · 3,344 m² inside the setback · 6 obstacles");
    expect(subLineOf("roof", DEMO, 1)).toBe("3,600 m² · 3,344 m² inside the setback · 1 obstacle");
    expect(subLineOf("roof", DEMO, 0)).toBe("3,600 m² · 3,344 m² inside the setback · no obstacles");
  });

  test("the Array lens says the positions, the tables, the rows and the area of all the positions", () => {
    // The board says 1,646 m²: the area of the 638 modules of the chosen option. The Array lens is about
    // the positions, so their area is what it says (phase-05-studio-roof-array.md, "As built").
    expect(subLineOf("array", { ...DEMO, module_area_m2: 2038.2 }, 6)).toBe("790 positions · 28 tables · 6 rows · 2,038 m² of modules");
  });

  test("the Sun and Strings lenses say nothing yet", () => {
    expect(subLineOf("sun", DEMO, 6)).toBeNull();
    expect(subLineOf("strings", DEMO, 6)).toBeNull();
  });

  test("without a layout there is nothing to say", () => {
    expect(subLineOf("roof", null, 6)).toBeNull();
  });
});

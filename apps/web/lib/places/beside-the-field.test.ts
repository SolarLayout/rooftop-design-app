import { describe, expect, test } from "bun:test";
import { besideTheField } from "./beside-the-field";

// What stands beside the search (the boards "UI fixes · My location and Search on every size"): before anything is
// typed, the way to use one's location; with something typed, the action that searches it, which Enter does too.

describe("beside the search", () => {
  test("before anything is typed: my location in a field; in Find's column a row under the search (V2 · 4), on Home a link under it (V2 · 9)", () => {
    expect(besideTheField({ look: "column", typed: "", found: null })).toBeNull();
    expect(besideTheField({ look: "field", typed: "  ", found: null })).toBe("locate");
    expect(besideTheField({ look: "hero", typed: "", found: null })).toBeNull();
  });

  test("with something typed: Search on Find; Home has its own action, Find the roof; a field of a form, nothing", () => {
    expect(besideTheField({ look: "column", typed: "Pune", found: null })).toBe("search");
    expect(besideTheField({ look: "column", typed: "18.52, 73.86", found: null })).toBe("search");
    expect(besideTheField({ look: "hero", typed: "Pune", found: null })).toBeNull();
    expect(besideTheField({ look: "glass", typed: "", found: null })).toBeNull();
    expect(besideTheField({ look: "glass", typed: "Pune", found: null })).toBeNull();
    expect(besideTheField({ look: "field", typed: "Pune", found: null })).toBeNull();
  });

  test("once a place is found, its name stands in the field and nothing beside it", () => {
    expect(besideTheField({ look: "column", typed: "", found: "Pune, Maharashtra" })).toBeNull();
    expect(besideTheField({ look: "column", typed: "Pune", found: "Pune, Maharashtra" })).toBeNull();
  });
});

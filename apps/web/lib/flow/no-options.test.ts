import { describe, expect, test } from "bun:test";
import { pathOfNoOptions } from "./no-options";

// Where a design with no options leads (#179, item 13): to the lens where it is put right. No module fitting on the roof is
// the outline's, the setback's or the obstacles' (the Roof lens); every other reason is the strings' (the Strings lens).
describe("the lens a design with no options leads to", () => {
  test("no position for a module: the Roof lens", () => {
    expect(pathOfNoOptions({ code: "no_positions" })).toBe("/studio/roof");
  });

  test("no system voltage, no string length that fits, too few positions for a string: the Strings lens", () => {
    for (const code of ["system_voltage_missing", "no_string_length_fits", "too_few_positions"] as const) expect(pathOfNoOptions({ code })).toBe("/studio/strings");
  });
});

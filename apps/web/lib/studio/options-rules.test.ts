import { describe, expect, test } from "bun:test";
import type { DesignOption } from "../api";
import { optionsRulesOf } from "./options-rules";

// How the options are made: the paragraph under the options becomes three numbered lines and one for the options that
// miss the target (V2 · 6, D102). Made of the engine's note on the options, whose numbers are read, none written twice.

const NOTE =
  "Target DC/AC 1.10–1.30, warning above 1.40. At most 4 strings per MPPT (4 × 13.58 A ≤ 65.0 A), so one inverter takes 24 strings. " +
  "The least shaded strings in a row are used first, then those across rows. ! D: DC/AC 0.71, below target; E: DC/AC 0.71, below target.";
const option = (letter: string, dcac: number, note: string) => ({ letter, dcac, ok: note === "", note }) as DesignOption;
const OPTIONS = [option("A", 1.3, ""), option("D", 0.71, "below target"), option("E", 0.71, "below target")];

describe("how the options are made", () => {
  test("three numbered lines: the target, the strings an MPPT takes with its current, the least shaded first", () => {
    expect(optionsRulesOf(NOTE, OPTIONS).lines).toEqual([
      "Each option keeps the DC/AC ratio between 1.10 and 1.30. Above 1.40 it is marked.",
      "An MPPT takes at most 4 strings: 4 strings of 13.58 A stay under 65.0 A.",
      "The least shaded strings are used first.",
    ]);
  });

  test("one line for the options that miss the target, with their ratio", () => {
    expect(optionsRulesOf(NOTE, OPTIONS).missed).toBe("D and E are under the target: their DC/AC ratio is 0.71.");
  });

  test("ratios that differ are told one by one; over the target is said so", () => {
    const options = [option("D", 0.71, "below target"), option("E", 1.52, "above target")];

    expect(optionsRulesOf(NOTE, options).missed).toBe("D (0.71) is under the target; E (1.52) is over it.");
  });

  test("where every option is in target, no line for the others", () => {
    expect(optionsRulesOf(NOTE.split(" ! ")[0]!, [OPTIONS[0]!]).missed).toBeNull();
  });

  test("where the file gives no current limit, the API's sentence stands in the second place", () => {
    const note = "Target DC/AC 1.10–1.30, warning above 1.40. The OND gives no current limit per MPPT: one string for each of its 12 inputs at most, 2 per MPPT, so one inverter takes 12 strings. Enter the datasheet value of the current per MPPT. The least shaded strings in a row are used first, then those across rows.";

    expect(optionsRulesOf(note, [OPTIONS[0]!]).lines[1]).toBe("The inverter file gives no current limit per MPPT: one string for each of its 12 inputs at most, 2 per MPPT, so one inverter takes 12 strings. Enter the datasheet value of the current per MPPT.");
  });

  test("a note of another shape is shown as it is, in one line", () => {
    expect(optionsRulesOf("Something else.", []).lines).toEqual(["Something else."]);
  });
});

import { describe, expect, test } from "bun:test";
import { capacityOf, resultChipOf, summaryOf } from "./result-view";
import type { Problem } from "../../lib/errors/problem-of";
import type { VitalsView } from "./vitals-view";

// The result chip at the top bar's right (D95; the board "V2 · 2"): the energy of year 1 in one figure, what waits for the
// user beside it; pressed, the summary in plain names. The vitals bar over the stage is gone.

const CELLS: VitalsView["cells"] = [
  { id: "energy", label: "Energy in year 1", quantity: { number: "617.8", unit: "MWh" } },
  { id: "dc", label: "DC capacity", quantity: { number: "357.28", unit: "kWp" } },
  { id: "ac", label: "AC capacity", quantity: { number: "275", unit: "kW" } },
  { id: "dcac", label: "DC/AC ratio", quantity: { number: "1.30" }, mark: { kind: "fits", label: "In target" } },
  { id: "modules", label: "Modules", quantity: { number: "638", unit: "of 790" } },
  { id: "pr", label: "Performance ratio (PR)", quantity: { number: "86.6", unit: "%" } },
  { id: "yield", label: "Yield", quantity: { number: "1,729", unit: "kWh/kWp" } },
];
const view = (over: Partial<VitalsView>): VitalsView => ({ kind: "design", cells: CELLS, isLoading: false, isDimmed: false, last: { kind: "notes", count: 0, title: "Nothing to review", detail: "" }, ...over });

const NOT_COMPUTED: Problem = { title: "Energy not computed", cause: "The server could not be reached.", remedy: "Check your connection, then try again.", actions: [{ id: "try-again", label: "Try again" }], details: "No answer" };
const NOT_UPDATED: Problem = { ...NOT_COMPUTED, title: "Energy not updated", cause: "The server could not be reached after your last change. The result shown is from before the change." };

describe("the result chip", () => {
  test("the result: the energy of year 1 a year, nothing else", () => {
    expect(resultChipOf(view({}))).toEqual({ kind: "result", figure: "617.8", words: "MWh a year", toReview: 0, isDimmed: false });
  });

  test("with notes, how many wait beside the energy", () => {
    expect(resultChipOf(view({ last: { kind: "notes", count: 1, title: "1 to review", detail: "Voc coefficient" } }))).toEqual({ kind: "result", figure: "617.8", words: "MWh a year", toReview: 1, isDimmed: false });
  });

  test("before the first result, computing; while a new one comes, the last one dimmed", () => {
    expect(resultChipOf(view({ cells: [], isLoading: true, last: { kind: "run", title: "Opening the design", step: null, share: 0 } }))).toEqual({ kind: "computing", words: "Computing the energy" });
    expect(resultChipOf(view({ isDimmed: true, last: { kind: "run", title: "Updating energy", step: null, share: 0.4 } }))).toEqual({ kind: "result", figure: "617.8", words: "MWh a year", toReview: 0, isDimmed: true });
  });

  test("a run that failed with nothing before: Energy not computed, with the problem behind the chip", () => {
    const chip = resultChipOf(view({ cells: [], kind: "layout", last: { kind: "failed", title: "Energy not computed", problem: NOT_COMPUTED } }));
    expect(chip).toEqual({ kind: "failed", words: "Energy not computed", problem: NOT_COMPUTED });
  });

  test("a run that failed after a result: Showing the last result, the value dimmed, the problem behind the chip", () => {
    const chip = resultChipOf(view({ last: { kind: "failed", title: "Energy not updated", problem: NOT_UPDATED } }));
    expect(chip).toEqual({ kind: "stale", figure: "617.8", words: "Showing the last result", problem: NOT_UPDATED });
  });

  test("no option to offer: Energy not computed; pressed, the API's words and the way to where it is put right", () => {
    const chip = resultChipOf(view({ cells: [], kind: "layout", last: { kind: "decision", title: "No string length fits this inverter", detail: "At 600 V a string holds at most 11.", path: "/studio/strings" } }));
    expect(chip).toEqual({
      kind: "failed",
      words: "Energy not computed",
      problem: { title: "Energy not computed", cause: "At 600 V a string holds at most 11.", remedy: null, actions: [{ id: "open", label: "Open Strings", href: "/studio/strings" }], details: null },
    });
  });
});

describe("the summary under the chip", () => {
  test("seven figures in plain names, in the order of the board", () => {
    expect(summaryOf(view({})).map((row) => [row.name, row.value])).toEqual([
      ["Energy in year 1", "617.8 MWh"],
      ["Modules", "638 of 790"],
      ["DC capacity", "357.28 kWp"],
      ["AC capacity", "275 kW"],
      ["DC/AC ratio", "1.30"],
      ["Performance ratio (PR)", "86.6 %"],
      ["Yield", "1,729 kWh/kWp"],
    ]);
  });

  test("nothing to sum up before there is a design", () => {
    expect(summaryOf(view({ kind: "layout", cells: [] }))).toEqual([]);
  });
});

describe("the capacity beside the result on tablet (V2 · 3)", () => {
  test("the modules used and the DC capacity of a design", () => {
    expect(capacityOf(view({}))).toBe("638 modules · 357.28 kWp");
  });

  test("none before a design", () => {
    expect(capacityOf(view({ kind: "layout", cells: [] }))).toBeNull();
  });
});

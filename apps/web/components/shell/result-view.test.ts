import { describe, expect, test } from "bun:test";
import { resultChipOf, summaryOf } from "./result-view";
import type { VitalsView } from "./vitals-view";

// The result chip at the top bar's right (D95; the board "V2 · 2"): the energy of year 1 in one figure, what waits for the
// user beside it; pressed, the summary in plain names. The vitals bar over the stage is gone.

const CELLS: VitalsView["cells"] = [
  { id: "energy", label: "Energy, year 1", quantity: { number: "617.8", unit: "MWh" } },
  { id: "dc", label: "DC capacity", quantity: { number: "357.28", unit: "kWp" } },
  { id: "ac", label: "AC capacity", quantity: { number: "275", unit: "kW" } },
  { id: "dcac", label: "DC/AC", quantity: { number: "1.30" }, mark: { kind: "fits", label: "In target" } },
  { id: "modules", label: "Modules", quantity: { number: "638", unit: "of 790" } },
  { id: "pr", label: "PR", quantity: { number: "86.6", unit: "%" } },
  { id: "yield", label: "Yield", quantity: { number: "1,729", unit: "kWh/kWp" } },
];
const view = (over: Partial<VitalsView>): VitalsView => ({ kind: "design", cells: CELLS, isLoading: false, isDimmed: false, last: { kind: "notes", count: 0, title: "Nothing to review", detail: "" }, ...over });

describe("the result chip", () => {
  test("the result: the energy of year 1 a year, nothing else", () => {
    expect(resultChipOf(view({}))).toEqual({ kind: "result", figure: "617.8", words: "MWh a year", toReview: 0, isDimmed: false });
  });

  test("with notes, how many wait beside the energy", () => {
    expect(resultChipOf(view({ last: { kind: "notes", count: 1, title: "1 note to review", detail: "Voc coefficient" } }))).toEqual({ kind: "result", figure: "617.8", words: "MWh a year", toReview: 1, isDimmed: false });
  });

  test("before the first result, computing; while a new one comes, the last one dimmed", () => {
    expect(resultChipOf(view({ cells: [], isLoading: true, last: { kind: "run", title: "Opening the design", step: null, share: 0 } }))).toEqual({ kind: "computing", words: "Computing the energy" });
    expect(resultChipOf(view({ isDimmed: true, last: { kind: "run", title: "Updating energy", step: null, share: 0.4 } }))).toEqual({ kind: "result", figure: "617.8", words: "MWh a year", toReview: 0, isDimmed: true });
  });

  test("a run that failed, or no option that fits, says so in the chip", () => {
    expect(resultChipOf(view({ cells: [], kind: "layout", last: { kind: "failed", title: "Energy was not computed", detail: "" } }))).toEqual({ kind: "problem", words: "Energy was not computed" });
    expect(resultChipOf(view({ cells: [], kind: "layout", last: { kind: "decision", title: "No string length fits this inverter", detail: "", path: "/studio/strings" } }))).toEqual({ kind: "problem", words: "No string length fits this inverter" });
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

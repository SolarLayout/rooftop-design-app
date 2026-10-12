import { describe, expect, test } from "bun:test";
import type { VitalsView } from "@/components/shell/vitals-view";
import { firstOpenLinesOf, showsFirstOpenOf } from "./first-open";

// The status of the Roof step after Build this roof (V2 · 3, the board "The Studio's first open"): what happened, the
// energy on its way, then the energy and what it follows.

const RUN = { kind: "run", title: "Opening Pune demo roof", step: null, share: 0.2 } as const;
const NOTES = { kind: "notes", count: 1, title: "1 to review", detail: "Voc" } as const;
const layout = (last: VitalsView["last"]): VitalsView => ({
  kind: "layout",
  isLoading: false,
  isDimmed: false,
  last,
  cells: [
    { id: "roof", label: "Roof", quantity: { number: "3,600", unit: "m²" } },
    { id: "positions", label: "Positions", quantity: { number: "790", unit: "modules" } },
  ],
});
const design = (last: VitalsView["last"], isDimmed = false): VitalsView => ({
  kind: "design",
  isLoading: false,
  isDimmed,
  last,
  cells: [
    { id: "energy", label: "Energy in year 1", quantity: { number: "617.8", unit: "MWh" } },
    { id: "dc", label: "DC capacity", quantity: { number: "357.28", unit: "kWp" } },
    { id: "modules", label: "Modules", quantity: { number: "638", unit: "of 790" } },
  ],
});

describe("the first-open status", () => {
  test("nothing while the design is opening", () => {
    expect(firstOpenLinesOf({ kind: "design", cells: [], isLoading: true, isDimmed: false, last: RUN })).toEqual([]);
  });

  test("the array on the roof as the layout has it, and the energy on its way", () => {
    expect(firstOpenLinesOf(layout(RUN))).toEqual([
      { mark: "done", title: "The array is on the roof", detail: "790 positions" },
      { mark: "working", title: "Computing the energy", detail: "Shading every module over the year. A few seconds." },
    ]);
  });

  test("the modules used and their power, then the energy and what it follows", () => {
    expect(firstOpenLinesOf(design(NOTES))).toEqual([
      { mark: "done", title: "The array is on the roof", detail: "638 modules · 357.28 kWp" },
      { mark: "done", title: "617.8 MWh in year 1", detail: "The energy follows each change you make." },
    ]);
  });

  test("a run that failed or found no option says what happened alone: the problem is said where problems are", () => {
    expect(firstOpenLinesOf(layout({ kind: "failed", title: "Energy not computed", problem: { title: "Energy not computed", cause: "The server could not be reached.", remedy: null, actions: [], details: null } }))).toEqual([{ mark: "done", title: "The array is on the roof", detail: "790 positions" }]);
  });

  test("a newer run on its way computes again", () => {
    expect(firstOpenLinesOf(design(RUN, true))[1]).toMatchObject({ mark: "working", title: "Computing the energy" });
  });
});

describe("when it shows", () => {
  test("on the Roof step of a design while no other step was opened", () => {
    expect(showsFirstOpenOf({ current: "roof", seen: ["roof"] })).toBe(true);
    expect(showsFirstOpenOf({ current: "roof", seen: [] })).toBe(true);
  });

  test("not once the user continued, nor on another step", () => {
    expect(showsFirstOpenOf({ current: "roof", seen: ["roof", "array"] })).toBe(false);
    expect(showsFirstOpenOf({ current: "array", seen: ["roof"] })).toBe(false);
  });
});

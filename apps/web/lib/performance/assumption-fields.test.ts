import { describe, expect, test } from "bun:test";
import type { DesignResult, Project } from "../api";
import { ASSUMPTION_RANGES, assumptionsOf, LEVEL_RANGE, withAssumption, withLevel, type Assumption, type AssumptionField } from "./assumption-fields";
import { DOCUMENT } from "./test-fixtures";

/** The run's sizing for the demo's flat roof: Uc the roof type's. */
const SIZING = { uc: 29, uc_from: "roof type", uc_default: 29, cell_rise_c: 30, cell_rise_from: "roof type", t_min_c: 11.93, t_min_from: "weather", t_max_c: 39.26, t_max_from: "weather" } as DesignResult["sizing"];
const SIZING_ENTERED = { ...SIZING, uc: 25, uc_from: "entered" } as DesignResult["sizing"];

const withLosses = (change: Partial<Project["losses"]>): Project => ({ ...DOCUMENT, losses: { ...DOCUMENT.losses, ...change } });

const field = (assumptions: Assumption[], id: AssumptionField["id"]): AssumptionField => {
  const found = assumptions.find((assumption) => assumption.kind === "field" && assumption.id === id);
  if (!found || found.kind !== "field") throw new Error(`No field ${id}`);
  return found;
};

describe("the assumptions (plan/phase-08-plan.md, decisions 6 and 8; functional-inventory 1.7)", () => {
  test("seven, in the board's order, each with its range: six fields and the three levels", () => {
    const assumptions = assumptionsOf(DOCUMENT, SIZING);

    expect(assumptions.map((assumption) => assumption.label)).toEqual([
      "Thermal Uc",
      "Rear shading and mismatch",
      "Roof albedo",
      "Weather variability",
      "Model and data",
      "Exceedance levels",
      "Grid CO₂",
    ]);
    expect(ASSUMPTION_RANGES).toEqual({
      uc: { min: 5, max: 60, decimals: 0 },
      rear_loss_pct: { min: 0, max: 50, decimals: 1 },
      albedo: { min: 0.05, max: 0.9, decimals: 2 },
      weather_sigma_pct: { min: 0, max: 20, decimals: 1 },
      model_sigma_pct: { min: 0, max: 20, decimals: 1 },
      co2_t_per_mwh: { min: 0, max: 2, decimals: 3 },
    });
    expect(LEVEL_RANGE).toEqual({ min: 50, max: 99, decimals: 0 });
  });

  test("each field holds the document's value with its unit", () => {
    const assumptions = assumptionsOf(DOCUMENT, SIZING);

    expect(field(assumptions, "rear_loss_pct")).toEqual({ kind: "field", id: "rear_loss_pct", label: "Rear shading and mismatch", unit: "%", range: ASSUMPTION_RANGES.rear_loss_pct, value: 10, detail: null, reset: null });
    expect(field(assumptions, "albedo")).toMatchObject({ value: 0.2, unit: null, range: { decimals: 2 } });
    expect(field(assumptions, "weather_sigma_pct")).toMatchObject({ value: 3, unit: "%" });
    expect(field(assumptions, "model_sigma_pct")).toMatchObject({ value: 3, unit: "%" });
    expect(field(assumptions, "co2_t_per_mwh")).toMatchObject({ value: 0.716, unit: "t/MWh", range: { decimals: 3 } });
  });

  test("Uc is empty while the roof type's holds, and says the run's value and where it comes from", () => {
    expect(field(assumptionsOf(DOCUMENT, SIZING), "uc")).toEqual({ kind: "field", id: "uc", label: "Thermal Uc", unit: "W/m²K", range: ASSUMPTION_RANGES.uc, value: null, detail: "29 W/m²K by roof type", reset: null });
  });

  test("Uc before a run says nothing of the default yet", () => {
    expect(field(assumptionsOf(DOCUMENT, null), "uc")).toMatchObject({ value: null, detail: null, reset: null });
  });

  test("Uc entered holds its value, says the roof type's beside it (the board \"Weather and assumptions\"), and can be given back", () => {
    const uc = field(assumptionsOf(withLosses({ uc: 25 }), SIZING_ENTERED), "uc");

    expect(uc).toMatchObject({ value: 25, detail: "29 by roof type", reset: "Use the roof type's" });
  });

  test("Uc entered before the run answered says nothing of the roof type's yet", () => {
    expect(field(assumptionsOf(withLosses({ uc: 25 }), null), "uc")).toMatchObject({ value: 25, detail: null, reset: "Use the roof type's" });
  });

  test("the levels are three fields of the document's, an empty one where it has fewer", () => {
    const levels = assumptionsOf(DOCUMENT, SIZING).find((assumption) => assumption.kind === "levels");

    expect(levels).toEqual({ kind: "levels", label: "Exceedance levels", levels: [50, 75, 90], range: LEVEL_RANGE });
    expect(assumptionsOf(withLosses({ p_levels: [50, 90] }), SIZING).find((assumption) => assumption.kind === "levels")).toMatchObject({ levels: [50, 90, null] });
  });
});

describe("the edit of an assumption", () => {
  test("a loss of the document: the new value, nothing else changed", () => {
    const edited = withAssumption(DOCUMENT, "rear_loss_pct", 15);

    expect(edited.losses.rear_loss_pct).toBe(15);
    expect({ ...edited, losses: { ...edited.losses, rear_loss_pct: 10 } }).toEqual<Project>(DOCUMENT);
    expect(DOCUMENT.losses.rear_loss_pct).toBe(10);
  });

  test("Uc entered, and given back to the roof type's with null", () => {
    const entered = withAssumption(DOCUMENT, "uc", 25);
    expect(entered.losses.uc).toBe(25);

    expect(withAssumption(entered, "uc", null).losses.uc).toBeNull();
  });

  test("the albedo is the roof's (decision 7: it asks the run, not the layout)", () => {
    const edited = withAssumption(DOCUMENT, "albedo", 0.6);

    expect(edited.roof.albedo).toBe(0.6);
    expect(edited.losses).toBe(DOCUMENT.losses);
    expect(DOCUMENT.roof.albedo).toBe(0.2);
  });

  test("a value that is the document's already leaves the document as it was", () => {
    expect(withAssumption(DOCUMENT, "rear_loss_pct", 10)).toBe(DOCUMENT);
    expect(withAssumption(DOCUMENT, "albedo", 0.2)).toBe(DOCUMENT);
    expect(withAssumption(DOCUMENT, "uc", null)).toBe(DOCUMENT);
  });

  test("a level entered: the levels sorted and each kept once, as on the desktop (decision 8)", () => {
    expect(withLevel(DOCUMENT, 1, 99).losses.p_levels).toEqual([50, 90, 99]);
    expect(withLevel(DOCUMENT, 2, 50).losses.p_levels).toEqual([50, 75]);
    expect(withLevel(withLosses({ p_levels: [50, 90] }), 2, 99).losses.p_levels).toEqual([50, 90, 99]);
  });

  test("a level that changes nothing leaves the document as it was", () => {
    expect(withLevel(DOCUMENT, 0, 50)).toBe(DOCUMENT);
    expect(withLevel(DOCUMENT, 1, 75)).toBe(DOCUMENT);
  });
});

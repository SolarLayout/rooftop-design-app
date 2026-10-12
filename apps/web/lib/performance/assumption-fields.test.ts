import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { ASSUMPTION_RANGES, assumptionFieldsOf, LEVEL_RANGE, withAssumption, withLevel } from "./assumption-fields";
import { DEGRADATION_RANGE } from "./degradation";
import { DOCUMENT } from "./test-fixtures";

const withLosses = (change: Partial<Project["losses"]>): Project => ({ ...DOCUMENT, losses: { ...DOCUMENT.losses, ...change } });

describe("the fields of the assumptions, under their rows (V2 · 8, D104)", () => {
  test("the ranges of the fields and of a level", () => {
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

  test("each row's fields, with the document's values, their units and who set them", () => {
    const fields = assumptionFieldsOf(DOCUMENT);

    expect(fields.albedo).toEqual([{ kind: "field", id: "albedo", label: "Roof albedo", unit: null, range: ASSUMPTION_RANGES.albedo, value: 0.2, hint: "Default" }]);
    expect(fields.ageing).toEqual([{ kind: "field", id: "degradation_pct", label: "Less each year", unit: "%", range: DEGRADATION_RANGE, value: 0.5, hint: "Default" }]);
    expect(fields.uncertainty).toEqual([
      { kind: "field", id: "weather_sigma_pct", label: "Weather variability", unit: "%", range: ASSUMPTION_RANGES.weather_sigma_pct, value: 3, hint: "Default" },
      { kind: "field", id: "model_sigma_pct", label: "Model and data", unit: "%", range: ASSUMPTION_RANGES.model_sigma_pct, value: 3, hint: "Default" },
      { kind: "levels", label: "Exceedance levels", levels: [50, 75, 90], range: LEVEL_RANGE },
    ]);
    expect(fields.co2).toEqual([{ kind: "field", id: "co2_t_per_mwh", label: "Grid CO₂", unit: "t/MWh", range: ASSUMPTION_RANGES.co2_t_per_mwh, value: 0.716, hint: "Set for India" }]);
  });

  test("a value the user entered says the default it took the place of", () => {
    const fields = assumptionFieldsOf({ ...withLosses({ degradation_pct: 0.7, co2_t_per_mwh: 0.82 }), roof: { ...DOCUMENT.roof, albedo: 0.3 } });

    expect(fields.albedo[0]).toMatchObject({ value: 0.3, hint: "Yours · default 0.20" });
    expect(fields.ageing[0]).toMatchObject({ value: 0.7, hint: "Yours · default 0.50 %" });
    expect(fields.co2[0]).toMatchObject({ value: 0.82, hint: "Yours · default 0.716 t/MWh" });
  });

  test("the levels are three fields of the document's, an empty one where it has fewer", () => {
    expect(assumptionFieldsOf(withLosses({ p_levels: [50, 90] })).uncertainty[2]).toMatchObject({ levels: [50, 90, null] });
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

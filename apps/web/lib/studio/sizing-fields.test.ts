import { describe, expect, test } from "bun:test";
import type { DesignResult, Project } from "../api";
import { SIZING_RANGES, sizingFieldsOf, sizingRowOf, sizingSetByOf, withSizing } from "./sizing-fields";

const VOC_NOTE = "Voc coefficient -0.164 %/°C is outside the usual -0.35 to -0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.";

const run = (change: Partial<DesignResult> = {}) =>
  ({
    weather: { t_min_c: 11.93, t_max_c: 39.26 },
    sizing: { t_min_c: 11.93, t_max_c: 39.26, t_min_from: "weather", t_max_from: "weather", cell_rise_c: 25, cell_rise_from: "roof type", uc: 29, uc_from: "roof type", uc_default: 29, voc_coefficient_pct: -0.16412, voc_coefficient_from: "one-diode model" },
    equipment: { coefficients: { mu_voc_pct: -0.16412, source: "one-diode model" }, module_notes: [VOC_NOTE] },
    ...change,
  }) as unknown as DesignResult;

const DOCUMENT = { roof: { roof_type: "flat_tilted" }, t_min_override: null, t_max_override: null, cell_rise_c: null, voc_coefficient_pct: null } as unknown as Project;

describe("the sizing temperatures and the Voc coefficient (the board \"Inverter and sizing\"; plan/phase-07-plan.md, decisions 6 and 7)", () => {
  test("every field empty for its default, with the default and where it comes from beside it", () => {
    expect(sizingFieldsOf(DOCUMENT, run()).map(({ id, value, detail }) => ({ id, value, detail }))).toEqual([
      { id: "t_min_override", value: null, detail: "From the weather · 11.9 °C" },
      { id: "t_max_override", value: null, detail: "From the weather · 39.3 °C" },
      { id: "cell_rise_c", value: null, detail: "Default · 25 °C by roof type: flat, open rack" },
      { id: "voc_coefficient_pct", value: null, detail: "Default · −0.164 %/°C, the one-diode model's" },
    ]);
  });

  test("a value entered is Yours, says the default it took the place of where the run said it, for Reset to give back (V2 · 3)", () => {
    const document = { ...DOCUMENT, t_min_override: 5, cell_rise_c: 25, voc_coefficient_pct: -0.29 } as Project;
    const design = run({ equipment: { coefficients: { mu_voc_pct: -0.29, source: "entered" }, module_notes: [] } } as never);
    const fields = sizingFieldsOf(document, { ...design, sizing: { ...design.sizing, cell_rise_from: "entered", voc_coefficient_from: "entered" } } as DesignResult);
    expect(fields.map(({ value, detail }) => ({ value, detail }))).toEqual([
      { value: 5, detail: "Yours · default 11.9 °C" },
      { value: null, detail: "From the weather · 39.3 °C" },
      { value: 25, detail: "Yours" },
      { value: -0.29, detail: "Yours" },
    ]);
    expect(fields.map((field) => field.setBy.kind)).toEqual(["yours", "weather", "yours", "yours"]);
  });

  test("the section is from the weather while every field holds its default, Yours once one is entered (V2 · 3)", () => {
    expect(sizingSetByOf(sizingFieldsOf(DOCUMENT, run()))).toEqual({ kind: "weather" });
    expect(sizingSetByOf(sizingFieldsOf({ ...DOCUMENT, cell_rise_c: 30 } as Project, run()))).toEqual({ kind: "yours", byDefault: null });
  });

  test("the coefficient said is the one that sizes the strings, the model's, though the PAN states its own (#179, item 15); a sloped roof's cell rise is flush", () => {
    const design = run({ equipment: { coefficients: { mu_voc_pct: -0.286, source: "PAN file" }, module_notes: [] } } as never);
    const sloped = { ...DOCUMENT, roof: { roof_type: "sloped_flush" } } as Project;
    const fields = sizingFieldsOf(sloped, { ...design, sizing: { ...design.sizing, cell_rise_c: 35, voc_coefficient_pct: -0.164, voc_coefficient_from: "one-diode model" } });
    expect(fields[2]?.detail).toBe("Default · 35 °C by roof type: sloped, flush");
    expect(fields[3]?.detail).toBe("Default · −0.164 %/°C, the one-diode model's");
  });

  test("the Voc coefficient carries the engine's note on it, with true minus signs; none once entered", () => {
    expect(sizingFieldsOf(DOCUMENT, run())[3]?.note).toBe("Voc coefficient −0.164 %/°C is outside the usual −0.35 to −0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.");
    expect(sizingFieldsOf(DOCUMENT, run({ equipment: { coefficients: { mu_voc_pct: -0.29, source: "entered" }, module_notes: [] } } as never))[3]?.note).toBeNull();
  });

  test("before a run there are no defaults to say", () => {
    expect(sizingFieldsOf(DOCUMENT, null).map((field) => field.detail)).toEqual([null, null, null, null]);
    expect(sizingRowOf(null)).toBeNull();
  });

  test("the closed row says the range the strings are sized for", () => {
    expect(sizingRowOf(run())).toBe("11.9 to 39.3 °C");
  });

  test("the ranges are the inventory's (1.5); the coefficient lies between −1 and 0, both left out", () => {
    expect(SIZING_RANGES).toEqual({
      t_min_override: { min: -50, max: 40, decimals: 1 },
      t_max_override: { min: 0, max: 60, decimals: 1 },
      cell_rise_c: { min: 0, max: 60, decimals: 1 },
      voc_coefficient_pct: { min: -0.999, max: -0.001, decimals: 3 },
    });
  });

  test("a value committed is the document's; null gives it back to its default", () => {
    expect(withSizing(DOCUMENT, "cell_rise_c", 30).cell_rise_c).toBe(30);
    const entered = { ...DOCUMENT, voc_coefficient_pct: -0.29 } as Project;
    expect(withSizing(entered, "voc_coefficient_pct", null).voc_coefficient_pct).toBeNull();
    expect(withSizing(entered, "voc_coefficient_pct", -0.29)).toBe(entered);
  });
});

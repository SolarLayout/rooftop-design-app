import { describe, expect, test } from "bun:test";
import type { DesignOption } from "../api";
import { kpisOf } from "./kpis";
import { A, D, LEVELS_50_90_99 } from "./test-fixtures";

describe("the lead tile (plan/phase-08-plan.md, decision 3; guidelines.md, \"Numbers and units\")", () => {
  test("the energy to grid of year 1, one decimal, MWh", () => {
    expect(kpisOf(A).lead).toEqual({ label: "Energy to grid, year 1", quantity: { number: "617.8", unit: "MWh" } });
  });

  test("the exceedance values at the document's levels, in order, one decimal; the sigma on the last", () => {
    expect(kpisOf(A).pValues).toEqual([
      { label: "P50", value: "617.8" },
      { label: "P75", value: "600.2" },
      { label: "P90 · σ 4.24 %", value: "584.2" },
    ]);
  });

  test("the levels P50, P90 and P99 asked for: the same three cells, the sigma on P99", () => {
    expect(kpisOf(LEVELS_50_90_99).pValues).toEqual([
      { label: "P50", value: "615.7" },
      { label: "P90", value: "582.3" },
      { label: "P99 · σ 4.24 %", value: "555.0" },
    ]);
  });

  test("a thousand of MWh has its comma", () => {
    const large = { ...A, energy: { ...A.energy, energy_mwh: 1234.56, p_values: [{ level: 50, mwh: 1234.56 }] } } as DesignOption;

    expect(kpisOf(large).lead.quantity.number).toBe("1,234.6");
    expect(kpisOf(large).pValues).toEqual([{ label: "P50 · σ 4.24 %", value: "1,234.6" }]);
  });
});

describe("the six tiles", () => {
  test("in the board's order, each with its label, its number at the precision of the guidelines and its unit", () => {
    expect(kpisOf(A).tiles).toEqual([
      { id: "pr", label: "Performance ratio", quantity: { number: "86.6", unit: "%" } },
      { id: "yield", label: "Specific yield", quantity: { number: "1,729", unit: "kWh/kWp" } },
      { id: "capacity-factor", label: "Capacity factor, AC", quantity: { number: "25.6", unit: "%" }, more: "19.7 % DC" },
      { id: "in-plane", label: "In-plane irradiation", quantity: { number: "1,998", unit: "kWh/m²" } },
      { id: "25-years", label: "Energy over 25 years", quantity: { number: "14,554", unit: "MWh" } },
      { id: "co2", label: "CO₂ avoided", quantity: { number: "442.4", unit: "t/yr" } },
    ]);
  });

  test("the tiles are the option's own: D's energy is D's", () => {
    expect(kpisOf(D).lead.quantity.number).toBe("700.9");
    expect(kpisOf(D).pValues.map((cell) => cell.value)).toEqual(["700.9", "680.9", "662.8"]);
  });
});

import { describe, expect, test } from "bun:test";
import type { DesignOption } from "../api";
import { kpisOf, yearsInOf } from "./kpis";
import { A, LEVELS_50_90_99 } from "./test-fixtures";

describe("the lead (V2 · 8, D104; audit V2-89)", () => {
  test("the energy to the grid of year 1, one decimal, MWh", () => {
    expect(kpisOf(A).lead).toMatchObject({ label: "Energy to the grid in year 1", quantity: { number: "617.8", unit: "MWh" } });
  });

  test("Likely is the P50, Conservative the highest level the document asks for, with what it means", () => {
    expect(kpisOf(A).lead.likely).toBe("617.8 MWh");
    expect(kpisOf(A).lead.conservative).toEqual({ label: "Conservative (P90)", value: "584.2 MWh", meaning: "9 years in 10 at least" });
  });

  test("levels P50, P90 and P99 asked for: Conservative is the P99", () => {
    expect(kpisOf(LEVELS_50_90_99).lead.conservative).toEqual({ label: "Conservative (P99)", value: "555.0 MWh", meaning: "99 years in 100 at least" });
  });

  test("the P50 alone: no Conservative", () => {
    const one = { ...A, energy: { ...A.energy, p_values: [{ level: 50, mwh: A.energy.energy_mwh }] } } as DesignOption;
    expect(kpisOf(one).lead.conservative).toBeNull();
  });

  test("a thousand of MWh has its comma", () => {
    const large = { ...A, energy: { ...A.energy, energy_mwh: 1234.56, p_values: [{ level: 50, mwh: 1234.56 }] } } as DesignOption;
    expect(kpisOf(large).lead.quantity.number).toBe("1,234.6");
    expect(kpisOf(large).lead.likely).toBe("1,234.6 MWh");
  });
});

describe("a level in years", () => {
  test("in the smallest whole numbers", () => {
    expect([yearsInOf(90), yearsInOf(75), yearsInOf(95), yearsInOf(99), yearsInOf(80)]).toEqual([
      "9 years in 10 at least",
      "3 years in 4 at least",
      "19 years in 20 at least",
      "99 years in 100 at least",
      "4 years in 5 at least",
    ]);
  });
});

describe("the four figures", () => {
  test("System size, Yield, Performance ratio (PR), DC/AC ratio (the owner, 2026-10-13), each with its few words", () => {
    expect(kpisOf(A).figures).toEqual([
      { id: "size", label: "System size", quantity: { number: "357.28", unit: "kWp" }, words: "275 kW of inverter" },
      { id: "yield", label: "Yield", quantity: { number: "1,729", unit: "kWh/kWp" }, words: "A year, for each kWp" },
      { id: "pr", label: "Performance ratio (PR)", quantity: { number: "86.6", unit: "%" }, words: "Of its rated output, in this sunlight" },
      { id: "dcac", label: "DC/AC ratio", quantity: { number: "1.30" }, words: "Within the target, 1.10 to 1.30" },
    ]);
  });

  test("the DC/AC ratio says where it stands against the target", () => {
    const words = (dcac: number) => kpisOf({ ...A, dcac }).figures.find((figure) => figure.id === "dcac")?.words;
    expect(words(0.61)).toBe("Under the target, 1.10 to 1.30");
    expect(words(1.45)).toBe("Over the target, 1.10 to 1.30");
  });
});

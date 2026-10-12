import { describe, expect, test } from "bun:test";
import type { Coefficients, Module } from "../api";
import { moduleCardOf, moduleFactsOf } from "./module-card";

// The words of the module card of the Array lens (plan/phase-05-plan.md, step 14, decision 14; the board
// "Studio, Array lens, states"): the model as the file names it, the maker as people know it (D75), the facts, the coefficient line.

const MODULE = {
  manufacturer: "INSOLATION GREEN ENERGY PVT. LTD.",
  model: "INA-144MHC-TF-560",
  pnom_w: 560,
  length_m: 2.277,
  width_m: 1.133,
  voc: 49.95,
  isc: 14.3,
  n_diodes: 3,
  half_cell: true,
  bifaciality: 0.8,
  is_bifacial: true,
  source: "insolation-ina-144mhc-tf-560.PAN",
} as unknown as Module;

const COEFFICIENTS = { mu_voc_pct: -0.164, mu_vmp_pct: -0.228, mu_pmpp_pct: -0.212, mu_voc_mv: -82, source: "one-diode model" } as Coefficients;

describe("the module card (V2 · 7, D103; audit V2-30)", () => {
  test("says the model, the maker as people know it with the power and the size; the electrical figures are behind Details in plain names", () => {
    expect(moduleCardOf(MODULE, COEFFICIENTS)).toEqual({
      title: "INA-144MHC-TF-560",
      maker: "Insolation · 560 Wp · 2.28 × 1.13 m",
      details: [
        { name: "Open-circuit voltage (Voc)", value: "49.95 V" },
        { name: "Short-circuit current (Isc)", value: "14.30 A" },
        { name: "Bifacial, rear gain", value: "0.80" },
        { name: "Voc coefficient", value: "−0.164 %/°C" },
      ],
    });
  });

  test("a monofacial module has no bifacial line; the file's name, the diodes and the other coefficients are not on the card", () => {
    const card = moduleCardOf({ ...MODULE, is_bifacial: false, bifaciality: 0, half_cell: false }, { ...COEFFICIENTS, source: "PAN file" });
    expect(card.details.map((row) => row.name)).toEqual(["Open-circuit voltage (Voc)", "Short-circuit current (Isc)", "Voc coefficient"]);
    expect(JSON.stringify(card)).not.toContain(".PAN");
    expect(JSON.stringify(card)).not.toContain("diodes");
  });
});

describe("the module's facts on one line (V2 · 3)", () => {
  test("the model and its power", () => {
    expect(moduleFactsOf(MODULE)).toBe(`${MODULE.model} · ${Math.round(MODULE.pnom_w)} Wp`);
  });
});

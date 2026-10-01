import { describe, expect, test } from "bun:test";
import type { Coefficients, Module } from "../api";
import { moduleCardOf } from "./module-card";

// The words of the module card of the Array lens (plan/phase-05-plan.md, step 14, decision 14; the board
// "Studio, Array lens, states"): the file's names as they are, the facts, the coefficient line.

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

describe("the module card", () => {
  test("says the model, the manufacturer with the Wp, the size with the bifaciality, the facts and the file", () => {
    expect(moduleCardOf(MODULE, COEFFICIENTS)).toEqual({
      title: "INA-144MHC-TF-560",
      maker: "INSOLATION GREEN ENERGY PVT. LTD. · 560 Wp",
      size: "2.277 × 1.133 m · bifacial 0.80",
      facts: "Voc 49.95 V · Isc 14.30 A · 3 diodes · twin half-cell",
      coefficients: "Coefficients (one-diode model): Voc −0.164, Vmp −0.228, Pmpp −0.212 %/°C",
      file: "insolation-ina-144mhc-tf-560.PAN",
    });
  });

  test("a monofacial module of whole cells says neither", () => {
    const card = moduleCardOf({ ...MODULE, is_bifacial: false, bifaciality: 0, half_cell: false }, { ...COEFFICIENTS, source: "PAN file" });
    expect(card.size).toBe("2.277 × 1.133 m");
    expect(card.facts).toBe("Voc 49.95 V · Isc 14.30 A · 3 diodes");
    expect(card.coefficients).toBe("Coefficients (PAN file): Voc −0.164, Vmp −0.228, Pmpp −0.212 %/°C");
  });
});

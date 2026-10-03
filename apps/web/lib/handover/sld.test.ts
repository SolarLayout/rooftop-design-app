import { describe, expect, test } from "bun:test";
import type { DesignOption } from "../api";
import { sldOf } from "./sld";
import { A, EQUIPMENT, MPPT_LOADS, STRINGS } from "./test-fixtures";

/**
 * A two-inverter case built by hand from option A: S1 to S12 on INV-1, four on each of MPPT 1 to 3; S13 to S22 on INV-2,
 * four on MPPT 1 and 2 and two on MPPT 3; MPPT 4 to 6 of both inverters without strings. INV-2's MPPT 3 has no limit.
 */
const TWO_INVERTERS = {
  ...A,
  n_inverters: 2,
  system: {
    ...A.system,
    n_inverters: 2,
    strings: STRINGS.map((string, index) => ({ ...string, inverter: index < 12 ? 1 : 2, mppt: index < 12 ? Math.floor(index / 4) + 1 : Math.floor((index - 12) / 4) + 1 })),
    inverters: [
      { label: "INV-1", position: [31.0, 39.0] },
      { label: "INV-2", position: [31.0, 45.0] },
    ],
  },
  mppt_loads: [
    ...MPPT_LOADS.slice(0, 3),
    ...MPPT_LOADS.slice(0, 2).map((load) => ({ ...load, inverter: 2, label: `INV-2 · MPPT ${load.mppt}` })),
    { ...MPPT_LOADS[0]!, inverter: 2, mppt: 3, label: "INV-2 · MPPT 3", strings: 2, imp_a: 27.16, imp_limit_a: null, isc_a: 28.6, isc_limit_a: null, kwp: 32.48, ok: false },
  ],
} as unknown as DesignOption;

describe("the single-line diagram of the chosen option, in the engine's words (plan/phase-09-plan.md, step 13, decision 6; plots.py, draw_sld)", () => {
  const sld = sldOf(A, EQUIPMENT);

  test("the title, as the engine prints it over its drawing", () => {
    expect(sld.title).toBe("Single-line diagram · 22 strings of 29 × 560 Wp");
  });

  test("one inverter with its label and its words, and its six MPPTs", () => {
    expect(sld.inverters).toHaveLength(1);
    expect(sld.inverters[0]!.label).toBe("INV-1");
    expect(sld.inverters[0]!.words).toBe("275 kW · 6 MPPT");
    expect(sld.inverters[0]!.mppts.map((mppt) => mppt.number)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test("each MPPT holds its strings in the engine's order, 4, 4, 4, 4, 3, 3, and says its block and its line", () => {
    const mppts = sld.inverters[0]!.mppts;
    expect(mppts.map((mppt) => mppt.strings.length)).toEqual([4, 4, 4, 4, 3, 3]);
    expect(mppts[1]!.strings).toEqual(["S5", "S6", "S7", "S8"]);
    expect(mppts[5]!.strings).toEqual(["S20", "S21", "S22"]);
    expect(mppts.map((mppt) => mppt.block)).toEqual(["4 × 29 mod", "4 × 29 mod", "4 × 29 mod", "4 × 29 mod", "3 × 29 mod", "3 × 29 mod"]);
    expect(mppts.map((mppt) => mppt.line)).toEqual(["MPPT 1 · DC", "MPPT 2 · DC", "MPPT 3 · DC", "MPPT 4 · DC", "MPPT 5 · DC", "MPPT 6 · DC"]);
  });

  test("each MPPT has a name for the keyboard and a screen reader, and its load from mppt_loads as the board has it", () => {
    const mppts = sld.inverters[0]!.mppts;
    expect(mppts[1]!.name).toBe("MPPT 2, 4 strings");
    expect(mppts[4]!.name).toBe("MPPT 5, 3 strings");
    expect(mppts[1]!.load).toBe("Imp 54.3 of 65.0 A");
    expect(mppts[4]!.load).toBe("Imp 40.7 of 65.0 A");
    expect(mppts[1]!.tooltip).toEqual({ value: "S5 · S6 · S7 · S8", label: "Imp 54.3 of 65.0 A" });
  });

  test("the series colour of a block is its MPPT's, as the Strings lens colours it, and the words on it are in the ink that contrasts more", () => {
    const mppts = sld.inverters[0]!.mppts;
    expect(mppts.map((mppt) => mppt.series)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(mppts.map((mppt) => mppt.ink)).toEqual(["dark", "dark", "dark", "dark", "dark", "light"]);
  });

  test("what is said of each MPPT in the list for screen readers", () => {
    const mppts = sld.inverters[0]!.mppts;
    expect(mppts[0]!.said).toBe("MPPT 1, 4 strings: S1 · S2 · S3 · S4 · Imp 54.3 of 65.0 A");
  });

  test("the AC side, word for word", () => {
    expect(sld.ac).toBe("AC");
    expect(sld.acdb).toBe("ACDB");
    expect(sld.meter).toEqual({ value: "kWh", label: "Net meter" });
    expect(sld.grid).toBe("Grid / LT panel");
  });
});

describe("two inverters", () => {
  const sld = sldOf(TWO_INVERTERS, EQUIPMENT);

  test("one entry per inverter, in order, each with every MPPT of the inverter", () => {
    expect(sld.inverters.map((inverter) => inverter.label)).toEqual(["INV-1", "INV-2"]);
    expect(sld.inverters.map((inverter) => inverter.mppts.length)).toEqual([6, 6]);
    expect(sld.inverters[0]!.mppts.map((mppt) => mppt.strings.length)).toEqual([4, 4, 4, 0, 0, 0]);
    expect(sld.inverters[1]!.mppts.map((mppt) => mppt.strings.length)).toEqual([4, 4, 2, 0, 0, 0]);
    expect(sld.inverters[1]!.mppts[0]!.strings).toEqual(["S13", "S14", "S15", "S16"]);
  });

  test("an MPPT without strings has no block, no load and no tooltip; its line says it is not used, and so does the list", () => {
    const unused = sld.inverters[0]!.mppts[3]!;
    expect(unused.block).toBeNull();
    expect(unused.load).toBeNull();
    expect(unused.tooltip).toBeNull();
    expect(unused.line).toBe("MPPT 4 · not used");
    expect(unused.name).toBe("MPPT 4, not used");
    expect(unused.said).toBe("MPPT 4 · not used");
  });

  test("a limit the file does not give: the current alone, and the limit said not known", () => {
    const noLimit = sld.inverters[1]!.mppts[2]!;
    expect(noLimit.load).toBe("Imp 27.2 A · limit not known");
    expect(noLimit.name).toBe("MPPT 3, 2 strings");
    expect(noLimit.block).toBe("2 × 29 mod");
  });

  test("the series colours count from 1 within each inverter", () => {
    expect(sld.inverters[1]!.mppts.map((mppt) => mppt.series)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("the engine's numbers as it prints them", () => {
  test("a whole number without decimals, a fraction with as many as it has", () => {
    const halfWatt = { ...EQUIPMENT, module: { ...EQUIPMENT.module, pnom_w: 560.5 }, inverter: { ...EQUIPMENT.inverter, pnom_kw: 27.5 } };
    const sld = sldOf(A, halfWatt);
    expect(sld.title).toBe("Single-line diagram · 22 strings of 29 × 560.5 Wp");
    expect(sld.inverters[0]!.words).toBe("27.5 kW · 6 MPPT");
  });
});

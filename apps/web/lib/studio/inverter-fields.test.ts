import { describe, expect, test } from "bun:test";
import type { CurrentPerMppt, Inverter, Project } from "../api";
import { acCableFieldOf, currentFieldOf, INVERTER_RANGES, limitsRowOf, withAcCable, withCurrentPerMppt } from "./inverter-fields";
import type { InverterShown } from "./inverter-card";

// Inverter limits and cabling (the board "Inverter and sizing"; plan/phase-07-plan.md, decision 16; inventory 1.4,
// 1.5): the current per MPPT, empty for the file's, and the AC cable per inverter.

const WATTPOWER = { manufacturer: "WattPower Systems Pvt.Ltd", model: "WP-330KTL-H1", idc_max_a: 390, n_mppt: 6, n_inputs: 28 } as Inverter;
const BY_IMAXDC: CurrentPerMppt = { value_a: 65, source: "IMaxDC over the MPPT count", note: "Not in the OND: IMaxDC 390 A ÷ 6 MPPT. Enter the datasheet value if it differs." };
const IN_THE_FILE: CurrentPerMppt = { value_a: 30, source: "OND file", note: "From the OND file." };
const NOT_IN_THE_OND: CurrentPerMppt = { value_a: null, source: "not in the OND", note: "Not in the OND, and the OND has no IMaxDC to work it out from. Enter the datasheet value." };

const shownWith = (current: CurrentPerMppt): InverterShown => ({ inverter: WATTPOWER, current });
const DOCUMENT = { name: "Pune demo roof", imax_mppt_override: null, ac_cable_m: 30 } as unknown as Project;
const entered = (value: number) => ({ ...DOCUMENT, imax_mppt_override: value });

describe("the current per MPPT", () => {
  test("empty for the file's: its value and where it comes from, and the API's note in its words", () => {
    expect(currentFieldOf(DOCUMENT, shownWith(BY_IMAXDC))).toEqual({
      value: null,
      detail: "65.0 A · IMaxDC 390 A ÷ 6 MPPT",
      reset: null,
      note: "Not in the OND: IMaxDC 390 A ÷ 6 MPPT. Enter the datasheet value if it differs.",
    });
  });

  test("a value the OND states itself needs no note", () => {
    expect(currentFieldOf(DOCUMENT, shownWith(IN_THE_FILE))).toEqual({ value: null, detail: "30.0 A · from the OND", reset: null, note: null });
  });

  test("no value in the file: not in the OND, and the note asks for the datasheet value", () => {
    expect(currentFieldOf(DOCUMENT, shownWith(NOT_IN_THE_OND))).toEqual({ value: null, detail: "not in the OND", reset: null, note: NOT_IN_THE_OND.note });
  });

  test("entered: it says so, the note goes, and the file's value can be given back", () => {
    expect(currentFieldOf(entered(60), shownWith(BY_IMAXDC))).toEqual({ value: 60, detail: "entered", reset: "Use the file's 65.0 A", note: null });
    expect(currentFieldOf(entered(60), shownWith(NOT_IN_THE_OND))).toMatchObject({ reset: "Use the file's" });
  });

  test("before a run read the inverter, the field has no detail", () => {
    expect(currentFieldOf(DOCUMENT, null)).toEqual({ value: null, detail: null, reset: null, note: null });
    expect(currentFieldOf(entered(60), null)).toEqual({ value: 60, detail: "entered", reset: "Use the file's", note: null });
  });

  test("the range of the inventory, with one decimal", () => {
    expect(INVERTER_RANGES.imax_mppt_override).toEqual({ min: 1, max: 2000, decimals: 1 });
  });

  test("entered and given back: the document's value, or null; the same document when nothing changes", () => {
    expect(withCurrentPerMppt(DOCUMENT, 60).imax_mppt_override).toBe(60);
    expect(withCurrentPerMppt(entered(60), null).imax_mppt_override).toBeNull();
    expect(withCurrentPerMppt(DOCUMENT, null)).toBe(DOCUMENT);
    const sixty = entered(60);
    expect(withCurrentPerMppt(sixty, 60)).toBe(sixty);
  });
});

describe("the AC cable per inverter", () => {
  test("the document's metres, with the range under the label", () => {
    expect(acCableFieldOf(DOCUMENT)).toEqual({ value: 30, detail: "1 to 2,000 m" });
    expect(INVERTER_RANGES.ac_cable_m).toEqual({ min: 1, max: 2000, decimals: 2 });
  });

  test("entered: the document's value; the same document when nothing changes", () => {
    expect(withAcCable(DOCUMENT, 40).ac_cable_m).toBe(40);
    expect(withAcCable(DOCUMENT, 30)).toBe(DOCUMENT);
  });
});

describe("what the closed row says", () => {
  test("the current the strings are sized with and the cable: 65.0 A · 30 m", () => {
    expect(limitsRowOf(DOCUMENT, shownWith(BY_IMAXDC))).toBe("65.0 A · 30 m");
    expect(limitsRowOf(entered(60), shownWith(BY_IMAXDC))).toBe("60.0 A · 30 m");
    expect(limitsRowOf({ ...DOCUMENT, ac_cable_m: 42.5 }, shownWith(BY_IMAXDC))).toBe("65.0 A · 42.50 m");
  });

  test("a current not known says so; before a run read the inverter, the cable alone", () => {
    expect(limitsRowOf(DOCUMENT, shownWith(NOT_IN_THE_OND))).toBe("not known · 30 m");
    expect(limitsRowOf(DOCUMENT, null)).toBe("30 m");
    expect(limitsRowOf(entered(60), null)).toBe("60.0 A · 30 m");
  });
});

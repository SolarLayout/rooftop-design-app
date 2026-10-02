import { describe, expect, test } from "bun:test";
import type { CurrentPerMppt, DesignOption } from "../api";
import { mpptTableOf } from "./mppt-table";

// The MPPT loading of the chosen option (the board "Inverter and sizing"; plan/phase-07-plan.md, decision 17;
// inventory 2.5): a row for each MPPT that has strings, Imp and Isc against their limits, kWp and the mark.

type Load = DesignOption["mppt_loads"][number];

const load = (mppt: number, strings: number, limit: number | null, inverter = 1): Load => ({
  inverter,
  mppt,
  label: `INV-${inverter} · MPPT ${mppt}`,
  strings,
  imp_a: strings * 13.58,
  imp_limit_a: limit,
  isc_a: strings * 14.3,
  isc_limit_a: limit,
  kwp: strings * 29 * 0.56,
  ok: limit !== null && strings * 14.3 <= limit,
});

const optionWith = (loads: Load[], more: Partial<DesignOption> = {}) =>
  ({ key: "29x22x1", letter: "A", n_strings: loads.reduce((sum, one) => sum + one.strings, 0), n_inverters: 1, mppt_loads: loads, ...more }) as DesignOption;

const A = optionWith([4, 4, 4, 4, 3, 3].map((strings, index) => load(index + 1, strings, 65)));
const BY_IMAXDC: CurrentPerMppt = { value_a: 65, source: "IMaxDC over the MPPT count", note: "Not in the OND: IMaxDC 390 A ÷ 6 MPPT. Enter the datasheet value if it differs." };
const NOT_IN_THE_OND: CurrentPerMppt = { value_a: null, source: "not in the OND", note: "Not in the OND, and the OND has no IMaxDC to work it out from. Enter the datasheet value." };

describe("the MPPT table of option A", () => {
  const table = mpptTableOf(A, 1500, BY_IMAXDC);

  test("of option A, its caption the strings, the MPPTs and the voltage", () => {
    expect(table.of).toBe("of option A");
    expect(table.caption).toBe("Option A: 22 strings on 6 MPPT, at 1500 V");
    expect(table.note).toBeNull();
  });

  test("a row for each MPPT: its name and inverter, strings, Imp and Isc of their limits, kWp, a tick", () => {
    expect(table.rows.map((row) => row.strings)).toEqual(["4", "4", "4", "4", "3", "3"]);
    expect(table.rows[0]).toEqual({
      key: "INV-1 · MPPT 1",
      mppt: "MPPT 1",
      inverter: "INV-1",
      title: "INV-1 · MPPT 1",
      strings: "4",
      imp: { value: "54.3 of 65.0 A", words: null },
      isc: { value: "57.2 of 65.0 A", words: null },
      kwp: "64.96",
      mark: { kind: "fits", label: "Fits" },
    });
    expect(table.rows[5]).toMatchObject({ imp: { value: "40.7 of 65.0 A" }, isc: { value: "42.9 of 65.0 A" }, kwp: "48.72" });
  });
});

describe("a limit not known", () => {
  const table = mpptTableOf(optionWith(A.mppt_loads.map((one) => ({ ...one, imp_limit_a: null, isc_limit_a: null, ok: false }))), 1500, NOT_IN_THE_OND);

  test("each row says not known, with a note mark", () => {
    expect(table.rows.every((row) => row.mark.kind === "note" && row.mark.label === "Limit not known")).toBe(true);
    expect(table.rows[0]).toMatchObject({ imp: { value: "54.3 A", words: "of not known" }, isc: { value: "57.2 A", words: "of not known" } });
  });

  test("under the table the API's note on the current per MPPT, in its words", () => {
    expect(table.note).toBe(NOT_IN_THE_OND.note);
  });
});

describe("an MPPT over its limit", () => {
  test("has a note mark that says so", () => {
    const table = mpptTableOf(optionWith([load(1, 7, 65), load(2, 4, 65)], { key: "custom", letter: "F" }), 1500, BY_IMAXDC);
    expect(table.rows.map((row) => row.mark)).toEqual([
      { kind: "note", label: "Over the limit" },
      { kind: "fits", label: "Fits" },
    ]);
    expect(table.rows[0]!.imp.value).toBe("95.1 of 65.0 A");
    expect(table.of).toBe("of option F");
    expect(table.note).toBeNull();
  });
});

describe("two inverters", () => {
  test("the caption names them", () => {
    const loads = [load(1, 4, 65), load(2, 4, 65), load(1, 4, 65, 2)];
    const table = mpptTableOf(optionWith(loads, { letter: "D", n_inverters: 2 }), 1000, BY_IMAXDC);
    expect(table.caption).toBe("Option D: 12 strings on 3 MPPT of 2 inverters, at 1000 V");
    expect(table.rows.map((row) => row.title)).toEqual(["INV-1 · MPPT 1", "INV-1 · MPPT 2", "INV-2 · MPPT 1"]);
  });
});

import { describe, expect, test } from "bun:test";
import type { DesignOption, DesignResult, LayoutReadouts } from "../api";
import { CHANGE_WHEN_NOTHING_FITS, stringsViewOf, WAITING } from "./strings-view";

const RANGE_1500 = { system_v: 1500, n_min: 14, n_max: 29, upper_limit: "Voc limit" };
const VERDICT_A = { ok: true, title: "29 in series fits: Vmp 1,199 V at STC, inverter nominal 1,080 V", detail: "Voc at 11.9 °C is 1,480 V (limit 1500 V); …" };
const OPTION_A = { key: "29x22x1", n_series: 29, verdict: VERDICT_A } as unknown as DesignOption;

const run = (change: Partial<DesignResult> = {}) =>
  ({
    readouts: { positions: 790 },
    weather: { label: "PVGIS", hours: 8760 },
    equipment: { module: { v_max_iec: 1500 }, inverter: { vabs_max: 1500 } },
    series_range: RANGE_1500,
    options: [OPTION_A],
    chosen_option: "29x22x1",
    no_options: null,
    ...change,
  }) as unknown as DesignResult;

const WITHOUT_A_VOLTAGE = run({
  series_range: null,
  options: [],
  chosen_option: null,
  no_options: { code: "system_voltage_missing", title: "Choose a system voltage to size the strings", message: "600, 1000 or 1500 V. Nothing is sized until you choose." },
});

describe("before a system voltage (the board \"Studio, Strings lens, no system voltage yet\"; decisions 1 and 4)", () => {
  test("the decision, what waits for it, and what the run did already", () => {
    expect(stringsViewOf({ voltage: null, design: WITHOUT_A_VOLTAGE, readouts: null, option: null })).toEqual({
      kind: "before-a-voltage",
      limitLine: "The module is rated 1500 V and the inverter 1500 V. The lowest of the three sets the limit.",
      waiting: WAITING,
      done: ["Layout: 790 positions", "Weather: PVGIS, 8,760 hours", "Shading for every module"],
    });
  });

  test("the positions are of the newer layout when there is one", () => {
    const view = stringsViewOf({ voltage: null, design: WITHOUT_A_VOLTAGE, readouts: { positions: 812 } as LayoutReadouts, option: null });
    expect(view.kind === "before-a-voltage" && view.done[0]).toBe("Layout: 812 positions");
  });

  test("before any run: the decision stands, nothing is done yet, and no rating is said", () => {
    expect(stringsViewOf({ voltage: null, design: null, readouts: null, option: null })).toEqual({ kind: "before-a-voltage", limitLine: null, waiting: WAITING, done: [] });
  });

  test("a file without a rating is said so: the system voltage is then the limit", () => {
    const design = run({ ...WITHOUT_A_VOLTAGE, equipment: { module: { v_max_iec: 0 }, inverter: { vabs_max: 1100 } } } as unknown as Partial<DesignResult>);
    const view = stringsViewOf({ voltage: null, design, readouts: null, option: null });
    expect(view.kind === "before-a-voltage" && view.limitLine).toBe("The inverter is rated 1100 V; the module's file gives no rating. The lower of the two sets the limit.");
  });
});

describe("with a system voltage", () => {
  test("the range of the run, the chosen option's length and its verdict", () => {
    expect(stringsViewOf({ voltage: 1500, design: run(), readouts: null, option: OPTION_A })).toEqual({
      kind: "sized",
      voltage: 1500,
      range: RANGE_1500,
      chosen: 29,
      verdict: VERDICT_A,
      noOptions: null,
    } as never);
  });

  test("while the run of the voltage chosen is on its way, the range of another voltage is not shown", () => {
    const view = stringsViewOf({ voltage: 1000, design: run(), readouts: null, option: OPTION_A });
    expect(view).toEqual({ kind: "sized", voltage: 1000, range: null, chosen: null, verdict: null, noOptions: null });
  });

  test("the voltage chosen while the run before had none: the decision is not shown again", () => {
    expect(stringsViewOf({ voltage: 1500, design: WITHOUT_A_VOLTAGE, readouts: null, option: null }).kind).toBe("sized");
  });

  test("no string length fits: the engine's words as the verdict, and what can change it", () => {
    const reason = { code: "no_string_length_fits", title: "No string length fits this inverter", message: "No string length fits: at least 14 modules are needed for the 500 V MPPT minimum, but at most 11 fit under 600 V." } as const;
    const design = run({ series_range: { ...RANGE_1500, system_v: 600, n_max: 11 } as never, options: [], chosen_option: null, no_options: reason });
    expect(stringsViewOf({ voltage: 600, design, readouts: null, option: null })).toMatchObject({
      kind: "sized",
      chosen: null,
      verdict: { ok: false, title: reason.title, detail: reason.message },
      noOptions: { title: reason.title, message: reason.message, change: CHANGE_WHEN_NOTHING_FITS },
    });
  });

  test("too few positions: the API's words, without a verdict on the bar", () => {
    const reason = { code: "too_few_positions", title: "Too few positions for a string", message: "The roof holds 12 positions, …" } as const;
    const view = stringsViewOf({ voltage: 1500, design: run({ options: [], chosen_option: null, no_options: reason }), readouts: null, option: null });
    expect(view).toMatchObject({ verdict: null, noOptions: { title: reason.title, message: reason.message, change: null } });
  });
});

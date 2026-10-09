import { describe, expect, test } from "bun:test";
import type { DesignOption, DesignResult } from "../api";
import { CHANGE_WHEN_NOTHING_FITS, stringsViewOf } from "./strings-view";

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

describe("a design without a system voltage (one the app did not make: it gives every design one, D87)", () => {
  test("is said to have none, and nothing else is shown", () => {
    expect(stringsViewOf({ voltage: null, design: null, option: null })).toEqual({ kind: "no-voltage" });
  });
});

describe("with a system voltage", () => {
  test("the range of the run, the chosen option's length and its verdict", () => {
    expect(stringsViewOf({ voltage: 1500, design: run(), option: OPTION_A })).toEqual({
      kind: "sized",
      voltage: 1500,
      range: RANGE_1500,
      isOfTheVoltage: true,
      chosen: 29,
      verdict: VERDICT_A,
      noOptions: null,
    } as never);
  });

  test("while the run of the voltage chosen is on its way, the range of before stays, said to be of another voltage", () => {
    const view = stringsViewOf({ voltage: 1000, design: run(), option: OPTION_A });
    expect(view).toEqual({ kind: "sized", voltage: 1000, range: RANGE_1500, isOfTheVoltage: false, chosen: 29, verdict: VERDICT_A, noOptions: null } as never);
  });

  test("the voltage chosen while the run before had none: the decision is not shown again", () => {
    expect(stringsViewOf({ voltage: 1500, design: WITHOUT_A_VOLTAGE, option: null }).kind).toBe("sized");
  });

  test("no string length fits: the engine's words as the verdict, and what can change it", () => {
    const reason = { code: "no_string_length_fits", title: "No string length fits this inverter", message: "No string length fits: at least 14 modules are needed for the 500 V MPPT minimum, but at most 11 fit under 600 V." } as const;
    const design = run({ series_range: { ...RANGE_1500, system_v: 600, n_max: 11 } as never, options: [], chosen_option: null, no_options: reason });
    expect(stringsViewOf({ voltage: 600, design, option: null })).toMatchObject({
      kind: "sized",
      chosen: null,
      verdict: { ok: false, title: reason.title, detail: reason.message },
      noOptions: { title: reason.title, message: reason.message, change: CHANGE_WHEN_NOTHING_FITS },
    });
  });

  test("too few positions: the API's words, without a verdict on the bar", () => {
    const reason = { code: "too_few_positions", title: "Too few positions for a string", message: "The roof holds 12 positions, …", fits: null } as const;
    const view = stringsViewOf({ voltage: 1500, design: run({ options: [], chosen_option: null, no_options: reason }), option: null });
    expect(view).toMatchObject({ verdict: null, noOptions: { title: reason.title, message: reason.message, change: null, yourOwn: false } });
  });

  test("too few positions, but a short string fits: your own is offered, as the API's words advise (#171)", () => {
    const reason = { code: "too_few_positions", title: "Too few positions for a string", message: "… A string of 14 would fit: add it as your own option.", fits: 14 } as const;
    const view = stringsViewOf({ voltage: 1500, design: run({ options: [], chosen_option: null, no_options: reason }), option: null });
    expect(view).toMatchObject({ noOptions: { yourOwn: true } });
  });

  test("no length fits the voltage: your own is not offered, since no option is built", () => {
    const reason = { code: "no_string_length_fits", title: "None fit", message: "…", fits: null } as const;
    const view = stringsViewOf({ voltage: 1500, design: run({ options: [], chosen_option: null, no_options: reason }), option: null });
    expect(view).toMatchObject({ noOptions: { yourOwn: false } });
  });
});

import { describe, expect, test } from "bun:test";
import type { DesignOption, DesignResult } from "../api";
import { noStringsFitOf } from "./no-strings-fit";
import { stringsViewOf } from "./strings-view";

// The Strings step where no string length fits (V2 · 5, the board "Problems"): the problem at its head, the voltage that
// fits as its primary. The Pune demo at 600 V: a string holds at most 11 modules of its kind, the inverter needs 14.

const RANGE = { system_v: 600, n_min: 14, n_max: 11, ok: false };
const NONE_FITS = { code: "no_string_length_fits", title: "No string length fits this inverter", message: "At 600 V the longest string is 11 modules." };
const design = (over: Record<string, unknown>) => ({ chosen_option: null, options: [], no_options: NONE_FITS, series_range: RANGE, ...over }) as unknown as DesignResult;
const view = (result: DesignResult | null, voltage: number | null = 600) => stringsViewOf({ voltage, design: result, option: null as DesignOption | null });

describe("where no string length fits", () => {
  test("the problem at the step's head and the voltage that fits as its primary", () => {
    const fit = noStringsFitOf(view(design({})), { words: "At 1000 V one fits.", use: 1000 });

    expect(fit?.problem.title).toBe("No string length fits at 600 V");
    expect(fit?.problem.cause).toBe("This inverter needs at least 14 modules in a string. At 600 V a string holds at most 11.");
    expect(fit?.problem.actions.map((action) => action.label)).toEqual(["Choose another inverter", "Change the sizing temperatures"]);
    expect(fit?.primary).toEqual({ volts: 1000, label: "Use 1000 V", line: "Allowed on most commercial roofs. Check the site's code first." });
  });

  test("with no voltage the equipment takes that fits, the problem alone: the app never raises the voltage (D88)", () => {
    expect(noStringsFitOf(view(design({})), null)?.primary).toBeNull();
  });

  test("not where options exist, where only positions are lacking, or before a run", () => {
    expect(noStringsFitOf(view(design({ no_options: null })), null)).toBeNull();
    expect(noStringsFitOf(view(design({ no_options: { code: "too_few_positions", title: "Too few", message: "m", fits: null } })), null)).toBeNull();
    expect(noStringsFitOf(view(null), null)).toBeNull();
    expect(noStringsFitOf(view(design({}), null), null)).toBeNull();
  });
});

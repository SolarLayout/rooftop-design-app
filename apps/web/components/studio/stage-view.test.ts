import { describe, expect, test } from "bun:test";
import { layoutFailedOf, lineOf, stringsLineOf, subLineOf, sunFailedOf } from "./stage-view";
import type { LayoutReadouts, LayoutResponse } from "@/lib/api";
import { createResultsStore } from "@/lib/stores/results-store";

// The line under the lens's title on the stage: the roof's areas on the Roof lens, the positions on the
// Array lens (the boards "Studio, Roof lens" and "Studio, Array lens"), of the layout's read-outs.

const DEMO: LayoutReadouts = {
  positions: 790,
  tables: 28,
  rows: 6,
  pitch_m: 6.45,
  gcr: 0.709,
  profile_angle_deg: 30.5,
  roof_area_m2: 3600,
  inside_setback_area_m2: 3344,
  usable_area_m2: 3184,
  keepout_area_m2: 150,
  module_area_m2: 1646.4,
};

describe("the line under the title", () => {
  test("the Roof lens says the areas and counts the obstacles", () => {
    expect(subLineOf("roof", DEMO, 6)).toBe("3,600 m² · 3,344 m² inside the setback · 6 obstacles");
    expect(subLineOf("roof", DEMO, 1)).toBe("3,600 m² · 3,344 m² inside the setback · 1 obstacle");
    expect(subLineOf("roof", DEMO, 0)).toBe("3,600 m² · 3,344 m² inside the setback · no obstacles");
  });

  test("the Array lens says the positions, the tables, the rows and the area of all the positions", () => {
    // The board says 1,646 m²: the area of the 638 modules of the chosen option. The Array lens is about
    // the positions, so their area is what it says (phase-05-studio-roof-array.md, "As built").
    expect(subLineOf("array", { ...DEMO, module_area_m2: 2038.2 }, 6)).toBe("790 positions · 28 tables · 6 rows · 2,038 m² of modules");
  });

  test("the Sun and Strings lenses say nothing yet", () => {
    expect(subLineOf("sun", DEMO, 6)).toBeNull();
    expect(subLineOf("strings", DEMO, 6)).toBeNull();
  });

  test("without a layout there is nothing to say", () => {
    expect(subLineOf("roof", null, 6)).toBeNull();
  });
});

// The states of the stage (the board "Studio, Array lens, states"): while a layout is on its way the
// line keeps the words of before, dimmed; a layout that failed is a chip in the words of the API.
describe("the line while a layout is on its way", () => {
  const layout = (positions: number) => ({ readouts: { ...DEMO, positions }, layout: { notes: [] } }) as unknown as LayoutResponse;

  test("says the layout of before and is dimmed until the new one lands", () => {
    const store = createResultsStore();
    store.getState().layoutAsked(1);
    store.getState().layoutArrived(1, layout(790));
    expect(lineOf("array", store.getState(), 6)).toEqual({ words: "790 positions · 28 tables · 6 rows · 1,646 m² of modules", isUpdating: false });

    store.getState().layoutAsked(2);
    expect(lineOf("array", store.getState(), 6)).toEqual({ words: "790 positions · 28 tables · 6 rows · 1,646 m² of modules", isUpdating: true });

    store.getState().layoutArrived(2, layout(812));
    expect(lineOf("array", store.getState(), 6)).toEqual({ words: "812 positions · 28 tables · 6 rows · 1,646 m² of modules", isUpdating: false });
  });

  test("before any layout there is no line, even while the first is on its way", () => {
    const store = createResultsStore();
    store.getState().layoutAsked(1);
    expect(lineOf("array", store.getState(), 6)).toBeNull();
  });
});

describe("a layout that failed", () => {
  const CROSSES = { code: "engine_error", message: "The roof outline crosses itself. Give the corners in order around the roof." };

  test("is a chip with what failed, the message of the API and what to do; the layout of before stays", () => {
    const store = createResultsStore();
    store.getState().layoutAsked(1);
    store.getState().layoutArrived(1, { readouts: DEMO, layout: { notes: [] } } as unknown as LayoutResponse);
    store.getState().layoutAsked(2);
    store.getState().layoutFailed(2, CROSSES);

    expect(layoutFailedOf(store.getState())).toEqual({ title: "The layout was not updated", message: CROSSES.message, action: "Try again" });
    expect(lineOf("array", store.getState(), 6)?.isUpdating).toBe(false);
  });

  test("nothing while the layout is on its way or has landed", () => {
    const store = createResultsStore();
    store.getState().layoutAsked(1);
    expect(layoutFailedOf(store.getState())).toBeNull();
    store.getState().layoutArrived(1, { readouts: DEMO, layout: { notes: [] } } as unknown as LayoutResponse);
    expect(layoutFailedOf(store.getState())).toBeNull();
  });
});

// A sun that could not be fetched (the board "Time on the stage"): the chip of the stage in the API's words.
describe("a sun that failed", () => {
  const UNREACHABLE = { code: "api_unreachable", message: "The server cannot be reached. Check the connection and try again." };
  const KEY = { lat: 18.52, lon: 73.86, day: "design_day" as const };

  test("is a chip with what failed, the message of the API and what to do", () => {
    const store = createResultsStore();
    store.getState().sunAsked(KEY);
    store.getState().sunFailed(KEY, UNREACHABLE);

    expect(sunFailedOf(store.getState())).toEqual({ title: "The sun was not updated", message: UNREACHABLE.message, action: "Try again" });
  });

  test("nothing while the sun is on its way or has come", () => {
    const store = createResultsStore();
    store.getState().sunAsked(KEY);
    expect(sunFailedOf(store.getState())).toBeNull();
  });
});

describe("the line under the Strings lens's title (plan/phase-07-plan.md, decision 14)", () => {
  const A = { n_series: 29, n_strings: 22, n_inverters: 1, n_modules: 638 } as never;
  const D = { n_series: 26, n_strings: 27, n_inverters: 2, n_modules: 702 } as never;

  test("with an option: its strings, its inverters with their MPPTs, and the positions it leaves", () => {
    expect(stringsLineOf({ positions: 790, mppts: 6, option: A, noOptions: null })).toBe("22 strings of 29 modules · 1 inverter, 6 MPPT · 152 positions not used");
    expect(stringsLineOf({ positions: 790, mppts: 6, option: D, noOptions: null })).toBe("27 strings of 26 modules · 2 inverters, 6 MPPT each · 88 positions not used");
    expect(stringsLineOf({ positions: 29, mppts: 6, option: { n_series: 29, n_strings: 1, n_inverters: 1, n_modules: 29 } as never, noOptions: null })).toBe("1 string of 29 modules · 1 inverter, 6 MPPT · every position used");
  });

  test("before a voltage, and where no length fits, the positions are ready", () => {
    expect(stringsLineOf({ positions: 790, mppts: 6, option: null, noOptions: "system_voltage_missing" })).toBe("790 positions ready · no strings yet");
    expect(stringsLineOf({ positions: 790, mppts: 6, option: null, noOptions: "no_string_length_fits" })).toBe("790 positions ready · no string length fits");
    expect(stringsLineOf({ positions: 12, mppts: 6, option: null, noOptions: "too_few_positions" })).toBe("12 positions ready · too few for a string");
  });

  test("before any run, nothing", () => {
    expect(stringsLineOf({ positions: null, mppts: null, option: null, noOptions: null })).toBeNull();
  });
});

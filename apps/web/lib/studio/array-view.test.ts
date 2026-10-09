import { describe, expect, test } from "bun:test";
import type { ArraySpec, Coefficients, DesignResult, LayoutResponse, Module, Roof } from "../api";
import { azimuthLineOf, moduleShownOf, shadedLineOf, slopedTiltLineOf, WINDOW_SCALE, WINDOW_TICKS, windowCommitted } from "./array-view";

// What the Array lens reads out beside its fields (the board "Studio, Array lens, states"): the azimuth
// the engine chose or was given, the tilt of a sloped roof, the shaded positions, the window; and
// which module the card shows while a replaced file's run is on its way.

const ARRAY: ArraySpec = {
  tilt_deg: 15,
  azimuth_deg: null,
  orientation: "portrait",
  modules_in_tilt: 2,
  clearance_m: 0.5,
  module_gap_m: 0.02,
  row_pitch_m: null,
  ew_tilt_deg: 10,
  ew_ridge_gap_m: 0.3,
  flush_clearance_m: 0.1,
  allow_shaded: false,
  window_start_h: 9,
  window_end_h: 16,
  design_doy: null,
};

const LAYOUT = { layout: { azimuth: 180, pitch: 6.45 }, readouts: { gcr: 0.709 } } as unknown as LayoutResponse;

describe("the azimuth, decided by the engine or given", () => {
  test("on tilted rows the engine follows the roof edge closest to the equator", () => {
    expect(azimuthLineOf(ARRAY, LAYOUT, "flat_tilted")).toEqual({ value: "180° S", line: "Follows the roof edge closest to the equator", isEngine: true });
  });

  test("on an east-west roof the ridges run square to it, as the engine lays them (#171)", () => {
    expect(azimuthLineOf(ARRAY, LAYOUT, "flat_ew")).toEqual({ value: "180° S", line: "The ridges run square to the roof edge closest to the equator", isEngine: true });
  });

  test("given, the line says where that edge faces", () => {
    expect(azimuthLineOf({ ...ARRAY, azimuth_deg: 170 }, LAYOUT, "flat_tilted")).toEqual({ value: "170° S", line: "The roof edge closest to the equator faces 180° S", isEngine: false });
  });

  test("an azimuth that is no whole degree keeps its decimal", () => {
    expect(azimuthLineOf(ARRAY, { ...LAYOUT, layout: { ...LAYOUT.layout, azimuth: 172.4 } }, "flat_tilted").value).toBe("172.4° S");
  });

  test("without a layout there is no line yet, and no value unless one is given", () => {
    expect(azimuthLineOf(ARRAY, null, "flat_tilted")).toEqual({ value: null, line: null, isEngine: true });
    expect(azimuthLineOf({ ...ARRAY, azimuth_deg: 90 }, null, "flat_tilted")).toEqual({ value: "90° E", line: null, isEngine: false });
  });
});

describe("the tilt of a sloped roof", () => {
  test("follows the pitch set in the Roof lens", () => {
    const roof = { slope_deg: 10, slope_azimuth_deg: 180 } as Roof;
    expect(slopedTiltLineOf(roof)).toEqual({ value: "10°", line: "Follows the roof pitch · 10° facing 180° S · set in the Roof lens" });
  });
});

describe("the shaded positions", () => {
  test("say what the switch does either way", () => {
    expect(shadedLineOf(false)).toBe("Off: positions shaded inside the window stay empty");
    expect(shadedLineOf(true)).toBe("On: positions shaded inside the window are used too");
  });
});

describe("the shade-free window", () => {
  test("is a scale of solar hours by the quarter, from 5 to 19, with a tick at 05, 08, 12, 16 and 19", () => {
    expect(WINDOW_SCALE).toEqual({ min: 5, max: 19, step: 0.25 });
    expect(WINDOW_TICKS.map((tick) => tick.label)).toEqual(["05", "08", "12", "16", "19"]);
    expect(WINDOW_TICKS.map((tick) => tick.value)).toEqual([5, 8, 12, 16, 19]);
  });

  test("its start ends at noon and its end begins there: a handle past noon is brought back", () => {
    expect(windowCommitted([9.25, 16])).toEqual([9.25, 16]);
    expect(windowCommitted([13, 16])).toEqual([12, 16]);
    expect(windowCommitted([9, 11])).toEqual([9, 12]);
  });
});

describe("the module the card shows", () => {
  const MODULE = { model: "INA-144MHC-TF-560" } as Module;
  const REPLACED = { model: "Test" } as Module;
  const COEFFICIENTS = { source: "one-diode model" } as Coefficients;
  const design = { equipment: { module: MODULE, coefficients: COEFFICIENTS, module_notes: ["A note of the engine"] } } as unknown as DesignResult;
  const replaced = { module: REPLACED, coefficients: COEFFICIENTS, notes: [], edit: 5 };

  test("nothing before a design ran or a file was read", () => {
    expect(moduleShownOf({ design: null, designEdit: null, replaced: null })).toBeNull();
  });

  test("the design's equipment with its notes", () => {
    expect(moduleShownOf({ design, designEdit: 3, replaced: null })).toEqual({ module: MODULE, coefficients: COEFFICIENTS, notes: ["A note of the engine"] });
  });

  test("the module read from a replaced file, until the run of that edit lands", () => {
    expect(moduleShownOf({ design, designEdit: 3, replaced })).toEqual({ module: REPLACED, coefficients: COEFFICIENTS, notes: [] });
    expect(moduleShownOf({ design: null, designEdit: null, replaced })).toEqual({ module: REPLACED, coefficients: COEFFICIENTS, notes: [] });
    expect(moduleShownOf({ design, designEdit: 5, replaced })?.module).toBe(MODULE);
    expect(moduleShownOf({ design, designEdit: 6, replaced })?.module).toBe(MODULE);
  });
});

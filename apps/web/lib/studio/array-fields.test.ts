import { describe, expect, test } from "bun:test";
import type { ArraySpec, LayoutResponse } from "../api";
import { ARRAY_RANGES, designDayOf, mountingOf, pitchLineOf, spacingOf, tiltHintOf, withDesignDay, withPitchDecided, withAzimuthDecided } from "./array-fields";

// The fields of the Array lens (plan/phase-05-plan.md, steps 14 and 15, decisions 16 and 20), from
// plan/reference/functional-inventory.md, 1.3, on the demo's numbers.

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

const LAYOUT = { layout: { azimuth: 180, pitch: 6.45, kind: "flat_tilted" }, readouts: { gcr: 0.709, profile_angle_deg: 30.5 } } as unknown as LayoutResponse;

describe("the tilt's hint from the latitude", () => {
  test("suggests the latitude, held between 5 and 15, in the words of the board", () => {
    expect(tiltHintOf(18.52)).toBe("Latitude 18.5° N suggests 15°");
    expect(tiltHintOf(3.2)).toBe("Latitude 3.2° N suggests 5°");
    expect(tiltHintOf(-33.9)).toBe("Latitude 33.9° S suggests 15°");
    expect(tiltHintOf(10)).toBe("Latitude 10.0° N suggests 10°");
  });
});

describe("the mounting fields by roof type", () => {
  test("tilted rows: the tilt, the orientation, the modules in tilt, the clearance", () => {
    expect(mountingOf("flat_tilted")).toEqual(["tilt_deg", "orientation", "modules_in_tilt", "clearance_m"]);
  });

  test("east-west: the east-west tilt, the ridge gap, the clearance", () => {
    expect(mountingOf("flat_ew")).toEqual(["ew_tilt_deg", "ew_ridge_gap_m", "clearance_m"]);
  });

  test("sloped: the orientation and the modules in tilt; the tilt is the roof's", () => {
    expect(mountingOf("sloped_flush")).toEqual(["orientation", "modules_in_tilt"]);
  });

  test("the spacing: pitch and azimuth on tilted rows, the azimuth alone on east-west, nothing on sloped", () => {
    expect(spacingOf("flat_tilted")).toEqual(["row_pitch_m", "azimuth_deg"]);
    expect(spacingOf("flat_ew")).toEqual(["azimuth_deg"]);
    expect(spacingOf("sloped_flush")).toEqual([]);
  });

  test("the ranges are the inventory's", () => {
    expect(ARRAY_RANGES.tilt_deg).toEqual({ min: 0, max: 45, decimals: 0 });
    expect(ARRAY_RANGES.modules_in_tilt).toEqual({ min: 1, max: 4, decimals: 0 });
    expect(ARRAY_RANGES.clearance_m).toEqual({ min: 0, max: 3, decimals: 2 });
    expect(ARRAY_RANGES.azimuth_deg).toEqual({ min: 0, max: 359.9, decimals: 1 });
    expect(ARRAY_RANGES.ew_tilt_deg).toEqual({ min: 0, max: 30, decimals: 0 });
    expect(ARRAY_RANGES.ew_ridge_gap_m).toEqual({ min: 0, max: 2, decimals: 2 });
    expect(ARRAY_RANGES.row_pitch_m).toEqual({ min: 0.5, max: 30, decimals: 2 });
  });
});

describe("the pitch and the azimuth, decided by the engine or given", () => {
  test("the line under the pitch says shade-free, the GCR and the profile angle when the engine decides", () => {
    expect(pitchLineOf(ARRAY, LAYOUT)).toEqual({ value: "6.45 m", line: "Shade-free · GCR 0.71 · profile angle 30.5°", isEngine: true });
  });

  test("when the pitch is given the line says what shade-free would be", () => {
    // The layout of a pitch given is at that pitch: the line reads the engine's own, from the readouts (#179, item 9).
    const given = { layout: { ...LAYOUT.layout, pitch: 7 }, readouts: { ...LAYOUT.readouts, shade_free_pitch_m: 6.45 } } as unknown as LayoutResponse;
    expect(pitchLineOf({ ...ARRAY, row_pitch_m: 7 }, given)).toEqual({ value: "7.00 m", line: "Shade-free would be 6.45 m", isEngine: false });
  });

  test("without a layout the pitch has no line yet", () => {
    expect(pitchLineOf(ARRAY, null)).toEqual({ value: null, line: null, isEngine: true });
  });

  test("the switch off fills the field with the engine's last pitch; on sends null", () => {
    expect(withPitchDecided(ARRAY, LAYOUT, false).row_pitch_m).toBe(6.45);
    expect(withPitchDecided({ ...ARRAY, row_pitch_m: 7 }, LAYOUT, true).row_pitch_m).toBeNull();
    expect(withPitchDecided(ARRAY, null, false).row_pitch_m).toBeNull();
  });

  test("the azimuth the same, with the roof edge's azimuth from the layout", () => {
    expect(withAzimuthDecided(ARRAY, LAYOUT, false).azimuth_deg).toBe(180);
    expect(withAzimuthDecided({ ...ARRAY, azimuth_deg: 170 }, LAYOUT, true).azimuth_deg).toBeNull();
  });
});

describe("the design day", () => {
  test("is the winter solstice unless a day is given; 21 Jun is 172, 21 Mar is 80", () => {
    expect(designDayOf(ARRAY)).toBe("winter");
    expect(designDayOf({ ...ARRAY, design_doy: 172 })).toBe("june");
    expect(designDayOf({ ...ARRAY, design_doy: 80 })).toBe("march");
    expect(designDayOf({ ...ARRAY, design_doy: 100 })).toBe("winter");
    expect(withDesignDay(ARRAY, "june").design_doy).toBe(172);
    expect(withDesignDay(ARRAY, "march").design_doy).toBe(80);
    expect(withDesignDay({ ...ARRAY, design_doy: 172 }, "winter").design_doy).toBeNull();
  });
});

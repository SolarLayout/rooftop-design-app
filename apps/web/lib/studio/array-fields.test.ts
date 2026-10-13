import { describe, expect, test } from "bun:test";
import type { ArraySpec, LayoutResponse } from "../api";
import { ARRAY_RANGES, designDayOf, mountingFactsOf, mountingOf, mountingSetByOf, designDayLabelsOf, mountingHintOf, pitchLineOf, spacingFactsOf, spacingOf, spacingSentenceOf, spacingSetByOf, windowSetByOf, withDesignDay, withPitchDecided, withAzimuthDecided } from "./array-fields";
import type { Roof } from "../api";

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

describe("what stands under a mounting field (V2 · 7)", () => {
  test("the app's value is a Default with the usual thing after it; the user's is Yours with the default it took the place of", () => {
    const by = mountingSetByOf(ARRAY, "flat_tilted");

    expect(mountingHintOf("tilt_deg", by.tilt_deg!)).toBe("Default · low for wind on a flat roof");
    expect(mountingHintOf("modules_in_tilt", by.modules_in_tilt!)).toBe("Yours · default 1");
    expect(mountingHintOf("modules_in_tilt", mountingSetByOf({ ...ARRAY, modules_in_tilt: 1 }, "flat_tilted").modules_in_tilt!)).toBe("Default · one module up each row");
    expect(mountingHintOf("clearance_m", by.clearance_m!)).toBe("Default");
    const changed = mountingSetByOf({ ...ARRAY, tilt_deg: 20 }, "flat_tilted");
    expect(mountingHintOf("tilt_deg", changed.tilt_deg!)).toBe("Yours · default 15°");
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
    expect(pitchLineOf({ ...ARRAY, row_pitch_m: 7 }, given)).toEqual({ value: "7.00 m", line: "Shade-free spacing 6.45 m", isEngine: false });
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
  test("is the winter solstice unless a day is given; north of the equator the summer solstice is 172, 21 Mar is 80", () => {
    expect(designDayOf(ARRAY, 18.52)).toBe("winter");
    expect(designDayOf({ ...ARRAY, design_doy: 172 }, 18.52)).toBe("summer");
    expect(designDayOf({ ...ARRAY, design_doy: 80 }, 18.52)).toBe("march");
    expect(designDayOf({ ...ARRAY, design_doy: 100 }, 18.52)).toBe("winter");
    expect(withDesignDay(ARRAY, "summer", 18.52).design_doy).toBe(172);
    expect(withDesignDay(ARRAY, "march", 18.52).design_doy).toBe(80);
    expect(withDesignDay({ ...ARRAY, design_doy: 172 }, "winter", 18.52).design_doy).toBeNull();
  });

  test("south of the equator the summer solstice is 21 December, and 21 June given is the winter solstice (#238, 1)", () => {
    expect(withDesignDay(ARRAY, "summer", -33.9).design_doy).toBe(355);
    expect(designDayOf({ ...ARRAY, design_doy: 355 }, -33.9)).toBe("summer");
    expect(designDayOf({ ...ARRAY, design_doy: 172 }, -33.9)).toBe("winter");
  });
});

describe("who set each field of the array (V2 · 3)", () => {
  const AT_DEFAULTS = { ...ARRAY, modules_in_tilt: 1 };

  test("the mounting at the API's defaults is the app's; a value changed is Yours, with its default", () => {
    expect(Object.values(mountingSetByOf(AT_DEFAULTS, "flat_tilted")).map((by) => by.kind)).toEqual(["default", "default", "default", "default"]);
    const changed = mountingSetByOf({ ...AT_DEFAULTS, tilt_deg: 10, orientation: "landscape" }, "flat_tilted");
    expect(changed.tilt_deg).toEqual({ kind: "yours", byDefault: "15°" });
    expect(changed.orientation).toEqual({ kind: "yours", byDefault: "portrait" });
    expect(changed.clearance_m).toEqual({ kind: "default" });
  });

  test("the mounting of a roof type has its own fields", () => {
    expect(Object.keys(mountingSetByOf(AT_DEFAULTS, "flat_ew"))).toEqual(["ew_tilt_deg", "ew_ridge_gap_m", "clearance_m"]);
  });

  test("a spacing the engine decides is the app's; one given is Yours", () => {
    expect(spacingSetByOf(ARRAY, "flat_tilted")).toEqual({ row_pitch_m: { kind: "default" }, azimuth_deg: { kind: "default" } });
    expect(spacingSetByOf({ ...ARRAY, row_pitch_m: 5 }, "flat_tilted").row_pitch_m).toEqual({ kind: "yours", byDefault: "shade-free" });
    expect(spacingSetByOf({ ...ARRAY, azimuth_deg: 170 }, "flat_tilted").azimuth_deg).toEqual({ kind: "yours", byDefault: "the roof edge's" });
  });

  test("the window, the design day and shaded positions against their defaults", () => {
    expect(Object.values(windowSetByOf(ARRAY, 18.52)).map((by) => by.kind)).toEqual(["default", "default", "default"]);
    const changed = windowSetByOf({ ...ARRAY, window_start_h: 8, design_doy: 172, allow_shaded: true }, 18.52);
    expect(changed).toEqual({ window: { kind: "yours", byDefault: "09:00 to 16:00" }, design_day: { kind: "yours", byDefault: "winter solstice" }, allow_shaded: { kind: "yours", byDefault: "off" } });
  });
});

describe("the facts of the array's sections, on one line (V2 · 3)", () => {
  const roof = (roof_type: Roof["roof_type"]) => ({ roof_type, slope_deg: 12, slope_azimuth_deg: 180 }) as Roof;

  test("the mounting of each roof type", () => {
    expect(mountingFactsOf(ARRAY, roof("flat_tilted"))).toBe("Tilt 15° · portrait · 2 in tilt");
    expect(mountingFactsOf(ARRAY, roof("flat_ew"))).toBe("East-west 10° · ridge gap 0.30 m");
    expect(mountingFactsOf({ ...ARRAY, orientation: "landscape" }, roof("sloped_flush"))).toBe("Flush at 12° · landscape · 2 in tilt");
  });

  test("the spacing: how far apart the rows stand and the hours they are free of shade", () => {
    expect(spacingFactsOf(ARRAY, LAYOUT, "flat_tilted")).toBe("Rows 6.45 m apart · shade-free hours 09:00 to 16:00");
    expect(spacingFactsOf(ARRAY, LAYOUT, "flat_ew")).toBe("Direction 180.0° · shade-free hours 09:00 to 16:00");
    expect(spacingFactsOf(ARRAY, LAYOUT, "sloped_flush")).toBe("Shade-free hours 09:00 to 16:00");
    expect(spacingFactsOf(ARRAY, null, "flat_tilted")).toBeNull();
  });
});

describe("the one sentence of Spacing (V2 · 7; audit V2-34)", () => {
  test("says why the rows stand where they do; the profile angle and the ground coverage ratio are in the help", () => {
    const sentence = spacingSentenceOf(ARRAY, LAYOUT, "flat_tilted", 18.52);

    expect(sentence).toBe("Rows stand 6.45 m apart so that they do not shade each other from 09:00 to 16:00 on 21 Dec.");
    expect(sentence).not.toMatch(/GCR|profile angle/);
  });

  test("a spacing typed says so and what shade-free would be", () => {
    const sentence = spacingSentenceOf({ ...ARRAY, row_pitch_m: 7 }, { ...LAYOUT, layout: { ...LAYOUT.layout, pitch: 7 }, readouts: { ...LAYOUT.readouts, shade_free_pitch_m: 6.45 } } as LayoutResponse, "flat_tilted", 18.52);

    expect(sentence).toBe("Rows stand 7.00 m apart. The shade-free spacing is 6.45 m.");
  });

  test("on the design day of the array, in the other hemisphere too; none before a layout or where no row pitch applies", () => {
    expect(spacingSentenceOf({ ...ARRAY, design_doy: 172 }, LAYOUT, "flat_tilted", 18.52)).toContain("on 21 Jun.");
    expect(spacingSentenceOf(ARRAY, LAYOUT, "flat_tilted", -33.9)).toContain("on 21 Jun.");
    expect(spacingSentenceOf({ ...ARRAY, design_doy: 355 }, LAYOUT, "flat_tilted", -33.9)).toContain("on 21 Dec.");
    expect(spacingSentenceOf(ARRAY, null, "flat_tilted", 18.52)).toBeNull();
    expect(spacingSentenceOf(ARRAY, LAYOUT, "flat_ew", 18.52)).toBeNull();
  });

  test("the design days, named by their date", () => {
    expect(designDayLabelsOf(18.52)).toEqual({ winter: "21 Dec", summer: "21 Jun", march: "21 Mar" });
    expect(designDayLabelsOf(-33.9)).toEqual({ winter: "21 Jun", summer: "21 Dec", march: "21 Mar" });
  });
});

// The values the app gives a design the user has not set (V2 · 3, D97): the API's defaults of the roof and the array,
// as its schema states them, and the roof type's rule for a sloped roof. A value equal to its default is the app's; any
// other is the user's. defaults.test.ts holds them equal to packages/api-types/openapi.json.
import type { ArraySpec, Roof } from "../api";
import { PITCH_UNLESS_SET } from "../geometry/roof-type-rule";
import type { RoofFieldId } from "./roof-fields";

export const ROOF_DEFAULTS: Readonly<Record<RoofFieldId, number>> = {
  parapet_h: 0.9,
  setback_m: 1,
  walkway_m: 0.6,
  walkway_every_modules: 24,
  walkway_every_rows: 4,
  obstacle_clearance_m: 0.5,
  albedo: 0.2,
  slope_deg: 0,
  slope_azimuth_deg: 180,
};

/** The fields of the array that have a default value; the ones the engine decides are null until the user sets them. */
export type ArrayDefaultId = "tilt_deg" | "orientation" | "modules_in_tilt" | "clearance_m" | "ew_tilt_deg" | "ew_ridge_gap_m" | "window_start_h" | "window_end_h" | "allow_shaded";

export const ARRAY_DEFAULTS: Readonly<{ [Id in ArrayDefaultId]: ArraySpec[Id] }> = {
  tilt_deg: 15,
  orientation: "portrait",
  modules_in_tilt: 1,
  clearance_m: 0.5,
  ew_tilt_deg: 10,
  ew_ridge_gap_m: 0.3,
  window_start_h: 9,
  window_end_h: 16,
  allow_shaded: false,
};

/** The default of a roof's field: a sloped roof has no parapet and the pitch the roof type's rule gives it. */
export function roofDefaultOf(roof: Roof, id: RoofFieldId): number {
  if (roof.roof_type === "sloped_flush" && id === "parapet_h") return 0;
  if (roof.roof_type === "sloped_flush" && id === "slope_deg") return PITCH_UNLESS_SET;
  return ROOF_DEFAULTS[id];
}

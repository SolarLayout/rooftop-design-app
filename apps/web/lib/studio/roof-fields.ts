// The fields of the Roof lens (plan/phase-05-plan.md, step 11, decision 20), written once from
// plan/reference/functional-inventory.md, 1.1: each with its unit, its range and its decimals. The
// inspector renders them; a committed value is an edit of the roof.
import type { Range } from "../../components/ui/number-entry";
import type { Roof } from "../api";

/** The numbers of the roof a field edits. */
export type RoofFieldId = "parapet_h" | "setback_m" | "walkway_m" | "walkway_every_modules" | "walkway_every_rows" | "obstacle_clearance_m" | "albedo" | "slope_deg" | "slope_azimuth_deg";

export type RoofFieldSpec = { label: string; unit?: string; range: Range; hint?: string };

export type RoofField = RoofFieldSpec & { id: RoofFieldId; value: number };

export const ROOF_FIELDS: Record<RoofFieldId, RoofFieldSpec> = {
  parapet_h: { label: "Parapet", unit: "m", range: { min: 0, max: 5, decimals: 2 } },
  setback_m: { label: "Setback", unit: "m", range: { min: 0, max: 10, decimals: 2 } },
  walkway_m: { label: "Walkway", unit: "m", range: { min: 0, max: 3, decimals: 2 } },
  walkway_every_modules: { label: "Every", unit: "mod", range: { min: 0, max: 500, decimals: 0 }, hint: "0 is no walkway" },
  walkway_every_rows: { label: "Every", unit: "rows", range: { min: 0, max: 500, decimals: 0 }, hint: "0 is no walkway" },
  obstacle_clearance_m: { label: "Clearance", unit: "m", range: { min: 0, max: 5, decimals: 2 } },
  albedo: { label: "Albedo", range: { min: 0.05, max: 0.9, decimals: 2 }, hint: "0.20 concrete, 0.60 white membrane" },
  slope_deg: { label: "Pitch", unit: "°", range: { min: 0, max: 60, decimals: 0 } },
  slope_azimuth_deg: { label: "Faces", unit: "°", range: { min: 0, max: 359.9, decimals: 1 } },
};

/** The fields of a roof, in the order of the board: the walkway is every so many modules on tilted rows, rows otherwise. */
export function roofFieldsOf(roof: Roof): RoofField[] {
  const every: RoofFieldId = roof.roof_type === "flat_tilted" ? "walkway_every_modules" : "walkway_every_rows";
  const ids: RoofFieldId[] = ["parapet_h", "setback_m", "walkway_m", every, "obstacle_clearance_m", "albedo"];
  if (roof.roof_type === "sloped_flush") ids.push("slope_deg", "slope_azimuth_deg");
  return ids.map((id) => ({ id, ...ROOF_FIELDS[id], value: roof[id] }));
}

/** The roof with one field set; the same roof when nothing changes. */
export function withRoofField(roof: Roof, id: RoofFieldId, value: number): Roof {
  return roof[id] === value ? roof : { ...roof, [id]: value };
}

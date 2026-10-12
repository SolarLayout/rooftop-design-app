// The fields of the Roof lens (plan/phase-05-plan.md, step 11, decision 20), written once from
// plan/reference/functional-inventory.md, 1.1: each with its unit, its range and its decimals. The
// inspector renders them; a committed value is an edit of the roof.
import { shown, withUnit, type Range } from "../../components/ui/number-entry";
import type { Roof } from "../api";
import { ROOF_TYPES } from "../geometry/roof-types";
import { roofDefaultOf } from "./defaults";
import { hintOf, setByOfValue, type SetBy } from "./set-by";

/** The numbers of the roof a field edits. */
export type RoofFieldId = "parapet_h" | "setback_m" | "walkway_m" | "walkway_every_modules" | "walkway_every_rows" | "obstacle_clearance_m" | "albedo" | "slope_deg" | "slope_azimuth_deg";

export type RoofFieldSpec = { label: string; unit?: string; range: Range };

export type RoofField = RoofFieldSpec & {
  id: RoofFieldId;
  value: number;
  /** Who set the value (V2 · 3): the app, or the user, with the default Reset gives back. */
  setBy: SetBy;
  byDefault: number;
  /** What stands under the label while the app's value does: "Default · measure it on site"; the user's value, "Yours · default 0.90 m". */
  hint: string;
};

/** The usual thing, said after Default (V2 · 7): why the app's value is what it is, or what is usual. */
const USUAL: Partial<Record<RoofFieldId, string>> = {
  parapet_h: "measure it on site",
  setback_m: "usually 0.5 to 1.5 m",
  walkway_every_modules: "counted in modules along a row",
  obstacle_clearance_m: "kept free on every side",
};

export const ROOF_FIELDS: Record<RoofFieldId, RoofFieldSpec> = {
  parapet_h: { label: "Parapet height", unit: "m", range: { min: 0, max: 5, decimals: 2 } },
  setback_m: { label: "Edge margin (setback)", unit: "m", range: { min: 0, max: 10, decimals: 2 } },
  walkway_m: { label: "Walkway width", unit: "m", range: { min: 0, max: 3, decimals: 2 } },
  walkway_every_modules: { label: "Walkway every", unit: "modules", range: { min: 0, max: 500, decimals: 0 } },
  walkway_every_rows: { label: "Walkway every", unit: "rows", range: { min: 0, max: 500, decimals: 0 } },
  obstacle_clearance_m: { label: "Clearance", unit: "m", range: { min: 0, max: 5, decimals: 2 } },
  albedo: { label: "Roof albedo", range: { min: 0.05, max: 0.9, decimals: 2 } },
  slope_deg: { label: "Roof pitch", unit: "°", range: { min: 0, max: 60, decimals: 0 } },
  slope_azimuth_deg: { label: "Direction (azimuth)", unit: "°", range: { min: 0, max: 359.9, decimals: 1 } },
};

/** The fields of a roof, in the order of the board: the walkway is every so many modules on tilted rows, rows otherwise. */
export function roofFieldsOf(roof: Roof): RoofField[] {
  const every: RoofFieldId = roof.roof_type === "flat_tilted" ? "walkway_every_modules" : "walkway_every_rows";
  const ids: RoofFieldId[] = ["parapet_h", "setback_m", "walkway_m", every, "obstacle_clearance_m"];
  if (roof.roof_type === "sloped_flush") ids.push("slope_deg", "slope_azimuth_deg");
  return ids.map((id) => {
    const spec = ROOF_FIELDS[id];
    const byDefault = roofDefaultOf(roof, id);
    const setBy = setByOfValue(roof[id], byDefault, { decimals: spec.range.decimals, ...(spec.unit ? { unit: spec.unit } : {}) });
    const usual = USUAL[id];
    return { id, ...spec, value: roof[id], byDefault, setBy, hint: setBy.kind === "default" && usual ? `${hintOf(setBy)} · ${usual}` : hintOf(setBy) };
  });
}

export type RoofGroup = { title: string; fields: RoofField[] };

/** The fields in groups of what belongs together (V2 · 7): at the edges, access, around obstacles, and a sloped roof's pitch. */
export function roofGroupsOf(roof: Roof): RoofGroup[] {
  const fields = roofFieldsOf(roof);
  const of = (...ids: RoofFieldId[]) => fields.filter((field) => ids.includes(field.id));
  const groups: RoofGroup[] = [
    { title: "At the edges", fields: of("parapet_h", "setback_m") },
    { title: "Access", fields: of("walkway_m", "walkway_every_modules", "walkway_every_rows") },
    { title: "Around obstacles", fields: of("obstacle_clearance_m") },
  ];
  if (roof.roof_type === "sloped_flush") groups.push({ title: "Sloped roof", fields: of("slope_deg", "slope_azimuth_deg") });
  return groups;
}

/** The roof's albedo has one home, Performance's assumptions; the Roof step says the value and points there. */
export const albedoLineOf = (roof: Pick<Roof, "albedo">): string => `Roof albedo ${shown(roof.albedo, 2)} · in Performance, Assumptions`;

/** The roof with one field set; the same roof when nothing changes. */
export function withRoofField(roof: Roof, id: RoofFieldId, value: number): Roof {
  return roof[id] === value ? roof : { ...roof, [id]: value };
}

// The facts of each section of the Roof step on one line, as its summary row says them (V2 · 3).

const lower = (words: string) => (/^[A-Z][a-z]/.test(words) ? words[0]?.toLowerCase() + words.slice(1) : words);

/** The roof type in its words: "Flat, tilted rows · rows facing the equator". */
export function roofTypeFactsOf(roof: Roof): string {
  const type = ROOF_TYPES.find((one) => one.id === roof.roof_type);
  return type ? `${type.name} · ${lower(type.caption)}` : "";
}

const metres = (id: RoofFieldId, value: number) => withUnit(shown(value, ROOF_FIELDS[id].range.decimals), ROOF_FIELDS[id].unit);

/** The edges: the parapet, which shades the first row, and the edge margin (setback). */
export function edgesFactsOf(roof: Roof): string {
  const parapet = roof.parapet_h > 0 ? `Parapet ${metres("parapet_h", roof.parapet_h)}` : "No parapet";
  return `${parapet} · edge margin ${metres("setback_m", roof.setback_m)}`;
}

/** The obstacles by name, in their order; those of one kind ("AC unit 1", "AC unit 2") counted once. */
export function obstaclesFactsOf(obstacles: Roof["obstacles"]): string {
  if (obstacles.length === 0) return "None on the roof";
  const kinds = new Map<string, number>();
  for (const { name } of obstacles) {
    const kind = name.replace(/\s+\d+$/, "");
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
  }
  const said = [...kinds].map(([kind, count]) => (count === 1 ? kind : `${count} ${kind}s`));
  return said.map((words, index) => (index === 0 ? words : lower(words))).join(", ");
}

/** Where the roof is, in degrees to two decimals. */
export function placeFactsOf(roof: Pick<Roof, "lat" | "lon">): string {
  return `${shown(Math.abs(roof.lat), 2)}° ${roof.lat >= 0 ? "N" : "S"}, ${shown(Math.abs(roof.lon), 2)}° ${roof.lon >= 0 ? "E" : "W"}`;
}

/** The outline on one line (V2 · 7): where the roof is, its area once a layout gave it, and that it is edited in the plan. */
export function outlineFactsOf(roof: Pick<Roof, "lat" | "lon">, areaM2: number | null): string {
  return [placeFactsOf(roof), ...(areaM2 === null ? [] : [`${shown(Math.round(areaM2), 0)} m²`]), "Edit it in Plan"].join(" · ");
}

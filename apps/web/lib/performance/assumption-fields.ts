// The assumptions of Performance (plan/phase-08-plan.md, decisions 6, 7 and 8; functional-inventory.md 1.7; the boards
// "Performance" and "Weather and assumptions"): the thermal Uc, the rear shading and mismatch, the roof's albedo, the two
// sigmas, the three exceedance levels and the grid CO₂ factor, each a field of the document with the inventory's range.
// Uc is empty while the roof type's holds and says the run's value; the levels are sorted and each kept once. Pure.
import type { Range } from "../../components/ui/number-entry";
import { shown } from "../../components/ui/number-entry";
import type { DesignResult, Project } from "../api";

export type AssumptionId = "uc" | "rear_loss_pct" | "albedo" | "weather_sigma_pct" | "model_sigma_pct" | "co2_t_per_mwh";

export const ASSUMPTION_RANGES: Record<AssumptionId, Range & { min: number; max: number }> = {
  uc: { min: 5, max: 60, decimals: 0 },
  rear_loss_pct: { min: 0, max: 50, decimals: 1 },
  albedo: { min: 0.05, max: 0.9, decimals: 2 },
  weather_sigma_pct: { min: 0, max: 20, decimals: 1 },
  model_sigma_pct: { min: 0, max: 20, decimals: 1 },
  co2_t_per_mwh: { min: 0, max: 2, decimals: 3 },
};

/** An exceedance level, P50 to P99, whole. */
export const LEVEL_RANGE: Range & { min: number; max: number } = { min: 50, max: 99, decimals: 0 };

/** How many levels the document holds at most: the three fields of the chip. */
export const LEVELS = 3;

export type AssumptionField = {
  kind: "field";
  id: AssumptionId;
  label: string;
  unit: string | null;
  range: Range & { min: number; max: number };
  /** The document's value; null while the default holds (Uc). */
  value: number | null;
  /** The default and where it comes from, said beside an empty field ("29 W/m²K by roof type"); null where there is nothing to say. */
  detail: string | null;
  /** The words of the press that gives the field back to its default; null while it holds, or where there is none. */
  reset: string | null;
};

export type LevelsField = {
  kind: "levels";
  label: string;
  /** The document's levels, lowest first; null for a field of the three the document has no level for. */
  levels: (number | null)[];
  range: Range & { min: number; max: number };
};

export type Assumption = AssumptionField | LevelsField;

const UC = "Thermal Uc";
const UC_UNIT = "W/m²K";
const USE_THE_ROOF_TYPES = "Use the roof type's";

/** What of the run the fields read: the Uc the engine took, and where it came from. */
type Sizing = Pick<DesignResult["sizing"], "uc" | "uc_from">;

function ucOf(document: Project, sizing: Sizing | null): AssumptionField {
  const value = document.losses.uc ?? null;
  const byRoofType = value === null && sizing !== null && sizing.uc_from === "roof type" ? `${shown(sizing.uc, 0)} ${UC_UNIT} by roof type` : null;
  return { kind: "field", id: "uc", label: UC, unit: UC_UNIT, range: ASSUMPTION_RANGES.uc, value, detail: byRoofType, reset: value === null ? null : USE_THE_ROOF_TYPES };
}

const field = (id: Exclude<AssumptionId, "uc" | "albedo">, label: string, unit: string, document: Project): AssumptionField => ({
  kind: "field",
  id,
  label,
  unit,
  range: ASSUMPTION_RANGES[id],
  value: document.losses[id],
  detail: null,
  reset: null,
});

/** The assumptions from the document and the run's sizing (null before a run), in the board's order. */
export function assumptionsOf(document: Project, sizing: Sizing | null): Assumption[] {
  const levels = Array.from({ length: LEVELS }, (_, index) => document.losses.p_levels[index] ?? null);
  return [
    ucOf(document, sizing),
    field("rear_loss_pct", "Rear shading and mismatch", "%", document),
    { kind: "field", id: "albedo", label: "Roof albedo", unit: null, range: ASSUMPTION_RANGES.albedo, value: document.roof.albedo, detail: null, reset: null },
    field("weather_sigma_pct", "Weather variability", "%", document),
    field("model_sigma_pct", "Model and data", "%", document),
    { kind: "levels", label: "Exceedance levels", levels, range: LEVEL_RANGE },
    field("co2_t_per_mwh", "Grid CO₂", "t/MWh", document),
  ];
}

/** The document with an assumption entered, or Uc given back to the roof type's (null); the same document when nothing changes. */
export function withAssumption(document: Project, id: AssumptionId, value: number | null): Project {
  if (id === "albedo") {
    if (value === null || document.roof.albedo === value) return document;
    return { ...document, roof: { ...document.roof, albedo: value } };
  }
  if ((document.losses[id] ?? null) === value) return document;
  return { ...document, losses: { ...document.losses, [id]: value } };
}

/** The document with the level of one field entered: the levels sorted and each kept once (decision 8); the same document when nothing changes. */
export function withLevel(document: Project, index: number, value: number): Project {
  const entered = Array.from({ length: LEVELS }, (_, at) => (at === index ? value : (document.losses.p_levels[at] ?? null)));
  const levels = [...new Set(entered.filter((level): level is number => level !== null))].sort((a, b) => a - b);
  const before = document.losses.p_levels;
  if (levels.length === before.length && levels.every((level, at) => level === before[at])) return document;
  return { ...document, losses: { ...document.losses, p_levels: levels } };
}

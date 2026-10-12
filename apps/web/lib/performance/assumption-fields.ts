// The fields of Performance's assumptions (plan/phase-08-plan.md, decisions 6, 7 and 8; functional-inventory.md 1.7; V2 · 8,
// D104): under the rows Roof albedo, Ageing, Uncertainty and Grid CO₂ per MWh, each a field of the document with the
// inventory's range and who set it; the levels sorted and each kept once. Uc and the rear side's shading stand on their own
// steps of the chain (loss-fields.ts). Pure.
import type { Range } from "../../components/ui/number-entry";
import type { Project } from "../api";
import { ROOF_DEFAULTS } from "../studio/defaults";
import { hintOf, setByOfValue, type SetBy } from "../studio/set-by";
import { DEGRADATION_RANGE } from "./degradation";
import { LOSS_DEFAULTS } from "./loss-defaults";

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

/** How many levels the document holds at most: the three fields. */
export const LEVELS = 3;

/** The fields under the rows: the assumptions' own and the degradation. */
export type RowFieldId = Exclude<AssumptionId, "uc" | "rear_loss_pct"> | "degradation_pct";

export type AssumptionField = {
  kind: "field";
  id: RowFieldId;
  label: string;
  unit: string | null;
  range: Range & { min: number; max: number };
  value: number;
  /** Who set it, under the field (V2 · 3): "Default", "Yours · default 0.20". */
  hint: string;
};

export type LevelsField = {
  kind: "levels";
  label: string;
  /** The document's levels, lowest first; null for a field of the three the document has no level for. */
  levels: (number | null)[];
  range: Range & { min: number; max: number };
};

export type Assumption = AssumptionField | LevelsField;

export type AssumptionFields = { albedo: AssumptionField[]; ageing: AssumptionField[]; uncertainty: Assumption[]; co2: AssumptionField[] };

/** The grid's CO₂ the API gives is India's (CEA): said as set for India while it holds. */
const CO2_COUNTRY = "India";

function fieldOf(id: RowFieldId, label: string, unit: string | null, range: AssumptionField["range"], value: number, byDefault: number, by?: SetBy): AssumptionField {
  const setBy = setByOfValue(value, byDefault, { decimals: range.decimals, ...(unit ? { unit } : {}) });
  return { kind: "field", id, label, unit, range, value, hint: hintOf(setBy.kind === "default" && by ? by : setBy) };
}

/** The fields of each row, from the document. */
export function assumptionFieldsOf(document: Pick<Project, "roof" | "losses">): AssumptionFields {
  const { losses } = document;
  const levels = Array.from({ length: LEVELS }, (_, index) => losses.p_levels[index] ?? null);
  return {
    albedo: [fieldOf("albedo", "Roof albedo", null, ASSUMPTION_RANGES.albedo, document.roof.albedo, ROOF_DEFAULTS.albedo)],
    ageing: [fieldOf("degradation_pct", "Less each year", "%", DEGRADATION_RANGE, losses.degradation_pct, LOSS_DEFAULTS.degradation_pct)],
    uncertainty: [
      fieldOf("weather_sigma_pct", "Weather variability", "%", ASSUMPTION_RANGES.weather_sigma_pct, losses.weather_sigma_pct, LOSS_DEFAULTS.weather_sigma_pct),
      fieldOf("model_sigma_pct", "Model and data", "%", ASSUMPTION_RANGES.model_sigma_pct, losses.model_sigma_pct, LOSS_DEFAULTS.model_sigma_pct),
      { kind: "levels", label: "Exceedance levels", levels, range: LEVEL_RANGE },
    ],
    co2: [fieldOf("co2_t_per_mwh", "Grid CO₂", "t/MWh", ASSUMPTION_RANGES.co2_t_per_mwh, losses.co2_t_per_mwh, LOSS_DEFAULTS.co2_t_per_mwh, { kind: "country", country: CO2_COUNTRY })],
  };
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

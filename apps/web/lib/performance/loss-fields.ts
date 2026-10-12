// The steps of the chain that are the user's (plan/phase-08-plan.md, decision 6; functional-inventory.md 1.7;
// the board "Loss chain, edited"): each a field of the document's losses with the inventory's range, found by
// the engine's label of its step. LID is empty while the PAN's holds and says so, Uc on Temperature while the roof
// type's does (V2 · 8: the assumptions keep five rows); the rear gain is a switch, which a monofacial module cannot use,
// with the rear side's shading and mismatch beside it. Pure.
import type { Range } from "../../components/ui/number-entry";
import { shown } from "../../components/ui/number-entry";
import type { DesignResult, Energy, Module, Project } from "../api";
import { ASSUMPTION_RANGES } from "./assumption-fields";

type RangedId = "soiling_pct" | "quality_pct" | "lid_pct" | "mismatch_pct" | "dc_ohmic_pct" | "ac_ohmic_pct" | "availability_pct";
export type LossFieldId = RangedId | "uc" | "rear_loss_pct";
export type LossId = LossFieldId | "bifacial";

export const LOSS_RANGES: Record<RangedId, Range & { min: number; max: number }> = {
  soiling_pct: { min: 0, max: 30, decimals: 1 },
  quality_pct: { min: -5, max: 10, decimals: 1 },
  lid_pct: { min: 0, max: 10, decimals: 1 },
  mismatch_pct: { min: 0, max: 10, decimals: 1 },
  dc_ohmic_pct: { min: 0, max: 10, decimals: 1 },
  ac_ohmic_pct: { min: 0, max: 10, decimals: 1 },
  availability_pct: { min: 80, max: 100, decimals: 1 },
};

export type LossField = {
  kind: "field";
  id: LossFieldId;
  /** The engine's label of the step: the field's name. */
  label: string;
  unit: string;
  range: Range & { min: number; max: number };
  /** The document's value; null while the default holds (LID). */
  value: number | null;
  /** Empty: the default, said inside the field before its unit ("PAN 0.2"). Entered: the default, said under the row ("PAN gives 0.2 %"). Null for a field that has no default to say. */
  detail: string | null;
  /** The words of the press that gives the field back to its default; null while it holds, or where there is none. */
  reset: string | null;
};

export type RearGainSwitch = {
  kind: "switch";
  id: "bifacial";
  label: string;
  on: boolean;
  /** The module has no rear side: the switch cannot be used. */
  disabled: boolean;
  /** Why it cannot be used, in the desktop's words; null when it can. */
  note: string | null;
  /** The rear side's shading and mismatch, beside the switch. */
  field: LossField;
};

export type LossControl = LossField | RearGainSwitch;

/** What of the run the fields read: the LID the engine took, the module, and the Uc it took with the roof type's (null before a run). */
export type RunOfTheChain = {
  energy: Pick<Energy, "lid_pct">;
  module: Pick<Module, "is_bifacial" | "lid_loss_pct">;
  sizing?: Pick<DesignResult["sizing"], "uc" | "uc_from" | "uc_default"> | null;
};

const FIELD_OF: Record<string, RangedId> = {
  Soiling: "soiling_pct",
  "Module quality": "quality_pct",
  LID: "lid_pct",
  "LID (PAN)": "lid_pct",
  Mismatch: "mismatch_pct",
  "DC ohmic": "dc_ohmic_pct",
  "AC ohmic": "ac_ohmic_pct",
  Availability: "availability_pct",
};

const REAR_GAIN = "Bifacial rear gain";
const TEMPERATURE = "Temperature";
const UC_UNIT = "W/m²K";
export const MONOFACIAL = "The module is monofacial: no rear gain.";
/** On a sloped, flush roof the engine applies no rear gain: the rear faces the roof (#179, item 23). */
export const FLUSH = "Flush modules lie on the roof: no rear gain.";

const percent = (value: number) => `${shown(value, 1)} %`;

/** LID while the PAN's or the engine's default holds, and once entered: what is said and what gives it back. */
function lidWords(value: number | null, { energy, module }: RunOfTheChain): Pick<LossField, "detail" | "reset"> {
  const pan = module.lid_loss_pct;
  // Inside the field the unit follows, as for every field: "PAN 0.2" and "default 1.5" read "PAN 0.2 %", "default 1.5 %".
  if (value === null) return { detail: pan === null ? `default ${shown(energy.lid_pct, 1)}` : `PAN ${shown(pan, 1)}`, reset: null };
  return pan === null ? { detail: null, reset: "Use the default" } : { detail: `PAN gives ${percent(pan)}`, reset: "Use the PAN's" };
}

/** Uc while the roof type's holds, said inside the field ("29 W/m²K", in text-3); entered, the roof type's said under the row. */
function ucOf(document: Project, { sizing }: RunOfTheChain): LossField {
  const value = document.losses.uc ?? null;
  const words =
    value === null
      ? { detail: sizing?.uc_from === "roof type" ? shown(sizing.uc, 0) : null, reset: null }
      : { detail: sizing ? `Roof type gives ${shown(sizing.uc_default, 0)} ${UC_UNIT}` : null, reset: "Use the roof type's" };
  return { kind: "field", id: "uc", label: "Thermal Uc", unit: UC_UNIT, range: ASSUMPTION_RANGES.uc, value, ...words };
}

const rearLossOf = (document: Project): LossField => ({
  kind: "field",
  id: "rear_loss_pct",
  label: "Rear shading and mismatch",
  unit: "%",
  range: ASSUMPTION_RANGES.rear_loss_pct,
  value: document.losses.rear_loss_pct,
  detail: null,
  reset: null,
});

/** The control of the step labelled so by the engine, from the document and the run; null for a step of the engine's own. */
export function lossControlOf(label: string, document: Project, run: RunOfTheChain): LossControl | null {
  if (label === REAR_GAIN) {
    const note = !run.module.is_bifacial ? MONOFACIAL : document.roof.roof_type === "sloped_flush" ? FLUSH : null;
    return { kind: "switch", id: "bifacial", label, on: document.losses.bifacial, disabled: note !== null, note, field: rearLossOf(document) };
  }
  if (label === TEMPERATURE) return ucOf(document, run);
  const id = FIELD_OF[label];
  if (!id) return null;
  const value = document.losses[id] ?? null;
  const words = id === "lid_pct" ? lidWords(value, run) : { detail: null, reset: null };
  return { kind: "field", id, label, unit: "%", range: LOSS_RANGES[id], value, ...words };
}

type LossValue<Id extends LossId> = Id extends "bifacial" ? boolean : number | null;

/** The document with the loss entered, or given back to its default (null); the same document when nothing changes. */
export function withLoss<Id extends LossId>(document: Project, id: Id, value: LossValue<Id>): Project {
  if ((document.losses[id] ?? null) === value) return document;
  return { ...document, losses: { ...document.losses, [id]: value } };
}

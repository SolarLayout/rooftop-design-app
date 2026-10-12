// Where the energy goes (V2 · 8, D104; the board "V2 · 8 · Performance"): the engine's 21 steps said as eleven plain ones in
// two parts, before the modules (the sunlight, to the modules' rated output) and in the system (to the grid). Each plain
// step holds one or more of the engine's, found by its label, and its change is theirs composed, so that the eleven compose
// to the engine's chain. Its bar is the change on a scale of 10 %. Three steps are the user's: the dirt on the glass, the
// mismatch between modules and the downtime, each with who set it. Pure.
import { shown, type Range } from "../../components/ui/number-entry";
import type { Losses, LossStep, Project } from "../api";
import { isNothing, type BarLook } from "../format/cascade";
import { setByOfValue, wordOf } from "../studio/set-by";
import { LOSS_DEFAULTS } from "./loss-defaults";
import { changeOf } from "./loss-chain";

export type StepFieldId = "soiling_pct" | "mismatch_pct" | "downtime";

/** The fields of the plain steps, two decimals as the board has them, within the engine's ranges. */
export const STEP_FIELD_RANGE: Record<StepFieldId, Range & { min: number; max: number }> = {
  soiling_pct: { min: 0, max: 30, decimals: 2 },
  mismatch_pct: { min: 0, max: 10, decimals: 2 },
  downtime: { min: 0, max: 20, decimals: 2 },
};

export type StepField = {
  id: StepFieldId;
  /** What the field changes, to a screen reader: the row's label is the step's. */
  label: string;
  value: number;
  /** Who set it, in the four words of V2 · 3: Default or Yours. */
  setBy: string;
};

export type EnergyStep = {
  id: string;
  label: string;
  /** The engine's steps it holds, in the engine's words. */
  engine: string[];
  /** Their changes composed, in percent. */
  pct: number;
  /** "+9.60 %", "−2.22 %", "0.00 %". */
  change: string;
  look: BarLook;
  /** How long the bar is, from 0 to 1: the change on a scale of 10 %. */
  share: number;
  field: StepField | null;
};

export type StepsPart = { rows: EnergyStep[]; total: { label: string; value: string } };

export type EnergyStepsView = { before: StepsPart; system: StepsPart };

/** A change of 10 % fills the bar. */
const FULL_BAR_PCT = 10;

type Plain = { id: string; label: string; engine: readonly string[]; field?: StepFieldId };

// The engine's labels, found by their start: the transposition says its tilt, LID says "(PAN)" when the PAN's holds.
const BEFORE: readonly Plain[] = [
  { id: "sunlight", label: "Sunlight on the tilted modules", engine: ["Transposition to plane"] },
  { id: "shade", label: "Shade from rows, obstacles and the horizon", engine: ["Far shading", "Near shading"] },
  { id: "dirt", label: "Dirt on the glass (soiling)", engine: ["Soiling"], field: "soiling_pct" },
  { id: "reflection", label: "Light reflected off the glass", engine: ["IAM"] },
  { id: "rear", label: "Light on the back of the modules", engine: ["Bifacial rear gain"] },
];
const SYSTEM: readonly Plain[] = [
  { id: "heat", label: "Heat", engine: ["Temperature"] },
  { id: "quality", label: "Low light and module quality", engine: ["Irradiance level", "Module quality", "LID", "Mismatch"], field: "mismatch_pct" },
  { id: "string-shade", label: "Shade on a string", engine: ["Electrical shading"] },
  { id: "cables", label: "Cables", engine: ["DC ohmic", "AC ohmic"] },
  { id: "inverter", label: "Inverter", engine: ["Inverter efficiency", "Inverter clipping", "Night consumption"] },
  { id: "downtime", label: "Downtime", engine: ["Availability"], field: "downtime" },
];

const FIELD_LABEL: Record<StepFieldId, string> = { soiling_pct: "Soiling", mismatch_pct: "Mismatch between modules", downtime: "Downtime" };

/** The downtime the availability leaves, in percent. */
export const downtimeOf = (losses: Pick<Losses, "availability_pct">): number => Number((100 - losses.availability_pct).toFixed(6));

const valueOfField = (id: StepFieldId, losses: Losses): number => (id === "downtime" ? downtimeOf(losses) : losses[id]);
const defaultOfField = (id: StepFieldId): number => (id === "downtime" ? downtimeOf({ availability_pct: LOSS_DEFAULTS.availability_pct }) : LOSS_DEFAULTS[id]);

function fieldOf(id: StepFieldId, losses: Losses): StepField {
  const value = valueOfField(id, losses);
  const setBy = setByOfValue(value, defaultOfField(id), { decimals: STEP_FIELD_RANGE[id].decimals, unit: "%" });
  return { id, label: FIELD_LABEL[id], value, setBy: wordOf(setBy) };
}

function stepOf(plain: Plain, steps: readonly LossStep[], losses: Losses): EnergyStep {
  const held = steps.filter((step) => plain.engine.some((start) => step.label.startsWith(start)));
  const pct = (held.reduce((product, step) => product * (1 + step.pct / 100), 1) - 1) * 100;
  const look: BarLook = isNothing(pct) ? "zero" : pct > 0 ? "gain" : "loss";
  return {
    id: plain.id,
    label: plain.label,
    engine: held.map((step) => step.label),
    pct,
    change: changeOf(pct),
    look,
    share: look === "zero" ? 0 : Math.min(Math.abs(pct) / FULL_BAR_PCT, 1),
    field: plain.field ? fieldOf(plain.field, losses) : null,
  };
}

const totalOf = (steps: readonly LossStep[], kind: LossStep["kind"], label: string) => ({ label, value: `${shown(steps.find((step) => step.kind === kind)?.value ?? 0, 1)} MWh` });

export function energyStepsOf(steps: readonly LossStep[], document: Pick<Project, "losses">): EnergyStepsView {
  return {
    before: { rows: BEFORE.map((plain) => stepOf(plain, steps, document.losses)), total: totalOf(steps, "energy_total", "The modules' rated output") },
    system: { rows: SYSTEM.map((plain) => stepOf(plain, steps, document.losses)), total: totalOf(steps, "result", "To the grid") },
  };
}

/** The document with the downtime entered, as its availability; the same document when nothing changes. */
export function withDowntime<Document extends Pick<Project, "losses">>(document: Document, downtime: number): Document {
  const availability = Number((100 - downtime).toFixed(6));
  if (document.losses.availability_pct === availability) return document;
  return { ...document, losses: { ...document.losses, availability_pct: availability } };
}

/** The document with a plain step's field entered; the same document when nothing changes. */
export function withStepField<Document extends Pick<Project, "losses">>(document: Document, id: StepFieldId, value: number): Document {
  if (id === "downtime") return withDowntime(document, value);
  if (document.losses[id] === value) return document;
  return { ...document, losses: { ...document.losses, [id]: value } };
}

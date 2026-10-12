// Inverter limits and cabling (the board "Inverter and sizing"; plan/phase-07-plan.md, decision 16; inventory 1.4
// and 1.5): the current per MPPT, empty while the file's holds, with where that comes from and the API's note in
// its words, a value entered kept and given back; and the AC cable per inverter in metres. Pure.
import type { Range } from "../../components/ui/number-entry";
import { shown } from "../../components/ui/number-entry";
import type { Project } from "../api";
import type { InverterShown } from "./inverter-card";
import { DEFAULT, type SetBy } from "./set-by";

export type InverterFieldId = "imax_mppt_override" | "ac_cable_m";

export const INVERTER_RANGES: Record<InverterFieldId, Range & { min: number; max: number }> = {
  imax_mppt_override: { min: 1, max: 2000, decimals: 1 },
  ac_cable_m: { min: 1, max: 2000, decimals: 2 },
};

export type CurrentField = {
  /** The document's value; null while the file's holds. */
  value: number | null;
  /** The file's value and where it comes from, or "entered"; null before a run read the inverter. */
  detail: string | null;
  /** The words of the press that gives the file's value back; null while it holds. */
  reset: string | null;
  /** The API's note on the file's value, in its words; null when the OND states it, or a value is entered. */
  note: string | null;
};

export type CableField = { value: number; detail: string };

const amps = (value: number) => `${shown(value, 1)} A`;
const metres = (value: number) => `${shown(value, Number.isInteger(value) ? 0 : 2)} m`;

/** Where the file's current per MPPT comes from, in words: "IMaxDC 390 A ÷ 6 MPPT". */
function sourceOf({ inverter, current }: InverterShown): string {
  if (current.value_a === null) return "not in the OND";
  const from = current.source === "OND file" ? "from the OND" : `IMaxDC ${shown(inverter.idc_max_a, 0)} A ÷ ${shown(inverter.n_mppt, 0)} MPPT`;
  return `${amps(current.value_a)} · ${from}`;
}

/** The field of the current per MPPT, from the document and the inverter shown with the current of its file. */
export function currentFieldOf(document: Project, inverter: InverterShown | null): CurrentField {
  const value = document.imax_mppt_override ?? null;
  const ofTheFile = inverter?.current.value_a ?? null;
  if (value !== null) return { value, detail: "entered", reset: ofTheFile === null ? "Use the file's" : `Use the file's ${amps(ofTheFile)}`, note: null };
  if (!inverter) return { value, detail: null, reset: null, note: null };
  return { value, detail: sourceOf(inverter), reset: null, note: inverter.current.source === "OND file" ? null : inverter.current.note };
}

export function acCableFieldOf(document: Project): CableField {
  const { min, max } = INVERTER_RANGES.ac_cable_m;
  return { value: document.ac_cable_m, detail: `${shown(min, 0)} to ${shown(max, 0)} m` };
}

/** What the closed row says: the current the strings are sized with, and the cable. */
export function limitsRowOf(document: Project, inverter: InverterShown | null): string {
  const current = document.imax_mppt_override ?? inverter?.current.value_a ?? null;
  const cable = metres(document.ac_cable_m);
  if (current !== null) return `${amps(current)} · ${cable}`;
  return inverter ? `not known · ${cable}` : cable;
}

/** The document with a current per MPPT entered, or given back to the file's (null); the same when nothing changes. */
export function withCurrentPerMppt(document: Project, value: number | null): Project {
  return (document.imax_mppt_override ?? null) === value ? document : { ...document, imax_mppt_override: value };
}

/** The document with the AC cable per inverter entered; the same document when nothing changes. */
export function withAcCable(document: Project, value: number): Project {
  return document.ac_cable_m === value ? document : { ...document, ac_cable_m: value };
}

/** The AC cable of a design the user has not set: the API's default. */
export const AC_CABLE_DEFAULT = 30;

/** The limits' word (V2 · 3): the app's while the current is the file's and the cable the default, Yours once either is entered. */
export function limitsSetByOf(document: Project): SetBy {
  return (document.imax_mppt_override ?? null) !== null || document.ac_cable_m !== AC_CABLE_DEFAULT ? { kind: "yours", byDefault: null } : DEFAULT;
}

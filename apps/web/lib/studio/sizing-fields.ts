// The fields the strings are sized with (the board "Inverter and sizing"; plan/phase-07-plan.md, decisions 6
// and 7; functional-inventory.md 1.5): the lowest and the highest ambient, the cell rise, and the Voc
// coefficient. Each is empty while its default holds, and says the default and where it comes from; a value
// entered is the document's, kept even when it equals the default, and can be given back. Pure.
import type { Range } from "../../components/ui/number-entry";
import { shown } from "../../components/ui/number-entry";
import { withTrueMinus } from "../../components/shell/notes-view";
import type { DesignResult, Project, Roof } from "../api";

export type SizingId = "t_min_override" | "t_max_override" | "cell_rise_c" | "voc_coefficient_pct";

export const SIZING_RANGES: Record<SizingId, Range & { min: number; max: number }> = {
  t_min_override: { min: -50, max: 40, decimals: 1 },
  t_max_override: { min: 0, max: 60, decimals: 1 },
  cell_rise_c: { min: 0, max: 60, decimals: 1 },
  // Between −1 and 0, both left out (the API's range).
  voc_coefficient_pct: { min: -0.999, max: -0.001, decimals: 3 },
};

export type SizingField = {
  id: SizingId;
  label: string;
  unit: string;
  /** The document's value; null while the default holds. */
  value: number | null;
  /** The default and where it comes from, or "entered"; null before a run said the default. */
  detail: string | null;
  /** The words of the press that gives the field back to its default; null while it holds. */
  reset: string | null;
  /** The engine's note on the value, in its words; null for none. */
  note: string | null;
};

const MOUNTING: Record<Roof["roof_type"], string> = { flat_tilted: "flat, open rack", flat_ew: "flat east-west, open rack", sloped_flush: "sloped, flush" };
const SOURCE: Record<string, string> = { "one-diode model": "the one-diode model", "PAN file": "the PAN file" };
const ENTERED = "entered";
const degrees = (value: number) => `${shown(value, 1)} °C`;

/** The engine's note on the module's Voc coefficient, when it gave one. */
const vocNoteOf = (design: DesignResult) => design.equipment.module_notes.find((note) => note.startsWith("Voc coefficient")) ?? null;

export function sizingFieldsOf(document: Project, design: DesignResult | null): SizingField[] {
  const entered = (id: SizingId) => document[id] ?? null;
  const field = (id: SizingId, label: string, unit: string, byDefault: string | null, reset: string): SizingField => {
    const value = entered(id);
    return { id, label, unit, value, detail: value === null ? byDefault : ENTERED, reset: value === null ? null : reset, note: null };
  };
  const weather = design?.weather ?? null;
  const coefficients = design?.equipment.coefficients ?? null;
  const cellRise = design && design.sizing.cell_rise_from === "roof type" ? design.sizing.cell_rise_c : null;
  const fromTheModule = coefficients && coefficients.source !== "entered" ? `${shown(coefficients.mu_voc_pct, 3)} %/°C from ${SOURCE[coefficients.source] ?? coefficients.source}` : null;
  const voc = field("voc_coefficient_pct", "Voc coefficient", "%/°C", fromTheModule, "Use the module's");
  const vocNote = design && voc.value === null ? vocNoteOf(design) : null;
  return [
    field("t_min_override", "Lowest ambient", "°C", weather ? `${degrees(weather.t_min_c)} from the weather` : null, weather ? `Use the weather's ${degrees(weather.t_min_c)}` : "Use the weather's"),
    field("t_max_override", "Highest ambient", "°C", weather ? `${degrees(weather.t_max_c)} from the weather` : null, weather ? `Use the weather's ${degrees(weather.t_max_c)}` : "Use the weather's"),
    field("cell_rise_c", "Cell rise", "°C", cellRise === null ? null : `${shown(cellRise, 0)} °C by roof type: ${MOUNTING[document.roof.roof_type]}`, "Use the roof type's"),
    { ...voc, note: vocNote === null ? null : withTrueMinus(vocNote) },
  ];
}

/** What the closed row says: the temperatures the strings are sized for; null before a run. */
export function sizingRowOf(design: DesignResult | null): string | null {
  return design ? `${shown(design.sizing.t_min_c, 1)} to ${degrees(design.sizing.t_max_c)}` : null;
}

/** The document with a field entered, or given back to its default (null); the same document when nothing changes. */
export function withSizing(document: Project, id: SizingId, value: number | null): Project {
  return (document[id] ?? null) === value ? document : { ...document, [id]: value };
}

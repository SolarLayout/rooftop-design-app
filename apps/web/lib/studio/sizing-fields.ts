// The fields the strings are sized with (the board "Inverter and sizing"; plan/phase-07-plan.md, decisions 6
// and 7; functional-inventory.md 1.5): the lowest and the highest ambient, the cell rise, and the Voc
// coefficient. Each is empty while its default holds, and says who set the default and what it is (V2 · 3); a value
// entered is the user's, kept even when it equals the default, and Reset gives it back. Pure.
import type { Range } from "../../components/ui/number-entry";
import { shown } from "../../components/ui/number-entry";
import { NOTE_FIELD_RANGES, withTrueMinus } from "../../components/shell/notes-view";
import type { DesignResult, Project } from "../api";
import { ROOF_TYPES } from "../geometry/roof-types";
import { DEFAULT, FROM_THE_WEATHER, hintOf, sectionSetByOf, wordOf, type SetBy } from "./set-by";

export type SizingId = "t_min_override" | "t_max_override" | "cell_rise_c" | "voc_coefficient_pct";

export const SIZING_RANGES: Record<SizingId, Range & { min: number; max: number }> = {
  t_min_override: { min: -50, max: 40, decimals: 1 },
  t_max_override: { min: 0, max: 60, decimals: 1 },
  cell_rise_c: { min: 0, max: 60, decimals: 1 },
  voc_coefficient_pct: NOTE_FIELD_RANGES.voc_coefficient_pct,
};

export type SizingField = {
  id: SizingId;
  label: string;
  unit: string;
  /** The document's value; null while the default holds. */
  value: number | null;
  /** Who set it (V2 · 3): the weather or the app while the default holds, the user once a value is entered. */
  setBy: SetBy;
  /** Who set it and the default ("From the weather · 11.9 °C"), or "Yours · default 11.9 °C"; null before a run said the default. */
  detail: string | null;
  /** The engine's note on the value, in its words; null for none. */
  note: string | null;
};

const degrees = (value: number) => `${shown(value, 1)} °C`;

/** The roof type by the name its choice shows: "Flat, tilted rows". */
const roofTypeOf = (document: Project) => ROOF_TYPES.find(({ id }) => id === document.roof.roof_type)?.name ?? document.roof.roof_type;

/** The engine's note on the module's Voc coefficient, when it gave one. */
const vocNoteOf = (design: DesignResult) => design.equipment.module_notes.find((note) => note.startsWith("Voc coefficient")) ?? null;

export function sizingFieldsOf(document: Project, design: DesignResult | null): SizingField[] {
  /** A field: who sets its default, the default as a value and as a line, and the value entered in its place. */
  const field = (id: SizingId, label: string, unit: string, source: SetBy, byDefault: { value: string; line: string } | null): SizingField => {
    const value = document[id] ?? null;
    if (value !== null) {
      const setBy: SetBy = { kind: "yours", byDefault: byDefault?.value ?? null };
      return { id, label, unit, value, setBy, detail: hintOf(setBy), note: null };
    }
    return { id, label, unit, value, setBy: source, detail: byDefault === null ? null : `${wordOf(source)} · ${byDefault.line}`, note: null };
  };
  const weather = design?.weather ?? null;
  const fromTheWeather = (t: number) => ({ value: degrees(t), line: degrees(t) });
  const cellRise = design && design.sizing.cell_rise_from === "roof type" ? design.sizing.cell_rise_c : null;
  // The coefficient the strings are sized with: cold Voc is the one-diode model's while none is entered, whatever the
  // PAN states for the module card (#179, item 15).
  const sizedWith = design && design.sizing.voc_coefficient_from === "one-diode model" ? `${shown(design.sizing.voc_coefficient_pct, 3)} %/°C` : null;
  const voc = field("voc_coefficient_pct", "Voc coefficient", "%/°C", DEFAULT, sizedWith === null ? null : { value: sizedWith, line: `${sizedWith}, computed from the module file` });
  const vocNote = design && voc.value === null ? vocNoteOf(design) : null;
  return [
    field("t_min_override", "Lowest ambient", "°C", FROM_THE_WEATHER, weather ? fromTheWeather(weather.t_min_c) : null),
    field("t_max_override", "Highest ambient", "°C", FROM_THE_WEATHER, weather ? fromTheWeather(weather.t_max_c) : null),
    field("cell_rise_c", "Cell rise", "°C", DEFAULT, cellRise === null ? null : { value: `${shown(cellRise, 0)} °C`, line: `${shown(cellRise, 0)} °C by roof type: ${roofTypeOf(document)}` }),
    { ...voc, note: vocNote === null ? null : withTrueMinus(vocNote) },
  ];
}

/** The section's word: from the weather while every field holds its default, Yours once one is entered. */
export const sizingSetByOf = (fields: readonly SizingField[]): SetBy | null => sectionSetByOf(fields.map((field) => field.setBy));

/** What the closed row says: the temperatures the strings are sized for; null before a run. */
export function sizingRowOf(design: DesignResult | null): string | null {
  return design ? `${shown(design.sizing.t_min_c, 1)} to ${degrees(design.sizing.t_max_c)}` : null;
}

/** The document with a field entered, or given back to its default (null); the same document when nothing changes. */
export function withSizing(document: Project, id: SizingId, value: number | null): Project {
  return (document[id] ?? null) === value ? document : { ...document, [id]: value };
}

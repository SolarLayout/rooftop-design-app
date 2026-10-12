// The notes to review, made of what the API answered. No rule of the engine is written a second time:
// a note is there because the API gave it, and its reason is in the words of the API.
//
// Notes are the notes of the module, of the layout and of the weather, the chosen option when its DC/AC
// is not in target, a call that failed, and a design the device refused to keep (in the device's words). What
// explains (the note on the options, on the far shading) is no note to review: it belongs to its lens.
import type { DesignOption, DesignResult } from "../../lib/api";
import { pathOfLens, pathOfWorkspace, type Lens } from "../../lib/routes";
import { problemOfFailure } from "../../lib/errors/problem-of";
import type { Failure } from "../../lib/stores/results-store";
import type { Range } from "../ui/number-entry";
import type { Project } from "../../lib/api";

export type NoteAction =
  /** Leads to where the note can be answered. */
  | { kind: "open"; label: string; path: string }
  /** Asks again for what failed. */
  | { kind: "try-again"; label: string };

/** The fields of the document a note can hold. */
export type NoteFieldId = "voc_coefficient_pct";

/** What each accepts: the Voc coefficient between −1 and 0, both left out (the API's range); the Sizing temperatures' field is held to the same. */
export const NOTE_FIELD_RANGES: Record<NoteFieldId, Range & { min: number; max: number }> = {
  voc_coefficient_pct: { min: -0.999, max: -0.001, decimals: 3 },
};

/** The document with the value of a note's field entered: the user's from now on. */
export const withNoteValue = (document: Project, id: NoteFieldId, value: number): Project => (document[id] === value ? document : { ...document, [id]: value });

/** The field of the app that puts a value outside the usual range right, shown in its note (V2 · 5, D101). */
export type NoteField = {
  /** The field of the document it enters. */
  id: NoteFieldId;
  label: string;
  unit: string;
  /** The value the file or the engine gave: the one Keep enters. */
  value: number;
  /** Where the value came from. */
  source: string;
};

export type Note = {
  /** Its name among the notes of one design. */
  id: string;
  /** What the note is about, in a few words. */
  title: string;
  /** In the words of the API. */
  reason: string;
  /** Where it belongs. */
  where: string;
  action: NoteAction;
  /** A value outside the usual range with the field that puts it right; none for any other note. */
  field?: NoteField;
};

type Asked = {
  design: DesignResult | null;
  /** The notes of a layout that is newer than the design; null when there is none. */
  layoutNotes: readonly string[] | null;
  designFailure: Failure | null;
  layoutFailure: Failure | null;
  /** Why the design could not be kept on this device, in the device's words (lib/device/saving.ts); null when it could. */
  savingFailure: string | null;
};

const TRY_AGAIN: NoteAction = { kind: "try-again", label: "Try again" };

const toLens = (lens: Lens, name: string): NoteAction => ({ kind: "open", label: `Open ${name}`, path: pathOfLens(lens) });
const TO_ARRAY = toLens("array", "Array");
const TO_STRINGS = toLens("strings", "Strings");
const TO_PERFORMANCE: NoteAction = { kind: "open", label: "Open Performance", path: pathOfWorkspace("performance", "roof") };

// Where the subject of a sentence of the engine ends: at its first number, or at its verb.
const END_OF_SUBJECT = /\s(?:[-−+]?\d|(?:is|are|was|were|has|have|gives|keeps)\s)/;
const MOST_WORDS = 4;

/**
 * What a note is about: the words before its first number or its verb ("Voc coefficient"). The API
 * gives the reason of a note and no title. A note that begins otherwise is named by where it came from.
 */
export function subjectOf(reason: string, source: string): string {
  const end = reason.search(END_OF_SUBJECT);
  const subject = end === -1 ? "" : reason.slice(0, end).trim();
  const words = subject === "" ? 0 : subject.split(/\s+/).length;
  return words >= 1 && words <= MOST_WORDS ? subject : source;
}

/** A minus sign before a number, as display text has it (docs/design/guidelines.md): the words stay. */
export const withTrueMinus = (words: string) => words.replace(/(^|[\s(])-(?=\d)/g, "$1−");

const capital = (words: string) => words.charAt(0).toUpperCase() + words.slice(1);

/** The words of the mark beside DC/AC, of what the engine says about the option ("below target"). */
export function wordsOfTheTarget({ ok, note }: Pick<DesignOption, "ok" | "note">): string {
  if (ok) return "In target";
  if (note === "") return "Outside the DC/AC target";
  return note.endsWith(" target") ? `${capital(note.slice(0, -" target".length))} the DC/AC target` : capital(note);
}

// "Voc coefficient -0.164 %/°C is outside the usual -0.35 to -0.20 %/°C for crystalline silicon.": the engine's words for a
// value outside its usual range. The note says them as the voice has it, with the usual range and what to do.
const OUTSIDE_THE_USUAL = /^(.+?) (-?\d+(?:\.\d+)?) (\S+) is outside the usual (-?\d+(?:\.\d+)?) to (-?\d+(?:\.\d+)?) \S+/;

/** The fields of the app that put such a value right, by what the engine calls it. */
const FIELDS: Record<string, Pick<NoteField, "id" | "label" | "unit">> = {
  "Voc coefficient": { id: "voc_coefficient_pct", label: "Voc coefficient", unit: "%/°C" },
};

const SOURCE_OF_THE_VALUE = "From the module file";

/** The note of a value outside the usual range, or null for any other sentence of the engine. */
function outsideTheUsualOf(reason: string): Pick<Note, "title" | "reason" | "field"> | null {
  const found = OUTSIDE_THE_USUAL.exec(reason);
  if (!found) return null;
  const [, subject = "", value = "", unit = "", low = "", high = ""] = found;
  const field = FIELDS[subject];
  return {
    title: `${subject} outside the usual range`,
    reason: withTrueMinus(`Usually ${low} to ${high} ${unit} for this kind of module. Enter the datasheet's value.`),
    ...(field ? { field: { ...field, value: Number(value), source: SOURCE_OF_THE_VALUE } } : {}),
  };
}

/** The list's title: the count the chip shows ("1 to review"). */
export const reviewTitleOf = (count: number) => (count === 0 ? "Notes to review" : `${count} to review`);

/** Under the title, when a value is outside the usual range: each such note carries the way to fix it. */
export const introOf = (notes: readonly Note[]): string | null => (notes.some((note) => note.field) ? "Values outside the usual range. Each one says how to fix it." : null);

/** What Keep says on the button of a note's field: the value that stays. */
export const keepWordsOf = ({ value }: NoteField) => `Keep ${withTrueMinus(String(value))}`;

function notesOfA(source: string, reasons: readonly string[], where: string, action: NoteAction): Note[] {
  return reasons.map((reason, index) => ({
    id: `${source.toLowerCase()}-${index}`,
    title: subjectOf(reason, source),
    reason: withTrueMinus(reason),
    where,
    action,
    ...outsideTheUsualOf(reason),
  }));
}

function noteOfTheOption(design: DesignResult): Note[] {
  const option = design.options.find((one) => one.key === design.chosen_option);
  if (!option || option.ok) return [];
  return [
    {
      id: "option",
      title: wordsOfTheTarget(option),
      reason: withTrueMinus(option.verdict.detail),
      where: `Option ${option.letter} · Strings step`,
      action: TO_STRINGS,
    },
  ];
}

/** The title and the words of a call that failed, in the one shape of a problem: the cause, then what to do. */
function failedNoteOf(failure: Failure, subject: "energy" | "layout", hasBefore: boolean): Pick<Note, "title" | "reason"> {
  const { title } = problemOfFailure(failure, { subject, hasBefore });
  const { cause, remedy } = problemOfFailure(failure, { subject, hasBefore: false });
  return { title, reason: remedy === null ? cause : `${cause} ${remedy}` };
}

export function notesOf({ design, layoutNotes, designFailure, layoutFailure, savingFailure }: Asked): Note[] {
  const notes: Note[] = [];
  if (design) notes.push(...notesOfA("Module", design.equipment.module_notes, "Module · Array step", TO_ARRAY));
  notes.push(...notesOfA("Layout", layoutNotes ?? design?.layout.notes ?? [], "Layout · Array step", TO_ARRAY));
  if (design) {
    notes.push(...notesOfA("Weather", design.weather_notes, "Weather · Performance", TO_PERFORMANCE));
    notes.push(...noteOfTheOption(design));
  }
  if (layoutFailure) {
    const hasBefore = design !== null || layoutNotes !== null;
    notes.push({ id: "layout-failed", ...failedNoteOf(layoutFailure, "layout", hasBefore), where: hasBefore ? "Showing the last positions" : "There are no positions yet", action: TRY_AGAIN });
  }
  if (designFailure) {
    notes.push({ id: "design-failed", ...failedNoteOf(designFailure, "energy", design !== null), where: design ? "Showing the last result" : "There is no result yet", action: TRY_AGAIN });
  }
  if (savingFailure !== null) {
    notes.push({
      id: "not-saved",
      title: "Not saved",
      reason: savingFailure,
      where: "This design · on this device",
      action: TRY_AGAIN,
    });
  }
  return notes;
}

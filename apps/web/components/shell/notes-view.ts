// The notes to review, made of what the API answered. No rule of the engine is written a second time:
// a note is there because the API gave it, and its reason is in the words of the API.
//
// Notes are the notes of the module, of the layout and of the weather, the chosen option when its DC/AC
// is not in target, a call that failed, and a design the device refused to keep (in the device's words). What
// explains (the note on the options, on the far shading) is no note to review: it belongs to its lens.
import type { DesignOption, DesignResult } from "../../lib/api";
import { pathOfLens, pathOfWorkspace, type Lens } from "../../lib/routes";
import type { Failure } from "../../lib/stores/results-store";

export type NoteAction =
  /** Leads to where the note can be answered. */
  | { kind: "open"; label: string; path: string }
  /** Asks again for what failed. */
  | { kind: "try-again"; label: string };

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

function notesOfA(source: string, reasons: readonly string[], where: string, action: NoteAction): Note[] {
  return reasons.map((reason, index) => ({
    id: `${source.toLowerCase()}-${index}`,
    title: subjectOf(reason, source),
    reason: withTrueMinus(reason),
    where,
    action,
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

export function notesOf({ design, layoutNotes, designFailure, layoutFailure, savingFailure }: Asked): Note[] {
  const notes: Note[] = [];
  if (design) notes.push(...notesOfA("Module", design.equipment.module_notes, "Module · Array step", TO_ARRAY));
  notes.push(...notesOfA("Layout", layoutNotes ?? design?.layout.notes ?? [], "Layout · Array step", TO_ARRAY));
  if (design) {
    notes.push(...notesOfA("Weather", design.weather_notes, "Weather · Performance", TO_PERFORMANCE));
    notes.push(...noteOfTheOption(design));
  }
  if (layoutFailure) {
    notes.push({
      id: "layout-failed",
      title: "Layout was not updated",
      reason: layoutFailure.message,
      where: design || layoutNotes ? "The positions shown are of the design before" : "There are no positions yet",
      action: TRY_AGAIN,
    });
  }
  if (designFailure) {
    notes.push({
      id: "design-failed",
      title: design ? "Energy was not updated" : "Energy was not computed",
      reason: designFailure.message,
      where: design ? "The values shown are of the design before" : "There are no values yet",
      action: TRY_AGAIN,
    });
  }
  if (savingFailure !== null) {
    notes.push({
      id: "not-saved",
      title: "Not saved on this device",
      reason: savingFailure,
      where: "This design · on this device",
      action: TRY_AGAIN,
    });
  }
  return notes;
}

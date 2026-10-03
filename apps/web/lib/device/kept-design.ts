// A design kept on this device (plan/phase-10-plan.md, step 1, decision 1): the document whole, as the API hands it
// out, with the facts of its card worked out here so that Home and the project switcher show them without a run. The
// results are never kept: a design opened runs again (D5). Pure: what is written and read is lib/device/designs-db.ts.
import type { DesignResult, Project } from "../api";
import { roofSizeOf } from "../roof-card";

export type KeptFacts = {
  /** The roof in words: "90.0 × 40.0 m flat roof, tilted rows". */
  roofWords: string;
  /** The DC capacity of the chosen option of the last run; null before a run with one. */
  dcKwp: number | null;
  /** The energy of year 1 of the same, in MWh; null before a run with one. */
  energyMwh: number | null;
};

export type KeptDesign = {
  /** Made with crypto.randomUUID() when the design is first kept; never the name, which changes. */
  id: string;
  /** The document's name, kept beside it so that a list needs no document. */
  name: string;
  document: Project;
  facts: KeptFacts;
  /** Milliseconds since the epoch of the last committed edit. */
  editedAt: number;
  /** The same, of the last time it was opened on this device. */
  openedAt: number;
};

/** The roof type in the card's words, after the Roof lens's names of the three types. */
const TYPE_WORDS: Record<Project["roof"]["roof_type"], string> = {
  flat_tilted: "flat roof, tilted rows",
  flat_ew: "flat roof, east-west",
  sloped_flush: "sloped roof",
};

/** The roof of the document in words: its size as the Roof lens's card says it, then its type. */
export function roofWordsOf(document: Project): string {
  return `${roofSizeOf(document.roof)} ${TYPE_WORDS[document.roof.roof_type]}`;
}

/** The facts of the card: of the document, and of the chosen option of the last run when there is one. */
export function factsOf(document: Project, design: DesignResult | null): KeptFacts {
  const chosen = design?.options.find((option) => option.key === design.chosen_option) ?? null;
  return {
    roofWords: roofWordsOf(document),
    dcKwp: chosen?.dc_kwp ?? null,
    energyMwh: chosen?.energy.energy_mwh ?? null,
  };
}

type Kept = {
  id: string;
  document: Project;
  /** The last run of this design; null before one. */
  design: DesignResult | null;
  /** Milliseconds since the epoch. */
  now: number;
};

/** The design as it is kept, edited and opened now; who keeps it carries the times on from the record before. */
export function keptOf({ id, document, design, now }: Kept): KeptDesign {
  return { id, name: document.name, document, facts: factsOf(document, design), editedAt: now, openedAt: now };
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const some = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"} ago`;

/**
 * When the design was edited, in words: "Edited just now" within the minute, then minutes, hours, "yesterday" from a
 * day to two, days up to a week, then the date ("Edited 17 Sep 2026", in the device's own time).
 */
export function whenOf(editedAt: number, now: number): string {
  const ago = now - editedAt;
  if (ago < MINUTE) return "Edited just now";
  if (ago < HOUR) return `Edited ${some(Math.floor(ago / MINUTE), "minute")}`;
  if (ago < DAY) return `Edited ${some(Math.floor(ago / HOUR), "hour")}`;
  if (ago < 2 * DAY) return "Edited yesterday";
  if (ago < WEEK) return `Edited ${some(Math.floor(ago / DAY), "day")}`;
  const date = new Date(editedAt);
  return `Edited ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

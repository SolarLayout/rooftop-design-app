// The cards of the designs kept on this device (plan/phase-10-plan.md, step 12, decisions 6 and 7; the board "Home, designs on
// this device"): what each card says, the newest edited first; the name of a copy; the question before a delete. Pure: the
// components draw what this gives, and the saving store does what the menu asks.
import type { KeptDesign } from "../device/kept-design";
import { whenOf } from "../device/kept-design";
import { thumbnailOf } from "../device/thumbnail";
import { LONGEST_NAME } from "../flow/name-field";
import { dcCapacity, energy, type Quantity } from "../format/vitals";

export type DesignCard = {
  id: string;
  name: string;
  roofWords: string;
  /** The capacity and the energy of year 1 of the last run; null while they cannot exist yet. */
  facts: { capacity: Quantity; energy: Quantity } | null;
  /** What the numbers wait for, in the place of the numbers; null when they are there (guidelines.md: absent with its reason, never 0). */
  waiting: string | null;
  /** "Edited 2 hours ago". */
  edited: string;
  /** The plan of the kept layout as an SVG (decision 6); for a record kept before there were thumbnails, the plan of its roof alone. */
  thumbnail: string;
};

export const WAITING_FOR_A_VOLTAGE = "Waiting for a system voltage";
export const NOT_RUN_YET = "Not run yet";

function cardOf({ id, name, document, facts, thumbnail, editedAt }: KeptDesign, now: number): DesignCard {
  const { dcKwp, energyMwh } = facts;
  const numbers = dcKwp !== null && energyMwh !== null ? { capacity: dcCapacity(dcKwp), energy: energy(energyMwh) } : null;
  return {
    id,
    name,
    roofWords: facts.roofWords,
    facts: numbers,
    waiting: numbers !== null ? null : document.system_voltage === null ? WAITING_FOR_A_VOLTAGE : NOT_RUN_YET,
    edited: whenOf(editedAt, now),
    thumbnail: thumbnail ?? thumbnailOf(document.roof, null),
  };
}

/** The cards, the newest edited first; *now* in milliseconds since the epoch. */
export function cardsOf(designs: readonly KeptDesign[], now: number): DesignCard[] {
  return [...designs].sort((a, b) => b.editedAt - a.editedAt).map((design) => cardOf(design, now));
}

/** The name of a duplicate: "Copy of <name>", within what the API's Project.name takes. */
export const copyNameOf = (name: string): string => `Copy of ${name}`.slice(0, LONGEST_NAME);

/** The question before a delete, the board's word for word: the first sentence the title, the second the body (decision 7). */
export function deleteQuestionOf(name: string): { title: string; body: string } {
  return { title: `Delete ${name}?`, body: "It is kept on this device alone." };
}

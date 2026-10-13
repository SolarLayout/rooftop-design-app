// The cards of the designs kept on this device (plan/phase-10-plan.md, step 12, decisions 6 and 7; V2 · 9, D105): what each
// card says, the newest edited first: its name, the roof's words, its figures once it has run, when it was edited; its menu;
// the name of a copy; the question before a delete. Pure: the components draw what this gives, and the saving store does what
// the menu asks.
import type { KeptDesign } from "../device/kept-design";
import { whenOf } from "../device/kept-design";
import { thumbnailOf } from "../device/thumbnail";
import { LONGEST_NAME } from "../flow/name-field";
import { shown } from "../../components/ui/number-entry";
import type { Project } from "../api";

export type DesignCard = {
  id: string;
  name: string;
  roofWords: string;
  /** Where the roof is: the place's name as Find found it (D114), else its coordinates. */
  place: string;
  /** The capacity and the energy of year 1 of the last run, "357.28" and "617.8"; null before one (never 0). */
  kwp: string | null;
  mwh: string | null;
  /** "Edited 2 hours ago". */
  edited: string;
  /** The plan of the kept layout as an SVG (decision 6); for a record kept before there were thumbnails, the plan of its roof alone. */
  thumbnail: string;
};

/** What a card's menu does, in its order (audit V2-60, V2-62): the project file is downloaded, never "saved as a copy". */
export const CARD_MENU = [
  { name: "Open", does: "open" },
  { name: "Rename", does: "rename" },
  { name: "Duplicate", does: "duplicate" },
  { name: "Download the project file", does: "download" },
  { name: "Delete", does: "delete" },
] as const;

export type CardDoing = (typeof CARD_MENU)[number]["does"];

/** Where the roof is, in degrees to two decimals: "18.52° N, 73.86° E". */
const coordinatesOf = ({ lat, lon }: Pick<Project["roof"], "lat" | "lon">) =>
  `${shown(Math.abs(lat), 2)}° ${lat >= 0 ? "N" : "S"}, ${shown(Math.abs(lon), 2)}° ${lon >= 0 ? "E" : "W"}`;

function cardOf({ id, name, document, facts, thumbnail, editedAt }: KeptDesign, now: number): DesignCard {
  return {
    id,
    name,
    roofWords: facts.roofWords,
    place: document.place_name || coordinatesOf(document.roof),
    kwp: facts.dcKwp === null ? null : shown(facts.dcKwp, 2),
    mwh: facts.energyMwh === null ? null : shown(facts.energyMwh, 1),
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
  return { title: `Delete ${name}?`, body: "It is saved on this device only." };
}

import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import type { KeptDesign } from "../device/kept-design";
import { CARD_MENU, cardsOf, copyNameOf, deleteQuestionOf } from "./cards";

// The cards of the designs kept on this device (plan/phase-10-plan.md, step 12, decisions 6 and 7; the board "Home, designs on
// this device"): the newest edited first, each with its name, the roof's words, the capacity and the energy of its last run
// or what waits in their place, and when it was edited; the copy's name; the question before a delete, word for word.

const RECTANGLE: [number, number][] = [
  [0, 0],
  [90, 0],
  [90, 40],
  [0, 40],
];
const DEMO = { name: "Pune demo roof", system_voltage: 1500, roof: { lat: 18.52, lon: 73.86, outline: RECTANGLE, roof_type: "flat_tilted", source: "coordinates", obstacles: [] } } as unknown as Project;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const NOW = new Date(2026, 9, 3, 12).getTime();

const kept = ({ document, ...over }: Partial<Omit<KeptDesign, "document">> & { document?: Partial<Project> }): KeptDesign => ({
  id: "a1",
  name: "Pune demo roof",
  document: { ...DEMO, ...document } as Project,
  facts: { roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: 357.28, energyMwh: 617.8405373922709 },
  thumbnail: null,
  editedAt: NOW - 2 * HOUR,
  openedAt: NOW - 2 * HOUR,
  ...over,
});

describe("the cards", () => {
  test("a design that has run: its name, the roof's words, the capacity and the energy as the vitals say them, when it was edited", () => {
    expect(cardsOf([kept({})], NOW)).toEqual([
      {
        id: "a1",
        name: "Pune demo roof",
        roofWords: "90.0 × 40.0 m flat roof, tilted rows",
        figures: "617.8 MWh a year · 357.28 kWp",
        edited: "Edited 2 hours ago",
        thumbnail: expect.stringMatching(/^<svg /),
      },
    ]);
  });

  test("the thumbnail kept with the design is the card's; a record kept before there were thumbnails gets the plan of its roof alone", () => {
    expect(cardsOf([kept({ thumbnail: "<svg data-kept></svg>" })], NOW)[0]!.thumbnail).toBe("<svg data-kept></svg>");
    const drawn = cardsOf([kept({ thumbnail: null })], NOW)[0]!.thumbnail;
    expect(drawn).toContain('data-part="roof"');
    expect(drawn).not.toContain("data-module");
  });

  test("before a run the card says no figure, never 0 (V2 · 9)", () => {
    const card = cardsOf([kept({ facts: { roofWords: "62 × 28 m flat roof", dcKwp: null, energyMwh: null }, document: { system_voltage: null } })], NOW)[0]!;

    expect(card.figures).toBeNull();
    expect(card.roofWords).toBe("62 × 28 m flat roof");
  });

  test("the newest edited first, whatever order they came in", () => {
    const older = kept({ id: "b2", name: "Block B", editedAt: NOW - 26 * HOUR });
    const newest = kept({ id: "c3", name: "Warehouse 7", editedAt: NOW - MINUTE });

    expect(cardsOf([older, kept({}), newest], NOW).map((card) => [card.name, card.edited])).toEqual([
      ["Warehouse 7", "Edited 1 minute ago"],
      ["Pune demo roof", "Edited 2 hours ago"],
      ["Block B", "Edited yesterday"],
    ]);
  });
});

describe("the card's menu (V2 · 9, audit V2-60, V2-62)", () => {
  test("Open, Rename, Duplicate, Download the project file, Delete", () => {
    expect(CARD_MENU.map((row) => row.name)).toEqual(["Open", "Rename", "Duplicate", "Download the project file", "Delete"]);
  });
});

describe("a copy", () => {
  test("is named Copy of the design", () => {
    expect(copyNameOf("Pune demo roof")).toBe("Copy of Pune demo roof");
  });

  test("a name that would grow beyond what the API's Project.name takes is cut to it", () => {
    const long = "x".repeat(200);

    expect(copyNameOf(long)).toHaveLength(200);
    expect(copyNameOf(long).startsWith("Copy of x")).toBe(true);
  });
});

describe("the question before a delete", () => {
  test("is the board's, word for word: the first sentence the title, the second the body", () => {
    expect(deleteQuestionOf("Pune demo roof")).toEqual({ title: "Delete Pune demo roof?", body: "It is kept on this device alone." });
  });
});

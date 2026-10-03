import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import type { KeptDesign } from "../device/kept-design";
import { cardsOf, copyNameOf, deleteQuestionOf, NOT_RUN_YET, WAITING_FOR_A_VOLTAGE } from "./cards";

// The cards of the designs kept on this device (plan/phase-10-plan.md, step 12, decisions 6 and 7; the board "Home, designs on
// this device"): the newest edited first, each with its name, the roof's words, the capacity and the energy of its last run
// or what waits in their place, and when it was edited; the copy's name; the question before a delete, word for word.

const DEMO = { name: "Pune demo roof", system_voltage: 1500 } as unknown as Project;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const NOW = new Date(2026, 9, 3, 12).getTime();

const kept = ({ document, ...over }: Partial<Omit<KeptDesign, "document">> & { document?: Partial<Project> }): KeptDesign => ({
  id: "a1",
  name: "Pune demo roof",
  document: { ...DEMO, ...document } as Project,
  facts: { roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: 357.28, energyMwh: 617.8405373922709 },
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
        facts: { capacity: { number: "357.28", unit: "kWp" }, energy: { number: "617.8", unit: "MWh" } },
        waiting: null,
        edited: "Edited 2 hours ago",
      },
    ]);
  });

  test("before a system voltage is chosen the numbers cannot exist: the card says what waits, never 0", () => {
    const card = cardsOf([kept({ facts: { roofWords: "62 × 28 m flat roof", dcKwp: null, energyMwh: null }, document: { system_voltage: null } })], NOW)[0]!;

    expect(card.facts).toBeNull();
    expect(card.waiting).toBe(WAITING_FOR_A_VOLTAGE);
    expect(card.waiting).toBe("Waiting for a system voltage");
  });

  test("with a voltage but no run yet: Not run yet", () => {
    const card = cardsOf([kept({ facts: { roofWords: "120 × 45 m flat roof, east-west", dcKwp: null, energyMwh: null } })], NOW)[0]!;

    expect(card.facts).toBeNull();
    expect(card.waiting).toBe(NOT_RUN_YET);
    expect(card.waiting).toBe("Not run yet");
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

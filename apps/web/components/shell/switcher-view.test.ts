import { describe, expect, test } from "bun:test";
import type { Project } from "../../lib/api";
import type { KeptDesign } from "../../lib/device/kept-design";
import { rowsOnTheDeviceOf } from "./switcher-view";

// The rows under "On this device" in the project switcher (plan/phase-10-plan.md, step 5): the designs kept, the newest
// edited first, each with its name and one fact at the right: the capacity, or the roof's words before a run with one.

const kept = (id: string, name: string, editedAt: number, facts: Partial<KeptDesign["facts"]> = {}): KeptDesign => ({
  id,
  name,
  document: { name } as unknown as Project,
  thumbnail: null,
  facts: { roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: null, energyMwh: null, ...facts },
  editedAt,
  openedAt: editedAt,
});

const DEMO = kept("a", "Pune demo roof", 3_000, { dcKwp: 357.28, energyMwh: 617.84 });
const HINJEWADI = kept("b", "Hinjewadi Phase 2, Pune, Maharashtra", 5_000);
const WAREHOUSE = kept("c", "Warehouse 7, Block B", 1_000, { roofWords: "120.0 × 45.0 m flat roof, east-west" });

describe("the rows on this device", () => {
  test("none without a design kept", () => {
    expect(rowsOnTheDeviceOf([], null)).toEqual([]);
  });

  test("the newest edited first; the open design is listed once, as This design, not here (V2 · 9, audit V2-36)", () => {
    expect(rowsOnTheDeviceOf([DEMO, HINJEWADI, WAREHOUSE], "a")).toEqual([
      { id: "b", name: "Hinjewadi Phase 2, Pune, Maharashtra", fact: "90.0 × 40.0 m flat roof, tilted rows" },
      { id: "c", name: "Warehouse 7, Block B", fact: "120.0 × 45.0 m flat roof, east-west" },
    ]);
  });

  test("the fact is the card's on Home: the energy and the capacity once it has run, else the roof's words", () => {
    expect(rowsOnTheDeviceOf([DEMO, HINJEWADI], "b")).toEqual([{ id: "a", name: "Pune demo roof", fact: "617.8 MWh a year · 357.28 kWp" }]);
    expect(rowsOnTheDeviceOf([kept("d", "Big", 1, { dcKwp: 1234.5, energyMwh: 2000 })], null)[0]!.fact).toBe("2,000.0 MWh a year · 1,234.50 kWp");
  });

  test("no design is open, or the open one is not kept: every design is listed", () => {
    expect(rowsOnTheDeviceOf([DEMO], null).map((row) => row.id)).toEqual(["a"]);
    expect(rowsOnTheDeviceOf([DEMO], "zz").map((row) => row.id)).toEqual(["a"]);
  });
});

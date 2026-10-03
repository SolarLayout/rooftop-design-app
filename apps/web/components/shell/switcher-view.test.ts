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

  test("the newest edited first, the open one marked, the fact the capacity or the roof's words", () => {
    expect(rowsOnTheDeviceOf([DEMO, HINJEWADI, WAREHOUSE], "a")).toEqual([
      { id: "b", name: "Hinjewadi Phase 2, Pune, Maharashtra", fact: "90.0 × 40.0 m flat roof, tilted rows", isOpen: false },
      { id: "a", name: "Pune demo roof", fact: "357.28 kWp", isOpen: true },
      { id: "c", name: "Warehouse 7, Block B", fact: "120.0 × 45.0 m flat roof, east-west", isOpen: false },
    ]);
  });

  test("the capacity is shown as the vitals show it: two decimals, a comma between thousands", () => {
    expect(rowsOnTheDeviceOf([kept("d", "Big", 1, { dcKwp: 1234.5 })], null)[0]!.fact).toBe("1,234.50 kWp");
  });

  test("no design is open, or the open one is not kept: none is marked", () => {
    expect(rowsOnTheDeviceOf([DEMO], null).map((row) => row.isOpen)).toEqual([false]);
  });
});

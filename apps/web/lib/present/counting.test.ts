import { describe, expect, test } from "bun:test";
import type { Mark } from "../format/cascade";
import { countedAt, easeOut, grownMarksOf } from "./counting";

// The energy counting up in the last scene (plan/phase-10-plan.md, step 19, decision 9): the value at a share of the
// count, eased out so that it slows as it lands; the chain's bars growing one after another with the same share.

describe("the count", () => {
  test("from 0 to the number over the share, slowing toward the end", () => {
    expect(countedAt(617.84, 0)).toBe(0);
    expect(countedAt(617.84, 1)).toBe(617.84);
    expect(countedAt(617.84, 0.5)).toBeGreaterThan(617.84 / 2);
    expect(countedAt(617.84, 0.5)).toBeLessThan(617.84);
    expect(countedAt(617.84, 0.9)).toBeGreaterThan(617.84 * 0.99);
  });

  test("the easing is 0 at 0, 1 at 1, and held inside", () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBe(0.875);
    expect(easeOut(-1)).toBe(0);
    expect(easeOut(2)).toBe(1);
  });
});

describe("the chain growing", () => {
  const MARKS: Mark[] = [
    { kind: "marker", at: 1 },
    { kind: "bar", from: 1, to: 0.6, look: "loss" },
    { kind: "bar", from: 0.6, to: 0.8, look: "gain" },
    { kind: "marker", at: 0.8 },
  ];

  test("at 0 every bar stands at its start and the markers stand; at 1 every bar is whole", () => {
    expect(grownMarksOf(MARKS, 0)).toEqual([
      { kind: "marker", at: 1 },
      { kind: "bar", from: 1, to: 1, look: "loss" },
      { kind: "bar", from: 0.6, to: 0.6, look: "gain" },
      { kind: "marker", at: 0.8 },
    ]);
    expect(grownMarksOf(MARKS, 1)).toEqual(MARKS);
  });

  test("the bars grow one after another, each over its own share of the whole: a cascade", () => {
    const half = grownMarksOf(MARKS, 0.5);
    expect(half[1]).toEqual({ kind: "bar", from: 1, to: 0.6, look: "loss" });
    expect(half[2]).toEqual({ kind: "bar", from: 0.6, to: 0.6, look: "gain" });
    const later = grownMarksOf(MARKS, 0.75);
    expect(later[2]).toEqual({ kind: "bar", from: 0.6, to: 0.7, look: "gain" });
  });

  test("a chain without bars is as it is", () => {
    expect(grownMarksOf([{ kind: "marker", at: 0.5 }], 0.3)).toEqual([{ kind: "marker", at: 0.5 }]);
  });
});

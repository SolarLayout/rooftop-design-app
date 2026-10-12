import { describe, expect, test } from "bun:test";
import { countedAt, countingEnergy, easeOut } from "./counting";

// The energy counting up in the last scene (plan/phase-10-plan.md, step 19, decision 9): the value at a share of the
// count, eased out so that it slows as it lands.

describe("the energy as it counts, steady in its place", () => {
  test("it holds the final figure's width from the start: the counted figure, the final one held", () => {
    expect(countingEnergy(617.84, 0)).toEqual({ number: "0.0", unit: "MWh", holds: "617.8" });
    expect(countingEnergy(617.84, 1)).toEqual({ number: "617.8", unit: "MWh", holds: "617.8" });
  });

  test("the counted figure never has more characters than the one it holds, so it never pushes what stands beside it", () => {
    for (const mwh of [9.96, 617.84, 1234.5, 99999.9]) {
      for (let step = 0; step <= 200; step += 1) {
        const { number, holds } = countingEnergy(mwh, step / 200);
        expect(number.length).toBeLessThanOrEqual(holds.length);
      }
    }
  });
});

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

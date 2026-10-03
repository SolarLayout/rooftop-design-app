import { describe, expect, test } from "bun:test";
import { presetPositionOf } from "./camera";
import { ABOVE_THE_ROOF, easeInOut, isSettled, offTheZenith, pathAt, SETTLE_TIME, settleShareOf } from "./camera-move";

// The camera's move between presets (plan/phase-10-plan.md, step 17, decision 10): along a path between two stands
// that never goes below the roof, eased in and out over its time, the camera chasing the path's point with a time
// constant so that it never jumps. Pure; the rig writes what this gives in its frame loop.

const RADIUS = 49.24;
const length = ([x, y, z]: readonly number[]) => Math.hypot(x, y, z);

describe("the easing", () => {
  test("starts and ends at rest: 0 at 0, 1 at 1, half way at a half, slow at the ends", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(0.1)).toBeLessThan(0.1);
    expect(easeInOut(0.9)).toBeGreaterThan(0.9);
  });

  test("a share outside 0 to 1 is held inside it", () => {
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });
});

describe("the path", () => {
  const plan = offTheZenith(presetPositionOf("plan", RADIUS, null));
  const threeD = presetPositionOf("3d", RADIUS, null);

  test("begins at the one stand and ends at the other", () => {
    expect(pathAt(plan, threeD, 0)).toEqual(plan);
    expect(pathAt(plan, threeD, 1).map((value) => Number(value.toFixed(9)))).toEqual(threeD.map((value) => Number(value.toFixed(9))));
  });

  test("goes the short way round at the roof's distance: the distance between the two, the height between the two", () => {
    const middle = pathAt(plan, threeD, 0.5);
    expect(length(middle)).toBeGreaterThan(length(threeD) - 1e-6);
    expect(length(middle)).toBeLessThan(length(plan) + 1e-6);
    expect(middle[1]).toBeGreaterThan(threeD[1]);
    expect(middle[1]).toBeLessThan(plan[1]);
  });

  test("never goes below the roof, not even toward a stand on the horizon", () => {
    const onTheHorizon: [number, number, number] = [0, 0, RADIUS * 2.4];
    for (const share of [0, 0.25, 0.5, 0.75, 1]) {
      const [x, y, z] = pathAt(threeD, onTheHorizon, share);
      const polar = Math.atan2(Math.hypot(x, z), y);
      expect(polar).toBeLessThanOrEqual(Math.PI / 2 - ABOVE_THE_ROOF + 1e-9);
    }
  });

  test("from a stand straight above, the path keeps its height until it tilts", () => {
    const early = pathAt(plan, threeD, 0.01);
    expect(early[1] / length(early)).toBeGreaterThan(0.99);
  });
});

describe("straight above", () => {
  test("a stand on the zenith is nudged a hair south, so that north is up and the camera has a way to look", () => {
    const [x, y, z] = offTheZenith([0, 100, 0]);
    expect(x).toBe(0);
    expect(y).toBeCloseTo(100, 3);
    expect(z).toBeGreaterThan(0);
    expect(z).toBeLessThan(0.2);
  });

  test("a stand that is not on the zenith is left as it is", () => {
    expect(offTheZenith([3, 4, 5])).toEqual([3, 4, 5]);
  });
});

describe("the chase", () => {
  test("the camera closes most of the gap within a few time constants, never all of it in one frame", () => {
    expect(settleShareOf(0)).toBe(0);
    expect(settleShareOf(SETTLE_TIME)).toBeCloseTo(1 - Math.exp(-1), 9);
    expect(settleShareOf(SETTLE_TIME * 5)).toBeGreaterThan(0.99);
    expect(settleShareOf(SETTLE_TIME * 5)).toBeLessThan(1);
    expect(settleShareOf(1 / 60)).toBeGreaterThan(0);
  });

  test("it is settled once it stands within a thousandth of the roof's radius of its target", () => {
    expect(isSettled(0.0005, RADIUS)).toBe(true);
    expect(isSettled(0.1, RADIUS)).toBe(false);
  });
});

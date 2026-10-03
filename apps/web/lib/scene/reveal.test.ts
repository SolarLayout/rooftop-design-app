import { describe, expect, test } from "bun:test";
import { LEAST_HEIGHT, liftOf, revealedCountOf, risenScaleOf } from "./reveal";

// The reveal of Present (plan/phase-10-plan.md, step 17): how many of the layout's positions are drawn at a share,
// in the order of their rows (the engine places them row by row); the height of the building and the obstacles
// scaled from nothing to their own, never to a scale of 0, which has no inverse.

describe("the positions revealed", () => {
  test("none at 0, all at 1, the first share between, in the layout's order", () => {
    expect(revealedCountOf(790, 0)).toBe(0);
    expect(revealedCountOf(790, 1)).toBe(790);
    expect(revealedCountOf(790, 0.5)).toBe(395);
    expect(revealedCountOf(790, 0.25)).toBe(198);
  });

  test("a share outside 0 to 1 is held inside it", () => {
    expect(revealedCountOf(790, -0.5)).toBe(0);
    expect(revealedCountOf(790, 1.5)).toBe(790);
  });

  test("a layout without positions has none to show", () => {
    expect(revealedCountOf(0, 0.5)).toBe(0);
  });
});

describe("the height risen", () => {
  test("its own at 1, a hair at 0, in between as the share", () => {
    expect(risenScaleOf(1)).toBe(1);
    expect(risenScaleOf(0.5)).toBe(0.5);
    expect(risenScaleOf(0)).toBe(LEAST_HEIGHT);
    expect(risenScaleOf(-1)).toBe(LEAST_HEIGHT);
    expect(risenScaleOf(2)).toBe(1);
  });

  test("the roof is lowered toward the ground by what is not yet risen of the building's depth", () => {
    expect(liftOf(1, 6)).toBe(0);
    expect(liftOf(0, 6)).toBe(-6);
    expect(liftOf(0.25, 6)).toBe(-4.5);
  });
});

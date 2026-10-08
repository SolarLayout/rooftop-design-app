import { describe, expect, test } from "bun:test";
import { clipShareOf } from "./clip-share";

// How far a clip has played, for the line at its foot (Phase 15): read every frame while it plays, so the line moves smoothly.

describe("how far a clip has played", () => {
  test("is its time over its length", () => {
    expect(clipShareOf(1.5, 6)).toBe(0.25);
    expect(clipShareOf(6, 6)).toBe(1);
  });

  test("is nothing before its length is known", () => {
    expect(clipShareOf(0, Number.NaN)).toBe(0);
    expect(clipShareOf(0.4, 0)).toBe(0);
    expect(clipShareOf(0.4, Number.POSITIVE_INFINITY)).toBe(0);
  });

  test("stays between nothing and all of it", () => {
    expect(clipShareOf(6.02, 6)).toBe(1);
    expect(clipShareOf(-0.1, 6)).toBe(0);
  });
});

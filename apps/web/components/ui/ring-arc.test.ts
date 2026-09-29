import { describe, expect, test } from "bun:test";
import { arcOf, percentOf } from "./ring-arc";

describe("percentOf", () => {
  test("how far, in whole percent", () => {
    expect(percentOf(0)).toBe(0);
    expect(percentOf(0.62)).toBe(62);
    expect(percentOf(0.625)).toBe(63);
    expect(percentOf(1)).toBe(100);
  });

  test("never less than nothing, never more than all", () => {
    expect(percentOf(-0.2)).toBe(0);
    expect(percentOf(1.4)).toBe(100);
  });

  test("a run that is not over is not at 100: the result says that it is over, not the progress", () => {
    expect(percentOf(0.996)).toBe(99);
    expect(percentOf(0.9999)).toBe(99);
  });
});

describe("arcOf: the ring on a square of 24", () => {
  test("the line is as wide as the design says, whatever the size of the ring", () => {
    expect(arcOf(0.5, 12).line).toBeCloseTo(3, 5);
    expect(arcOf(0.5, 16).line).toBeCloseTo(3, 5);
    expect(arcOf(0.5, 20).line).toBeCloseTo(3, 5);
    expect(arcOf(0.5, 44).line).toBeCloseTo(1.636, 3);
  });

  test("the ring stays inside the square, half a unit from its edge", () => {
    for (const size of [12, 16, 20, 44] as const) {
      const { radius, line } = arcOf(0.5, size);
      expect(radius + line / 2).toBeCloseTo(11.5, 5);
    }
  });

  test("the arc is the share of the way around", () => {
    const { radius, around, filled } = arcOf(0.62, 20);

    expect(around).toBeCloseTo(2 * Math.PI * radius, 5);
    expect(filled).toBeCloseTo(around * 0.62, 5);
  });

  test("nothing at the start, all of the ring at the end, and never beyond", () => {
    expect(arcOf(0, 20).filled).toBe(0);
    expect(arcOf(1, 20).filled).toBeCloseTo(arcOf(1, 20).around, 5);
    expect(arcOf(-1, 20).filled).toBe(0);
    expect(arcOf(3, 20).filled).toBeCloseTo(arcOf(1, 20).around, 5);
  });
});

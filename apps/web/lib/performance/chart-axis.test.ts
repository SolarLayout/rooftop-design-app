import { describe, expect, test } from "bun:test";
import { axisOf } from "./chart-axis";

// The axes of Performance's charts are labelled (V2 · 8, audit V2-71): ticks at round steps of 1, 2 or 5 times a power
// of ten, about four of them, the ends on a tick.

describe("an axis", () => {
  test("from zero, over the months: 0 to 80 by 20 for a highest month of 68.4", () => {
    expect(axisOf([62.0, 68.4, 31.5], { fromZero: true })).toEqual({ low: 0, high: 80, ticks: [0, 20, 40, 60, 80] });
  });

  test("from zero, months all the same: the value under the top", () => {
    expect(axisOf([50, 50], { fromZero: true })).toEqual({ low: 0, high: 60, ticks: [0, 20, 40, 60] });
  });

  test("fitted to the values, over the years: 540 to 620 by 20 for 547.8 to 617.8", () => {
    expect(axisOf([617.8, 590.6, 547.8], { fromZero: false })).toEqual({ low: 540, high: 620, ticks: [540, 560, 580, 600, 620] });
  });

  test("fitted, every value the same: one step either side", () => {
    expect(axisOf([600, 600], { fromZero: false })).toEqual({ low: 500, high: 700, ticks: [500, 600, 700] });
  });

  test("small values take small steps", () => {
    expect(axisOf([0.8, 3.1], { fromZero: true })).toEqual({ low: 0, high: 4, ticks: [0, 1, 2, 3, 4] });
  });

  test("nothing, or zeros: an axis of 0 to 1", () => {
    expect(axisOf([], { fromZero: true })).toEqual({ low: 0, high: 1, ticks: [0, 1] });
    expect(axisOf([0, 0], { fromZero: true })).toEqual({ low: 0, high: 1, ticks: [0, 1] });
  });
});

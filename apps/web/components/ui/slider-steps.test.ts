import { describe, expect, test } from "bun:test";
import { limitsOf, moved, nearestHandle, shareAt, shareOf, valueAfterKey, valueAt, type Scale } from "./slider-steps";

const TILT: Scale = { min: 0, max: 45, step: 1 };
const HOURS: Scale = { min: 5, max: 19, step: 0.5 };
const PITCH: Scale = { min: 0.4, max: 1, step: 0.05 };

describe("shareOf", () => {
  test("where a value is on the track, from 0 at the lowest to 1 at the highest", () => {
    expect(shareOf(0, TILT)).toBe(0);
    expect(shareOf(45, TILT)).toBe(1);
    expect(shareOf(15, TILT)).toBeCloseTo(1 / 3, 10);
    expect(shareOf(9, HOURS)).toBeCloseTo(0.2857, 4);
    expect(shareOf(16, HOURS)).toBeCloseTo(0.7857, 4);
  });

  test("a value outside the scale is at its end", () => {
    expect(shareOf(-5, TILT)).toBe(0);
    expect(shareOf(60, TILT)).toBe(1);
  });

  test("a scale of no length has everything at its start", () => {
    expect(shareOf(3, { min: 3, max: 3, step: 1 })).toBe(0);
  });
});

describe("shareAt", () => {
  test("where the pointer is on a track that begins at `left` and is `width` wide", () => {
    expect(shareAt(100, 100, 300)).toBe(0);
    expect(shareAt(250, 100, 300)).toBe(0.5);
    expect(shareAt(400, 100, 300)).toBe(1);
  });

  test("a pointer beside the track is at its end", () => {
    expect(shareAt(20, 100, 300)).toBe(0);
    expect(shareAt(900, 100, 300)).toBe(1);
  });

  test("a track of no width has the pointer at its start", () => {
    expect(shareAt(120, 100, 0)).toBe(0);
  });
});

describe("valueAt", () => {
  test("the value at a position of the pointer is a step of the scale", () => {
    expect(valueAt(0, TILT)).toBe(0);
    expect(valueAt(1, TILT)).toBe(45);
    expect(valueAt(0.5, TILT)).toBe(23);
    expect(valueAt(0.34, TILT)).toBe(15);
    expect(valueAt(0.3, HOURS)).toBe(9);
    expect(valueAt(0.31, HOURS)).toBe(9.5);
  });

  test("steps that are no whole numbers come out exact", () => {
    expect(valueAt(0.5, PITCH)).toBe(0.7);
    expect(valueAt(0.26, PITCH)).toBe(0.55);
  });

  test("a pointer beyond the track is at its end", () => {
    expect(valueAt(-0.4, TILT)).toBe(0);
    expect(valueAt(1.7, TILT)).toBe(45);
  });

  test("the highest can be reached when it is no whole step from the lowest", () => {
    const scale: Scale = { min: 0, max: 10, step: 4 };

    expect(valueAt(1, scale)).toBe(10);
    expect(valueAt(0.85, scale)).toBe(8);
  });

  test("within limits, the value stays inside them", () => {
    expect(valueAt(0.9, HOURS, { min: 5, max: 15.5 })).toBe(15.5);
    expect(valueAt(0.1, HOURS, { min: 9.5, max: 19 })).toBe(9.5);
  });
});

describe("valueAfterKey", () => {
  test.each([
    ["ArrowRight", 15, 16],
    ["ArrowUp", 15, 16],
    ["ArrowLeft", 15, 14],
    ["ArrowDown", 15, 14],
    ["Home", 15, 0],
    ["End", 15, 45],
  ])("%s from %d goes to %d", (key, from, to) => {
    expect(valueAfterKey(from, key, TILT)).toBe(to);
  });

  test("Page Up and Page Down take a larger step: a tenth of the scale, in whole steps", () => {
    expect(valueAfterKey(15, "PageUp", TILT)).toBe(20);
    expect(valueAfterKey(15, "PageDown", TILT)).toBe(10);
    expect(valueAfterKey(9, "PageUp", HOURS)).toBe(10.5);
  });

  test("the larger step can be given", () => {
    expect(valueAfterKey(9, "PageUp", { ...HOURS, page: 3 })).toBe(12);
  });

  test("the larger step is one step at least", () => {
    expect(valueAfterKey(1, "PageUp", { min: 1, max: 4, step: 1 })).toBe(2);
  });

  test("no key leads beyond the ends", () => {
    expect(valueAfterKey(45, "ArrowRight", TILT)).toBe(45);
    expect(valueAfterKey(0, "ArrowLeft", TILT)).toBe(0);
    expect(valueAfterKey(43, "PageUp", TILT)).toBe(45);
    expect(valueAfterKey(2, "PageDown", TILT)).toBe(0);
  });

  test("steps that are no whole numbers come out exact", () => {
    expect(valueAfterKey(0.7, "ArrowRight", PITCH)).toBe(0.75);
    expect(valueAfterKey(0.55, "ArrowLeft", PITCH)).toBe(0.5);
  });

  test("within limits: the arrows stop at them, Home and End go to them", () => {
    const limits = { min: 5, max: 15.5 };

    expect(valueAfterKey(15.5, "ArrowRight", HOURS, limits)).toBe(15.5);
    expect(valueAfterKey(9, "End", HOURS, limits)).toBe(15.5);
    expect(valueAfterKey(9, "Home", HOURS, limits)).toBe(5);
  });

  test("any other key changes nothing", () => {
    expect(valueAfterKey(15, "a", TILT)).toBeNull();
    expect(valueAfterKey(15, "Tab", TILT)).toBeNull();
    expect(valueAfterKey(15, "Enter", TILT)).toBeNull();
  });
});

describe("limitsOf", () => {
  test("one handle has the whole scale", () => {
    expect(limitsOf([15], 0, TILT, 1)).toEqual({ min: 0, max: 45 });
  });

  test("the handles of a range stop before each other", () => {
    expect(limitsOf([9, 16], 0, HOURS, 0.5)).toEqual({ min: 5, max: 15.5 });
    expect(limitsOf([9, 16], 1, HOURS, 0.5)).toEqual({ min: 9.5, max: 19 });
  });

  test("they may meet when nothing is asked to be between them", () => {
    expect(limitsOf([9, 16], 0, HOURS, 0)).toEqual({ min: 5, max: 16 });
  });
});

describe("moved", () => {
  test("one handle goes where it is sent", () => {
    expect(moved([15], 0, 20, TILT, 1)).toEqual([20]);
  });

  test("a handle of a range never passes the other", () => {
    expect(moved([9, 16], 0, 18, HOURS, 0.5)).toEqual([15.5, 16]);
    expect(moved([9, 16], 1, 6, HOURS, 0.5)).toEqual([9, 9.5]);
  });

  test("the other handle stays where it is", () => {
    expect(moved([9, 16], 0, 10, HOURS, 0.5)).toEqual([10, 16]);
    expect(moved([9, 16], 1, 17.5, HOURS, 0.5)).toEqual([9, 17.5]);
  });

  test("what comes back is another list: the one given is not changed", () => {
    const before = [9, 16];

    moved(before, 0, 10, HOURS, 0.5);

    expect(before).toEqual([9, 16]);
  });
});

describe("nearestHandle", () => {
  test("a press on the track moves the handle that is nearest", () => {
    expect(nearestHandle([9, 16], 6)).toBe(0);
    expect(nearestHandle([9, 16], 12)).toBe(0);
    expect(nearestHandle([9, 16], 13)).toBe(1);
    expect(nearestHandle([9, 16], 18.5)).toBe(1);
  });

  test("of two that are as near it is the lower; the higher when both are below the press", () => {
    expect(nearestHandle([9, 16], 12.5)).toBe(0);
    expect(nearestHandle([12, 12], 14)).toBe(1);
    expect(nearestHandle([12, 12], 10)).toBe(0);
  });

  test("one handle is always the nearest", () => {
    expect(nearestHandle([15], 40)).toBe(0);
  });
});

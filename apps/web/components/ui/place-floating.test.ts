import { describe, expect, test } from "bun:test";
import { placeOf, type Box } from "./place-floating";

const SCREEN = { width: 1440, height: 900 };
const BUTTON: Box = { left: 600, top: 400, width: 80, height: 40 };

describe("placeOf: where a thing floats beside its control", () => {
  test("under the control, a gap away, its left edge on the left edge of the control", () => {
    const place = placeOf({ anchor: BUTTON, size: { width: 320, height: 140 }, screen: SCREEN, side: "below", align: "start", gap: 6 });

    expect(place).toEqual({ x: 600, y: 446, side: "below" });
  });

  test("over the control, its middle over the middle of the control", () => {
    const place = placeOf({ anchor: BUTTON, size: { width: 160, height: 28 }, screen: SCREEN, side: "above", align: "middle", gap: 8 });

    expect(place).toEqual({ x: 560, y: 364, side: "above" });
  });

  test("where there is no room on its side it goes to the other", () => {
    const low: Box = { ...BUTTON, top: 800 };
    const high: Box = { ...BUTTON, top: 10 };

    expect(placeOf({ anchor: low, size: { width: 320, height: 140 }, screen: SCREEN, side: "below", align: "start", gap: 6 })).toEqual({
      x: 600,
      y: 654,
      side: "above",
    });
    expect(placeOf({ anchor: high, size: { width: 160, height: 28 }, screen: SCREEN, side: "above", align: "middle", gap: 8 })).toEqual({
      x: 560,
      y: 58,
      side: "below",
    });
  });

  test("where there is room on neither side it stays on its own, and its top stays on the screen", () => {
    const place = placeOf({
      anchor: { left: 20, top: 100, width: 80, height: 40 },
      size: { width: 200, height: 400 },
      screen: { width: 390, height: 300 },
      side: "below",
      align: "start",
      gap: 6,
    });

    expect(place.side).toBe("below");
    expect(place.y).toBe(8);
  });

  test("it never leaves the screen at the sides: a margin stays free", () => {
    const atTheRight: Box = { ...BUTTON, left: 1380, width: 40 };
    const atTheLeft: Box = { ...BUTTON, left: 4, width: 40 };

    expect(placeOf({ anchor: atTheRight, size: { width: 320, height: 140 }, screen: SCREEN, side: "below", align: "start", gap: 6 }).x).toBe(1112);
    expect(placeOf({ anchor: atTheLeft, size: { width: 160, height: 28 }, screen: SCREEN, side: "above", align: "middle", gap: 8 }).x).toBe(8);
  });

  test("a thing wider than the screen begins at the margin", () => {
    const place = placeOf({ anchor: BUTTON, size: { width: 500, height: 28 }, screen: { width: 390, height: 844 }, side: "above", align: "middle", gap: 8 });

    expect(place.x).toBe(8);
  });

  test("places are whole pixels", () => {
    const place = placeOf({
      anchor: { left: 100.4, top: 200.6, width: 37, height: 38 },
      size: { width: 120, height: 28 },
      screen: SCREEN,
      side: "above",
      align: "middle",
      gap: 8,
    });

    expect(place).toEqual({ x: 59, y: 165, side: "above" });
  });
});

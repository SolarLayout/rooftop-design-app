import { describe, expect, test } from "bun:test";
import { isStill, placeOf, type Box } from "./place-floating";

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

describe("isStill: whether a control is where it was, after a scroll or a resize somewhere on the page", () => {
  const box: Box = { left: 100, top: 200, width: 40, height: 20 };

  test("the same place, to the pixel, is still", () => {
    expect(isStill(box, { ...box })).toBe(true);
    expect(isStill(box, { ...box, left: 100.6, top: 199.5 })).toBe(true);
  });

  test("moved by more than a pixel, or sized anew, it is not", () => {
    expect(isStill(box, { ...box, top: 180 })).toBe(false);
    expect(isStill(box, { ...box, left: 102 })).toBe(false);
    expect(isStill(box, { ...box, width: 44 })).toBe(false);
  });
});

describe("placeOf: beside the control, at its right", () => {
  test("a gap to the right of the control, its middle on the middle of the control", () => {
    const place = placeOf({ anchor: BUTTON, size: { width: 120, height: 48 }, screen: SCREEN, side: "right", align: "middle", gap: 8 });

    expect(place).toEqual({ x: 688, y: 396, side: "right" });
  });

  test("its top on the top of the control where it is aligned at the start", () => {
    const place = placeOf({ anchor: BUTTON, size: { width: 120, height: 48 }, screen: SCREEN, side: "right", align: "start", gap: 8 });

    expect(place).toEqual({ x: 688, y: 400, side: "right" });
  });

  test("where there is no room at the right it goes to the left, and back where the left has none either", () => {
    const atTheEdge: Box = { ...BUTTON, left: 1340 };

    expect(placeOf({ anchor: atTheEdge, size: { width: 120, height: 48 }, screen: SCREEN, side: "right", align: "middle", gap: 8 })).toEqual({ x: 1212, y: 396, side: "left" });
    expect(placeOf({ anchor: { left: 20, top: 100, width: 300, height: 40 }, size: { width: 120, height: 48 }, screen: { width: 390, height: 844 }, side: "right", align: "middle", gap: 8 })).toEqual({
      x: 262,
      y: 96,
      side: "right",
    });
  });
});

describe("placeOf: aligned to the end", () => {
  test("under the control, its right edge on the right edge of the control: the menu of a card, whose button stands at the card's right", () => {
    const place = placeOf({ anchor: BUTTON, size: { width: 240, height: 230 }, screen: SCREEN, side: "below", align: "end", gap: 6 });

    expect(place).toEqual({ x: 440, y: 446, side: "below" });
  });

  test("beside the control, its bottom on the bottom of the control", () => {
    const place = placeOf({ anchor: BUTTON, size: { width: 120, height: 100 }, screen: SCREEN, side: "right", align: "end", gap: 8 });

    expect(place).toEqual({ x: 688, y: 340, side: "right" });
  });

  // The Layers panel of the stage (the board "Stage, Layers"): 240 wide, 6 under the Layers button with their right
  // edges in line, so that it stays on the stage; the button stands at the stage's right edge on every size.
  test("the Layers panel hangs 6 under its button with their right edges in line: on desktop, and on the phone 12 from the screen's edge", () => {
    const onDesktop = placeOf({ anchor: { left: 1000, top: 20, width: 38, height: 38 }, size: { width: 240, height: 94 }, screen: { width: 1440, height: 900 }, side: "below", align: "end", gap: 6 });
    expect(onDesktop).toEqual({ x: 798, y: 64, side: "below" });
    expect(onDesktop.x + 240).toBe(1038);

    const onThePhone = placeOf({ anchor: { left: 334, top: 4, width: 44, height: 44 }, size: { width: 240, height: 100 }, screen: { width: 390, height: 844 }, side: "below", align: "end", gap: 6 });
    expect(onThePhone).toEqual({ x: 138, y: 54, side: "below" });
    expect(390 - (onThePhone.x + 240)).toBe(12);
  });
});

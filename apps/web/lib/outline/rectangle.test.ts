import { describe, expect, test } from "bun:test";
import { edgesOf, type XY } from "../geometry/measure";
import { rectangleOf, turnedAbout, turnOfHandle } from "./rectangle";

const rounded = (points: XY[]) => points.map(({ x, y }) => ({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 }));

describe("a box dragged", () => {
  test("two opposite corners make the four, counter-clockwise from the lowest left", () => {
    expect(rectangleOf({ x: 45, y: 20 }, { x: -45, y: -20 })).toEqual([
      { x: -45, y: -20 },
      { x: 45, y: -20 },
      { x: 45, y: 20 },
      { x: -45, y: 20 },
    ]);
  });

  test("a drag of no width or no height is no rectangle", () => {
    expect(rectangleOf({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeNull();
    expect(rectangleOf({ x: 0, y: 0 }, { x: 0, y: 10 })).toBeNull();
  });
});

describe("turned", () => {
  const box = rectangleOf({ x: -45, y: -20 }, { x: 45, y: 20 })!;

  test("about its centre, by degrees counter-clockwise, the edges keep their lengths", () => {
    const turned = turnedAbout(box, { x: 0, y: 0 }, 90);

    expect(rounded(turned)).toEqual([
      { x: 20, y: -45 },
      { x: 20, y: 45 },
      { x: -20, y: 45 },
      { x: -20, y: -45 },
    ]);
    expect(edgesOf(turned).map((edge) => Math.round(edge * 1000) / 1000)).toEqual([90, 40, 90, 40]);
  });

  test("the handle above the top edge sets the turn: straight above is none, to the left is counter-clockwise", () => {
    expect(turnOfHandle({ x: 0, y: 0 }, { x: 0, y: 30 })).toBeCloseTo(0, 9);
    expect(turnOfHandle({ x: 0, y: 0 }, { x: -30, y: 0 })).toBeCloseTo(90, 9);
    expect(turnOfHandle({ x: 0, y: 0 }, { x: 30, y: 0 })).toBeCloseTo(-90, 9);
  });

  test("a turn within 3° of north is snapped to it", () => {
    expect(turnOfHandle({ x: 0, y: 0 }, { x: 30 * Math.sin((2 * Math.PI) / 180), y: 30 * Math.cos((2 * Math.PI) / 180) }, 3)).toBe(0);
    expect(turnOfHandle({ x: 0, y: 0 }, { x: 30 * Math.sin((5 * Math.PI) / 180), y: 30 * Math.cos((5 * Math.PI) / 180) }, 3)).toBeCloseTo(-5, 6);
  });
});

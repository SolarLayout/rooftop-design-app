import { describe, expect, test } from "bun:test";
import { arcFrom, boxOf, clipAround, HOW_TOS, pointOf } from "./pictures";

// The pictures of the how-tos (D81): where the hand goes on the roof, and what of the screen is kept.

describe("the roof on the screen", () => {
  test("its box is the extent of its corners", () => {
    expect(boxOf([{ x: 100, y: 50 }, { x: 400, y: 60 }, { x: 390, y: 200 }, { x: 110, y: 190 }])).toEqual({ left: 100, top: 50, right: 400, bottom: 200 });
  });

  test("a spot on it is a fraction of its box, from the top left", () => {
    expect(pointOf({ left: 100, top: 50, right: 400, bottom: 250 }, { across: 0.25, down: 0.5 })).toEqual({ x: 175, y: 150 });
  });

  test("a picture keeps the box and a margin round it, in whole pixels", () => {
    expect(clipAround({ left: 100.4, top: 50.6, right: 400.2, bottom: 200 }, { left: 60, top: 72, right: 140, bottom: 56 })).toEqual({ x: 40, y: -21, width: 500, height: 277 });
  });
});

describe("a turn by the handle", () => {
  test("goes round the middle from where the handle is, by the angle, in even steps, ending there", () => {
    const points = arcFrom({ x: 0, y: 0 }, { x: 0, y: -100 }, 90, 3);
    expect(points).toHaveLength(3);
    expect(points[0]!.x).toBeCloseTo(50);
    expect(points[0]!.y).toBeCloseTo(-86.6, 1);
    expect(points[2]!.x).toBeCloseTo(100);
    expect(points[2]!.y).toBeCloseTo(0);
  });
});

describe("the how-tos", () => {
  test("each has its folder under public/help and its pictures numbered from 1", () => {
    for (const { dir, shots } of HOW_TOS) {
      expect(dir).toMatch(/^[a-z]+\/[a-z-]+$/);
      expect(shots.map(({ name }) => name)).toEqual(shots.map((_, index) => String(index + 1)));
    }
  });
});

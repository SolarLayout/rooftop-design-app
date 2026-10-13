import { describe, expect, test } from "bun:test";
import { arcFrom, boxOf, clipAround, clipAt, HOW_TOS, placeOnScreen, pointOf, screenOf } from "./pictures";

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

describe("a place in metres from the map's middle", () => {
  test("is pixels east and up from it, at the map's scale", () => {
    expect(screenOf({ x: 900, y: 450 }, 4, { east: 10, north: 5 })).toEqual({ x: 940, y: 430 });
  });

  test("a picture of a size, kept round the middle", () => {
    expect(clipAt({ x: 900, y: 450 }, { width: 520, height: 280 })).toEqual({ x: 640, y: 310, width: 520, height: 280 });
  });
});

describe("a place written either way", () => {
  test("a spot is on the roof's box, metres are from the map's middle", () => {
    const box = { left: 100, top: 50, right: 400, bottom: 250 };
    const map = { middle: { x: 900, y: 450 }, pixelsPerMetre: 4 };
    expect(placeOnScreen({ across: 0.5, down: 0.5 }, box, map)).toEqual({ x: 250, y: 150 });
    expect(placeOnScreen({ east: 10, north: 5 }, box, map)).toEqual({ x: 940, y: 430 });
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
  test("each has its folder under public/help and its pictures named for their steps, in order", () => {
    expect(HOW_TOS.map(({ dir }) => dir)).toEqual(["find/move-the-roof", "find/corners", "find/rectangle", "find/detect", "find/box", "find/tank", "find/tree", "find/wall", "find/building", "find/move-an-obstacle"]);
    for (const { dir, shots } of HOW_TOS) {
      expect(dir).toMatch(/^[a-z]+\/[a-z-]+$/);
      const steps = shots.map(({ name }) => Number(name));
      expect(shots.map(({ name }) => name)).toEqual(steps.map(String));
      expect(steps.every((step, index) => Number.isInteger(step) && step > (steps[index - 1] ?? 0))).toBe(true);
    }
  });

  test("a step without a picture is skipped: the wall's and the building's closing click", () => {
    expect(HOW_TOS.find(({ dir }) => dir === "find/wall")?.shots.map(({ name }) => name)).toEqual(["1", "3"]);
    expect(HOW_TOS.find(({ dir }) => dir === "find/building")?.shots.map(({ name }) => name)).toEqual(["1", "3"]);
  });
});

describe("Move, turn or remove an obstacle", () => {
  const howTo = HOW_TOS.find(({ dir }) => dir === "find/move-an-obstacle");

  test("is taken closer in, round a spot of the roof, so that the stair room is larger than its corners' handles", () => {
    expect(howTo?.zoomIn).toBe(1);
    expect(howTo?.keep.around).toBe("spot");
  });

  test("a part kept round a spot of the roof is of its size, round that spot", () => {
    const box = { left: 100, top: 50, right: 400, bottom: 250 };
    expect(clipAt(pointOf(box, { across: 0.5, down: 0.5 }), { width: 200, height: 100 })).toEqual({ x: 150, y: 100, width: 200, height: 100 });
  });
});

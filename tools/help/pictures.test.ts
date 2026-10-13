import { describe, expect, test } from "bun:test";
import { actsOfObstacle, arcFrom, boxOf, clipAround, clipAt, DEMO_ACTS, DEMO_OBSTACLES, HOW_TOS, placeOnScreen, pointOf, screenOf } from "./pictures";

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

// Find is for a new roof (issue 238, item 6): a how-to on the demo's roof begins on Find fresh at the demo's place, and the
// hand outlines the demo itself (apps/api/src/rooftop_core/demo.py: 90 by 40 m, its long side to the south, at 18.52, 73.86)
// and draws what stands on it, each height given in the card that asks for it.
describe("the demo's roof, outlined and its obstacles drawn", () => {
  const corners = DEMO_ACTS.flatMap((done) => (done.kind === "corner" ? [done.at] : []));

  test("the how-tos on the demo's roof begin with it; none begins on a roof opened from a design", () => {
    expect(HOW_TOS.filter(({ start }) => start === "demo").map(({ dir }) => dir)).toEqual([
      "find/move-the-roof",
      "find/box",
      "find/tank",
      "find/tree",
      "find/wall",
      "find/building",
      "find/move-an-obstacle",
    ]);
    expect(HOW_TOS.every(({ start }) => start === "demo" || start === "place")).toBe(true);
  });

  test("its four corners, 90 by 40 m about the demo's place from the south-west, then the first again to close it", () => {
    expect(DEMO_ACTS.slice(0, 5).every((done) => done.kind === "corner")).toBe(true);
    expect(corners.slice(0, 5)).toEqual([
      { east: -45, north: -20 },
      { east: 45, north: -20 },
      { east: 45, north: 20 },
      { east: -45, north: 20 },
      { east: -45, north: -20 },
    ]);
  });

  test("a box is drawn from one corner to the opposite one, its height typed and added", () => {
    expect(actsOfObstacle({ kind: "box", east: -22.5, north: -2, length: 5, width: 4, height: 3 })).toEqual([
      { kind: "tool", name: "Box" },
      { kind: "draw", from: { east: -20, north: -4 }, to: { east: -25, north: 0 }, held: false },
      { kind: "fill", label: "Height above the roof", text: "3" },
      { kind: "press", name: "Add" },
    ]);
  });

  test("a tank is drawn from its middle out to its edge, its height typed and added", () => {
    expect(actsOfObstacle({ kind: "tank", east: 17, north: 4, diameter: 2.5, height: 2 })).toEqual([
      { kind: "tool", name: "Tank" },
      { kind: "draw", from: { east: 17, north: 4 }, to: { east: 18.25, north: 4 }, held: false },
      { kind: "fill", label: "Height above the roof", text: "2" },
      { kind: "press", name: "Add" },
    ]);
  });

  test("the demo's obstacles, where the demo has them about its place: the stair room, the water tank, the four AC units", () => {
    expect(DEMO_OBSTACLES).toEqual([
      { kind: "box", east: -22.5, north: -2, length: 5, width: 4, height: 3 },
      { kind: "tank", east: 17, north: 4, diameter: 2.5, height: 2 },
      { kind: "box", east: 25.75, north: -16.5, length: 1.5, width: 1, height: 1.2 },
      { kind: "box", east: 28.75, north: -16.5, length: 1.5, width: 1, height: 1.2 },
      { kind: "box", east: 31.75, north: -16.5, length: 1.5, width: 1, height: 1.2 },
      { kind: "box", east: 34.75, north: -16.5, length: 1.5, width: 1, height: 1.2 },
    ]);
    expect(DEMO_ACTS.slice(9, -2)).toEqual(DEMO_OBSTACLES.flatMap(actsOfObstacle));
  });

  test("closed, its edges are typed to the demo's 90 and 40 m in Edges, opened and closed again: the corners are placed at a scale read off the scale bar", () => {
    expect(DEMO_ACTS.slice(5, 9)).toEqual([
      { kind: "press", name: "Edges" },
      { kind: "fill", label: "South", text: "90" },
      { kind: "fill", label: "East", text: "40" },
      { kind: "press", name: "Edges" },
    ]);
  });

  test("it ends with nothing picked, the box in hand: a press outside the roof lets the last obstacle go", () => {
    expect(DEMO_ACTS.slice(-2)).toEqual([{ kind: "tool", name: "Box" }, { kind: "corner", at: { east: 0, north: -32 } }]);
  });
});

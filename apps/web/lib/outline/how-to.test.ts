import { describe, expect, test } from "bun:test";
import type { XY } from "../geometry/measure";
import { howTosOf } from "./how-to";
import { outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";

// The how-to the ? beside Find's title opens (D81): of what the hand can do now, the most fitting first; Find opens the
// first that has a topic.

const PUNE = { lon: 73.86, lat: 18.52 };
const PRESS = { metresPerPx: 0.283, touch: false };
const after = (state: OutlineState, ...events: OutlineEvent[]) => events.reduce(outlineAfter, state);
const RECTANGLE: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];
const placed = () => after(START, { type: "began", at: PUNE }, ...RECTANGLE.map((at): OutlineEvent => ({ type: "placed", at, ...PRESS })));
const closed = () => outlineAfter(placed(), { type: "close" });
const withBox = () =>
  after(closed(), { type: "shapeDragged", kind: "box", from: { x: 10, y: 5 }, to: { x: 15, y: 9 } }, { type: "shapeDropped" }, { type: "heightGiven", height: 3, name: "Stair room" });

describe("the how-to of what the hand can do now", () => {
  test("with the roof open, the outline tool in hand", () => {
    expect(howTosOf(placed(), "corners")).toEqual(["corners"]);
    expect(howTosOf(START, "rectangle")).toEqual(["rectangle"]);
    expect(howTosOf(START, "detect")).toEqual(["detect"]);
  });

  test("with the roof closed, the obstacle tool in hand, then moving the roof", () => {
    expect(howTosOf(closed(), "box")).toEqual(["box", "move-the-roof"]);
    expect(howTosOf(closed(), "wall")).toEqual(["wall", "move-the-roof"]);
  });

  test("with the roof picked up, moving it", () => {
    expect(howTosOf(outlineAfter(closed(), { type: "roofPicked", picked: true }), "box")).toEqual(["move-the-roof"]);
  });

  test("with an obstacle picked, moving it, then the roof", () => {
    const box = withBox();
    const id = box.obstacles[0]!.id;
    expect(howTosOf(outlineAfter(box, { type: "obstacleSelected", id }), "box")).toEqual(["move-an-obstacle", "move-the-roof"]);
  });
});

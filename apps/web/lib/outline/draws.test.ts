import { describe, expect, test } from "bun:test";
import type { XY } from "../geometry/measure";
import { drawsOf } from "./draws";
import type { Tool } from "./how-to";
import { outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";

// What the tool in hand draws on Find's map, and how (issue 238, item 3): by a drag (the map's panning off, the
// crosshair), by presses, or nothing. The box, the tank and the tree are dragged from their corner or their middle.

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

describe("what the tool in hand draws", () => {
  test("the box, the tank and the tree draw by a drag on the closed roof", () => {
    const tools: Tool[] = ["box", "tank", "tree"];
    tools.forEach((tool) => expect(drawsOf(tool, closed())).toBe("drag"));
  });

  test("the wall and the building draw by presses on the closed roof", () => {
    expect(drawsOf("wall", closed())).toBe("press");
    expect(drawsOf("building", closed())).toBe("press");
  });

  test("nothing is drawn by a drag on the roof picked up; nothing at all while a shape awaits its height", () => {
    const picked = outlineAfter(closed(), { type: "roofPicked", picked: true });
    expect(drawsOf("tree", picked)).toBeNull();
    const awaiting = after(closed(), { type: "shapeDragged", kind: "tree", from: { x: 0, y: 0 }, to: { x: 2, y: 0 } }, { type: "shapeDropped" });
    expect(drawsOf("tree", awaiting)).toBeNull();
    expect(drawsOf("wall", awaiting)).toBeNull();
  });

  test("an obstacle is not drawn while the roof is open", () => {
    expect(drawsOf("tree", placed())).toBeNull();
    expect(drawsOf("box", START)).toBeNull();
  });

  test("the rectangle draws by a drag while no corner is placed; the corners and Detect building by presses", () => {
    expect(drawsOf("rectangle", START)).toBe("drag");
    expect(drawsOf("rectangle", placed())).toBeNull();
    expect(drawsOf("corners", placed())).toBe("press");
    expect(drawsOf("corners", closed())).toBeNull();
    expect(drawsOf("detect", closed())).toBe("press");
  });

  test("without a tool in hand nothing is drawn", () => {
    expect(drawsOf(null, closed())).toBeNull();
  });
});

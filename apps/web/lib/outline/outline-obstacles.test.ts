import { describe, expect, test } from "bun:test";
import type { XY } from "./measure";
import { outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";

// The obstacles in the reducer of the outline (plan/phase-04-plan.md, step 14): a box, a tank, a wall
// and a building drawn on the closed roof, each awaiting its height right after; selected, resized,
// removed; a step of the history each. Tested without a browser, as every rule of drawing is.

const PUNE = { lon: 73.86, lat: 18.52 };
const M_PER_PX = 0.283;
const PRESS = { metresPerPx: M_PER_PX, touch: false };

const after = (state: OutlineState, ...events: OutlineEvent[]) => events.reduce(outlineAfter, state);

const RECTANGLE: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];

/** The 90 by 40 roof drawn and closed. */
function closed(): OutlineState {
  return after(
    START,
    { type: "began", at: PUNE },
    ...RECTANGLE.map((at): OutlineEvent => ({ type: "placed", at, ...PRESS })),
    { type: "close" },
  );
}

/** A box of 5 by 4 at (10, 5), dropped: awaiting its height. */
const boxDropped = (state: OutlineState) => after(state, { type: "shapeDragged", kind: "box", from: { x: 10, y: 5 }, to: { x: 15, y: 9 } }, { type: "shapeDropped" });

describe("a box", () => {
  test("dragged on the closed roof it is the shape being drawn, and nothing is pushed; dropped, it awaits its height", () => {
    const dragging = outlineAfter(closed(), { type: "shapeDragged", kind: "box", from: { x: 10, y: 5 }, to: { x: 15, y: 9 } });
    expect(dragging.drawing?.kind).toBe("box");
    expect(dragging.drawing?.points).toHaveLength(4);
    expect(dragging.pending).toBeNull();
    expect(dragging.history.past).toHaveLength(closed().history.past.length);

    const dropped = outlineAfter(dragging, { type: "shapeDropped" });

    expect(dropped.drawing).toBeNull();
    expect(dropped.pending?.kind).toBe("box");
    expect(dropped.obstacles).toHaveLength(0);
  });

  test("its height given, it is an obstacle with the name of its kind, selected, and one step of the history", () => {
    const before = boxDropped(closed());

    const state = outlineAfter(before, { type: "heightGiven", height: 3, name: "" });

    expect(state.pending).toBeNull();
    expect(state.obstacles).toHaveLength(1);
    expect(state.obstacles[0]).toMatchObject({ id: 1, kind: "box", name: "Box 1", height: 3, diameter: null });
    expect(state.selectedObstacle).toBe(1);
    expect(state.history.past).toHaveLength(before.history.past.length + 1);
    expect(outlineAfter(state, { type: "undone" }).obstacles).toHaveLength(0);
  });

  test("a name typed is kept; the second box is Box 2", () => {
    const one = outlineAfter(boxDropped(closed()), { type: "heightGiven", height: 3, name: "Stair room" });
    const two = outlineAfter(boxDropped(one), { type: "heightGiven", height: 1.2, name: "" });

    expect(two.obstacles.map((obstacle) => obstacle.name)).toEqual(["Stair room", "Box 2"]);
    expect(two.obstacles.map((obstacle) => obstacle.id)).toEqual([1, 2]);
  });

  test("the shape awaiting its height can be discarded: nothing is kept, nothing is a step", () => {
    const before = boxDropped(closed());

    const state = outlineAfter(before, { type: "pendingDiscarded" });

    expect(state.pending).toBeNull();
    expect(state.obstacles).toHaveLength(0);
    expect(state.history).toBe(before.history);
  });

  test("nothing is drawn while the roof is open, nor while a shape awaits its height", () => {
    const open = after(START, { type: "began", at: PUNE }, { type: "placed", at: RECTANGLE[0], ...PRESS });
    expect(outlineAfter(open, { type: "shapeDragged", kind: "box", from: { x: 0, y: 0 }, to: { x: 5, y: 4 } }).drawing).toBeNull();

    const awaiting = boxDropped(closed());
    expect(outlineAfter(awaiting, { type: "shapeDragged", kind: "box", from: { x: 0, y: 0 }, to: { x: 5, y: 4 } }).drawing).toBeNull();
  });

  test("a drag of no size is no shape", () => {
    const state = after(closed(), { type: "shapeDragged", kind: "box", from: { x: 0, y: 0 }, to: { x: 0, y: 4 } }, { type: "shapeDropped" });

    expect(state.pending).toBeNull();
  });
});

describe("a tank", () => {
  test("dragged from its middle to its edge: the centre and the diameter", () => {
    const state = after(closed(), { type: "shapeDragged", kind: "cylinder", from: { x: 30, y: 10 }, to: { x: 31.25, y: 10 } }, { type: "shapeDropped" }, { type: "heightGiven", height: 2, name: "" });

    expect(state.obstacles[0]).toMatchObject({ kind: "cylinder", name: "Tank 1", diameter: 2.5, height: 2 });
    expect(state.obstacles[0].points).toEqual([{ x: 30, y: 10 }]);
  });
});

describe("a wall", () => {
  test("its points are pressed one by one; a press on the last again ends it, with two at least", () => {
    const one = outlineAfter(closed(), { type: "shapePlaced", kind: "wall", at: { x: -40, y: -15 }, ...PRESS });
    expect(one.drawing).toMatchObject({ kind: "wall", points: [{ x: -40, y: -15 }] });
    // A press on the only point is no end: a wall needs two.
    expect(outlineAfter(one, { type: "shapePlaced", kind: "wall", at: { x: -40, y: -15 }, ...PRESS }).pending).toBeNull();

    const two = outlineAfter(one, { type: "shapePlaced", kind: "wall", at: { x: -40, y: 15 }, ...PRESS });
    const ended = outlineAfter(two, { type: "shapePlaced", kind: "wall", at: { x: -40, y: 15.5 }, ...PRESS });

    expect(ended.drawing).toBeNull();
    expect(ended.pending).toMatchObject({ kind: "wall" });
    expect(ended.pending?.points).toHaveLength(2);
  });

  test("Enter ends it too; Escape takes its last point back, and the wall away when none is left", () => {
    const two = after(closed(), { type: "shapePlaced", kind: "wall", at: { x: 0, y: 0 }, ...PRESS }, { type: "shapePlaced", kind: "wall", at: { x: 10, y: 0 }, ...PRESS });

    expect(outlineAfter(two, { type: "close" }).pending?.points).toHaveLength(2);
    const one = outlineAfter(two, { type: "steppedBack" });
    expect(one.drawing?.points).toHaveLength(1);
    expect(outlineAfter(one, { type: "steppedBack" }).drawing).toBeNull();
    // Escape while a shape is drawn never touches the roof.
    expect(outlineAfter(one, { type: "steppedBack" }).corners).toHaveLength(4);
  });
});

describe("a building beside the roof", () => {
  test("its corners are pressed; a press on the first closes it, with three at least; Enter closes it too", () => {
    const corners: XY[] = [
      { x: 60, y: -10 },
      { x: 70, y: -10 },
      { x: 70, y: 0 },
    ];
    const three = after(closed(), ...corners.map((at): OutlineEvent => ({ type: "shapePlaced", kind: "building", at, ...PRESS })));
    expect(three.drawing?.points).toHaveLength(3);

    const byPress = outlineAfter(three, { type: "shapePlaced", kind: "building", at: { x: 60.5, y: -10 }, ...PRESS });
    expect(byPress.pending).toMatchObject({ kind: "building" });
    expect(byPress.pending?.points).toHaveLength(3);

    expect(outlineAfter(three, { type: "close" }).pending?.points).toHaveLength(3);
    const two = after(closed(), ...corners.slice(0, 2).map((at): OutlineEvent => ({ type: "shapePlaced", kind: "building", at, ...PRESS })));
    expect(outlineAfter(two, { type: "close" }).pending).toBeNull();
  });
});

describe("an obstacle on the map", () => {
  const withBox = () => outlineAfter(boxDropped(closed()), { type: "heightGiven", height: 3, name: "" });

  test("is selected and let go; the roof's corner is not selected at the same time", () => {
    const state = outlineAfter(withBox(), { type: "selected", index: 2 });
    expect(state.selectedObstacle).toBeNull();
    expect(state.selected).toBe(2);

    const again = outlineAfter(state, { type: "obstacleSelected", id: 1 });
    expect(again.selectedObstacle).toBe(1);
    expect(again.selected).toBeNull();
    expect(outlineAfter(again, { type: "obstacleSelected", id: null }).selectedObstacle).toBeNull();
  });

  test("a corner of the selected box dragged resizes it; the drag is one step when it ends", () => {
    const before = withBox();

    const dragging = outlineAfter(before, { type: "obstacleCornerMoved", id: 1, index: 2, at: { x: 16, y: 10 } });
    expect(dragging.obstacles[0].points[2]).toEqual({ x: 16, y: 10 });
    expect(dragging.obstacles[0].points[1]).toEqual({ x: 16, y: 5 });
    expect(dragging.history).toBe(before.history);

    const dropped = outlineAfter(dragging, { type: "obstacleCornerDropped" });
    expect(dropped.history.past).toHaveLength(before.history.past.length + 1);
    expect(outlineAfter(dropped, { type: "undone" }).obstacles[0].points[2]).toEqual({ x: 15, y: 9 });
  });

  test("the edge of a tank dragged changes its diameter", () => {
    const tank = after(closed(), { type: "shapeDragged", kind: "cylinder", from: { x: 30, y: 10 }, to: { x: 31.25, y: 10 } }, { type: "shapeDropped" }, { type: "heightGiven", height: 2, name: "" });

    const wider = outlineAfter(tank, { type: "obstacleCornerMoved", id: 1, index: 0, at: { x: 32, y: 10 } });

    expect(wider.obstacles[0].diameter).toBe(4);
    expect(wider.obstacles[0].points).toEqual([{ x: 30, y: 10 }]);
  });

  test("Delete removes the selected obstacle before any corner; a row's Remove takes one by its id; each is a step", () => {
    const two = outlineAfter(boxDropped(withBox()), { type: "heightGiven", height: 1, name: "" });
    expect(two.selectedObstacle).toBe(2);

    const removed = outlineAfter(two, { type: "removed" });
    expect(removed.obstacles.map((obstacle) => obstacle.id)).toEqual([1]);
    expect(removed.corners).toHaveLength(4);
    expect(removed.selectedObstacle).toBeNull();

    const none = outlineAfter(removed, { type: "obstacleRemoved", id: 1 });
    expect(none.obstacles).toHaveLength(0);
    expect(outlineAfter(none, { type: "undone" }).obstacles).toHaveLength(1);
  });

  test("clear takes the obstacles with the roof; undo brings both back", () => {
    const cleared = outlineAfter(withBox(), { type: "cleared" });
    expect(cleared.obstacles).toHaveLength(0);
    expect(cleared.corners).toHaveLength(0);

    const back = outlineAfter(cleared, { type: "undone" });
    expect(back.obstacles).toHaveLength(1);
    expect(back.closed).toBe(true);
  });

  test("an outline loaded from a design brings its obstacles, in its frame", () => {
    const obstacles = [{ id: 1, kind: "box" as const, name: "Stair room", points: RECTANGLE.map((p) => ({ x: p.x / 10, y: p.y / 10 })), diameter: null, height: 3 }];

    const loaded = outlineAfter(START, { type: "loaded", at: PUNE, corners: RECTANGLE, obstacles });

    expect(loaded.obstacles).toEqual(obstacles);
    expect(loaded.history.past).toHaveLength(0);
  });
});

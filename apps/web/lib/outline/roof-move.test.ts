import { describe, expect, test } from "bun:test";
import { facingOf, type XY } from "../geometry/measure";
import type { Obstacle } from "./obstacles";
import { isInside, liftLabelOf, movedBy, northEdgeOf, turnedBy, turnHandleOf, turnOfDrag } from "./roof-move";

// The closed roof picked up whole on Find's map (D79): moved and turned with its obstacles. Pure, in the
// metres of the frame: x east, y north.

/** The 90 by 40 roof of the demo, counter-clockwise from its lowest left. */
const ROOF: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];

const STAIR: Obstacle = {
  id: 1,
  kind: "box",
  name: "Stair room",
  height: 3,
  diameter: null,
  points: [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 5, y: 4 },
    { x: 0, y: 4 },
  ],
};
const TANK: Obstacle = { id: 2, kind: "cylinder", name: "Water tank", height: 2, diameter: 2.5, points: [{ x: 20, y: 10 }] };

const rounded = (points: readonly XY[]) => points.map(({ x, y }) => ({ x: Math.round(x * 1e6) / 1e6 + 0, y: Math.round(y * 1e6) / 1e6 + 0 }));

describe("a point inside the roof", () => {
  test("inside, outside, and a roof of any shape", () => {
    expect(isInside(ROOF, { x: 0, y: 0 })).toBe(true);
    expect(isInside(ROOF, { x: 44.9, y: 19.9 })).toBe(true);
    expect(isInside(ROOF, { x: 46, y: 0 })).toBe(false);
    const ell: XY[] = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
    ];
    expect(isInside(ell, { x: 5, y: 15 })).toBe(true);
    expect(isInside(ell, { x: 15, y: 15 })).toBe(false);
  });

  test("fewer than three corners hold nothing", () => {
    expect(isInside(ROOF.slice(0, 2), { x: 0, y: -20 })).toBe(false);
  });
});

describe("moved", () => {
  test("the corners and every obstacle move by the same metres; their sizes stay", () => {
    const moved = movedBy({ corners: ROOF, obstacles: [STAIR, TANK] }, { x: 1.6, y: -0.6 });

    expect(rounded(moved.corners)).toEqual(rounded(ROOF.map(({ x, y }) => ({ x: x + 1.6, y: y - 0.6 }))));
    expect(rounded(moved.obstacles[0].points)).toEqual(rounded(STAIR.points.map(({ x, y }) => ({ x: x + 1.6, y: y - 0.6 }))));
    expect(moved.obstacles[1]).toEqual({ ...TANK, points: [{ x: 21.6, y: 9.4 }] });
  });
});

describe("turned", () => {
  test("about the middle of the roof, counter-clockwise by the degrees given, the obstacles with it", () => {
    const turned = turnedBy({ corners: ROOF, obstacles: [TANK] }, 90);

    expect(rounded(turned.corners)).toEqual([
      { x: 20, y: -45 },
      { x: 20, y: 45 },
      { x: -20, y: 45 },
      { x: -20, y: -45 },
    ]);
    expect(rounded(turned.obstacles[0].points)).toEqual([{ x: -10, y: 20 }]);
    expect(turned.obstacles[0].diameter).toBe(2.5);
  });

  test("a turn of 6° clockwise makes the roof face 186°", () => {
    const turned = turnedBy({ corners: ROOF, obstacles: [] }, -6);

    expect(facingOf(turned.corners, "north")?.degrees).toBeCloseTo(186, 6);
  });
});

describe("the turn handle", () => {
  test("the north edge is the one whose outside looks nearest north, whichever way the corners run", () => {
    expect(northEdgeOf(ROOF)).toBe(2);
    expect(northEdgeOf([...ROOF].reverse())).toBe(0);
  });

  test("it stands 44 px square off the middle of the north edge, and turns with the roof", () => {
    const metresPerPx = 0.25;

    expect(turnHandleOf(ROOF, ROOF, metresPerPx)).toEqual({ foot: { x: 0, y: 20 }, handle: { x: 0, y: 31 } });

    const turned = turnedBy({ corners: ROOF, obstacles: [] }, 90).corners;
    const { foot, handle } = turnHandleOf(ROOF, turned, metresPerPx);
    expect(rounded([foot, handle])).toEqual([
      { x: -20, y: 0 },
      { x: -31, y: 0 },
    ]);
  });
});

describe("the turn of a drag", () => {
  test("the angle swept about the middle of the roof, counter-clockwise", () => {
    const from = { x: 0, y: 31 };
    const to = { x: -31 * Math.sin(Math.PI / 6), y: 31 * Math.cos(Math.PI / 6) };

    expect(turnOfDrag(ROOF, from, to, 3)).toBeCloseTo(30, 6);
    expect(turnOfDrag(ROOF, from, { x: 31 * Math.sin(Math.PI / 6), y: 31 * Math.cos(Math.PI / 6) }, 3)).toBeCloseTo(-30, 6);
  });

  test("within 3° of north the north edge snaps square to north", () => {
    const off = turnedBy({ corners: ROOF, obstacles: [] }, 10).corners;
    const from = { x: 0, y: 31 };
    // Swept 8° clockwise: the north edge's outside would look 2° west of north; it snaps to north.
    const to = { x: 31 * Math.sin((8 * Math.PI) / 180), y: 31 * Math.cos((8 * Math.PI) / 180) };

    expect(turnOfDrag(off, from, to, 3)).toBeCloseTo(-10, 6);
    expect(turnOfDrag(off, from, to, 0)).toBeCloseTo(-8, 6);
  });

  test("within 3° of east, south or west it snaps square too", () => {
    const from = { x: 0, y: 31 };
    const to = { x: -31 * Math.sin((88 * Math.PI) / 180), y: 31 * Math.cos((88 * Math.PI) / 180) };

    expect(turnOfDrag(ROOF, from, to, 3)).toBeCloseTo(90, 6);
  });

  test("a turn past half a circle is the shorter way round", () => {
    expect(turnOfDrag(ROOF, { x: -1, y: 0.01 }, { x: -1, y: -0.01 }, 0)).toBeCloseTo(1.15, 1);
  });
});

describe("the label of a lift", () => {
  test("a move says how far, east or west, then north or south", () => {
    expect(liftLabelOf({ kind: "move", by: { x: 1.6, y: -0.6 } }, ROOF, "north")).toBe("1.6 m E · 0.6 m S");
    expect(liftLabelOf({ kind: "move", by: { x: -12.04, y: 3 } }, ROOF, "north")).toBe("12.0 m W · 3.0 m N");
  });

  test("a turn says the turn, clockwise as the compass turns, and where the roof now faces", () => {
    const turned = turnedBy({ corners: ROOF, obstacles: [] }, -6).corners;

    expect(liftLabelOf({ kind: "turn", degrees: -6 }, turned, "north")).toBe("6.0° · faces 186° S");
    expect(liftLabelOf({ kind: "turn", degrees: 6 }, turnedBy({ corners: ROOF, obstacles: [] }, 6).corners, "north")).toBe("−6.0° · faces 174° S");
  });
});

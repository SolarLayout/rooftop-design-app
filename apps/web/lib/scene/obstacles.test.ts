import { describe, expect, test } from "bun:test";
import { Vector3 } from "three";
import type { Obstacle } from "../api";
import { boxMatrixOf, type XY } from "./adapter";
import { solidsOf, TRUNK_RADIUS, wordsOf } from "./obstacles";

// The obstacles of the document as solids in the engine's metres (plan/phase-05-plan.md, step 3), and
// their words for the text equivalent of the scene.

const AN_OBSTACLE: Obstacle = {
  name: "",
  kind: "box",
  x: 0,
  y: 0,
  length: 1,
  width: 1,
  rotation_deg: 0,
  diameter: 1,
  height: 1,
  thickness: 0.2,
  trunk_height: 2,
  points: [],
  auto: false,
};

const obstacle = (of: Partial<Obstacle>): Obstacle => ({ ...AN_OBSTACLE, ...of });

// The demo's six (plan/reference/demo-numbers.md).
const STAIR_ROOM = obstacle({ name: "Stair room", x: 22.5, y: 18, length: 5, width: 4, height: 3 });
const WATER_TANK = obstacle({ name: "Water tank", kind: "cylinder", x: 62, y: 24, diameter: 2.5, height: 2 });
const AC_UNITS = [70.75, 73.75, 76.75, 79.75].map((x, n) =>
  obstacle({ name: `AC unit ${n + 1}`, x, y: 3.5, length: 1.5, width: 1, height: 1.2 }),
);

const WALL = obstacle({
  name: "Wall 1",
  kind: "wall",
  points: [
    [10, 10],
    [20, 10],
    [20, 30],
  ],
  thickness: 0.3,
  height: 2.5,
});
const TREE = obstacle({ name: "Tree 1", kind: "tree", x: 95, y: 5, diameter: 4, trunk_height: 2, height: 6 });
const BUILDING = obstacle({
  name: "Building 1",
  kind: "building",
  points: [
    [100, 0],
    [108, 0],
    [108, 8],
    [100, 8],
  ],
  height: 8,
});

const FLAT = () => 0;

/** A roof that falls one metre north per ten metres, about the origin. */
const SLOPED = ([, y]: XY) => -y / 10;

describe("a box", () => {
  test("the stair room stands on the roof, its middle at half its height, its size its scale", () => {
    const solids = solidsOf(STAIR_ROOM, FLAT);
    expect(solids).toEqual([{ kind: "box", box: { x: 22.5, y: 18, length: 5, width: 4, height: 3, rotationDeg: 0, zBottom: 0 } }]);

    const [solid] = solids;
    if (solid.kind !== "box") throw new Error("not a box");
    const matrix = boxMatrixOf(solid.box);
    const at = new Vector3().setFromMatrixPosition(matrix);
    const scale = new Vector3().setFromMatrixScale(matrix);
    expect([at.x, at.y, at.z]).toEqual([22.5, 1.5, -18]);
    expect([scale.x, scale.y, scale.z]).toEqual([5, 3, 4]);
  });

  test("the four AC units are four boxes in a row along the south edge", () => {
    const boxes = AC_UNITS.flatMap((unit) => solidsOf(unit, FLAT));
    expect(boxes).toHaveLength(4);
    expect(boxes.map((solid) => (solid.kind === "box" ? [solid.box.x, solid.box.y] : null))).toEqual([
      [70.75, 3.5],
      [73.75, 3.5],
      [76.75, 3.5],
      [79.75, 3.5],
    ]);
    expect(boxes[0]).toEqual({ kind: "box", box: { x: 70.75, y: 3.5, length: 1.5, width: 1, height: 1.2, rotationDeg: 0, zBottom: 0 } });
  });

  test("a turned box keeps its turn", () => {
    const [solid] = solidsOf(obstacle({ ...STAIR_ROOM, rotation_deg: 30 }), FLAT);
    expect(solid.kind === "box" && solid.box.rotationDeg).toBe(30);
  });

  test("on a sloped roof it is lifted to the roof's height under its centre", () => {
    const [solid] = solidsOf(STAIR_ROOM, SLOPED);
    expect(solid.kind === "box" && solid.box.zBottom).toBeCloseTo(-1.8);
  });
});

describe("a cylinder", () => {
  test("the water tank is a cylinder of its radius at its centre, on the roof", () => {
    expect(solidsOf(WATER_TANK, FLAT)).toEqual([
      { kind: "cylinder", x: 62, y: 24, radius: 1.25, zBottom: 0, height: 2, look: "obstacle" },
    ]);
  });

  test("on a sloped roof it stands at the roof's height under its centre", () => {
    const [solid] = solidsOf(WATER_TANK, SLOPED);
    expect(solid.kind === "cylinder" && solid.zBottom).toBeCloseTo(-2.4);
  });
});

describe("a wall", () => {
  test("three points give two boxes, each along its segment, as wide as the wall is thick", () => {
    const solids = solidsOf(WALL, FLAT);
    expect(solids).toEqual([
      { kind: "box", box: { x: 15, y: 10, length: 10, width: 0.3, height: 2.5, rotationDeg: 0, zBottom: 0 } },
      { kind: "box", box: { x: 20, y: 20, length: 20, width: 0.3, height: 2.5, rotationDeg: 90, zBottom: 0 } },
    ]);
  });

  test("a segment going south-west turns the other way", () => {
    const [solid] = solidsOf(
      obstacle({
        ...WALL,
        points: [
          [10, 10],
          [0, 0],
        ],
      }),
      FLAT,
    );
    expect(solid.kind === "box" && solid.box.rotationDeg).toBeCloseTo(-135);
    expect(solid.kind === "box" && solid.box.length).toBeCloseTo(Math.hypot(10, 10));
  });

  test("each segment stands at the roof's height under its middle", () => {
    const [, second] = solidsOf(WALL, SLOPED);
    expect(second.kind === "box" && second.box.zBottom).toBeCloseTo(-2);
  });

  test("a single point is no wall", () => {
    expect(solidsOf(obstacle({ ...WALL, points: [[1, 1]] }), FLAT)).toEqual([]);
  });
});

describe("a tree", () => {
  test("is a trunk from the roof to where the crown starts, and a crown from there to its top", () => {
    expect(solidsOf(TREE, FLAT)).toEqual([
      { kind: "cylinder", x: 95, y: 5, radius: TRUNK_RADIUS, zBottom: 0, height: 2, look: "trunk" },
      { kind: "cylinder", x: 95, y: 5, radius: 2, zBottom: 2, height: 4, look: "crown" },
    ]);
    expect(TRUNK_RADIUS).toBe(0.15);
  });

  test("on a sloped roof both parts rise with the roof under the tree", () => {
    const [trunk, crown] = solidsOf(TREE, SLOPED);
    expect(trunk.kind === "cylinder" && trunk.zBottom).toBeCloseTo(-0.5);
    expect(crown.kind === "cylinder" && crown.zBottom).toBeCloseTo(1.5);
  });
});

describe("a building", () => {
  test("is a prism of its outline, as high as it is", () => {
    expect(solidsOf(BUILDING, FLAT)).toEqual([
      {
        kind: "prism",
        points: [
          [100, 0],
          [108, 0],
          [108, 8],
          [100, 8],
        ],
        zBottom: 0,
        height: 8,
      },
    ]);
  });

  test("on a sloped roof it stands at the roof's height under its centroid", () => {
    const [solid] = solidsOf(BUILDING, SLOPED);
    expect(solid.kind === "prism" && solid.zBottom).toBeCloseTo(-0.4);
  });

  test("fewer than three points is no building", () => {
    expect(
      solidsOf(
        obstacle({
          ...BUILDING,
          points: [
            [0, 0],
            [1, 1],
          ],
        }),
        FLAT,
      ),
    ).toEqual([]);
  });
});

test("what the engine added itself is skipped: the scene draws the parapet from the roof", () => {
  const parapet = obstacle({
    name: "Parapet 1",
    kind: "wall",
    points: [
      [0.1, 0.1],
      [89.9, 0.1],
    ],
    height: 0.9,
    auto: true,
  });
  expect(solidsOf(parapet, FLAT)).toEqual([]);
});

describe("the words of an obstacle", () => {
  test.each<[Obstacle, string]>([
    [STAIR_ROOM, "Stair room, box 5.0 × 4.0 m, 3.0 m high"],
    [WATER_TANK, "Water tank, tank ⌀ 2.5 m, 2.0 m high"],
    [AC_UNITS[0], "AC unit 1, box 1.5 × 1.0 m, 1.2 m high"],
    [WALL, "Wall 1, wall 30.0 m long, 2.5 m high"],
    [TREE, "Tree 1, tree, crown ⌀ 4.0 m, 6.0 m high"],
    [BUILDING, "Building 1, building 64 m², 8.0 m high"],
  ])("%o", (of, words) => {
    expect(wordsOf(of)).toBe(words);
  });

  test("an area is rounded to the metre, a length to a tenth", () => {
    expect(wordsOf(obstacle({ ...BUILDING, points: [[0, 0], [10.5, 0], [10.5, 10.5], [0, 10.5]] }))).toBe(
      "Building 1, building 110 m², 8.0 m high",
    );
    expect(wordsOf(obstacle({ ...STAIR_ROOM, length: 5.04, width: 3.96 }))).toBe("Stair room, box 5.0 × 4.0 m, 3.0 m high");
  });
});

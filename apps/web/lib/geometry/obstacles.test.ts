import { describe, expect, test } from "bun:test";
import { Vector3 } from "three";
import type { Obstacle } from "../api";
import { boxMatrixOf, type XY } from "./adapter";
import { anchorOfObstacle, calloutOfObstacle, footprintOf, solidsOf, TRUNK_RADIUS, wordsOf } from "./obstacles";

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
    [WATER_TANK, "Water tank, tank 2.5 m across, 2.0 m high"],
    [AC_UNITS[0], "AC unit 1, box 1.5 × 1.0 m, 1.2 m high"],
    [WALL, "Wall 1, wall 30.0 m long, 2.5 m high"],
    [TREE, "Tree 1, tree, crown 4.0 m across, 6.0 m high"],
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

// The callout of the selected obstacle and of a draft (the boards "Obstacle edited on the roof" and "Import
// with missing heights"), and where it is hung: the top of the obstacle at its centre.
describe("the callout of an obstacle", () => {
  test("selected: its name, then its size and its height, and that a drag moves it (the board \"Obstacle edited on the roof\")", () => {
    expect(calloutOfObstacle(STAIR_ROOM, "selected")).toEqual({ title: "Stair room · selected", detail: "5.0 × 4.0 m · 3.0 m high. Drag to move it." });
    expect(calloutOfObstacle(WATER_TANK, "selected")).toEqual({ title: "Water tank · selected", detail: "2.5 m across · 2.0 m high. Drag to move it." });
  });

  test("a wall or a building is moved by its points in the list, not by a drag: the callout says so", () => {
    expect(calloutOfObstacle(WALL, "selected").detail).toBe("30.0 m long · 2.5 m high. Move it by its points in the list.");
    expect(calloutOfObstacle(BUILDING, "selected").detail).toBe("64 m² · 8.0 m high. Move it by its points in the list.");
  });

  test("a tree: its crown from where it starts to its height", () => {
    expect(calloutOfObstacle(TREE, "selected")).toEqual({ title: "Tree 1 · selected", detail: "crown 4.0 m across · 2.0 to 6.0 m high. Drag to move it." });
  });

  test("to review: the height is said to be waited for", () => {
    expect(calloutOfObstacle(STAIR_ROOM, "to-review")).toEqual({ title: "Stair room · selected", detail: "5.0 × 4.0 m · height to review" });
  });

  test("a draft: its size, and no height yet", () => {
    const draft = { ...STAIR_ROOM, name: "Box 7", length: 2, width: 2, height: null };
    expect(calloutOfObstacle(draft, "draft")).toEqual({ title: "Box 7 · draft", detail: "2.0 × 2.0 m · no height yet" });
  });

  test("is hung at the middle of the east edge of the obstacle's top, clear of the height handle; a wall half way along it, a building over its centroid; a draft at the roof, over its centre", () => {
    expect(anchorOfObstacle(STAIR_ROOM, FLAT)).toEqual([25, 18, 3]);
    expect(anchorOfObstacle(STAIR_ROOM, SLOPED)).toEqual([25, 18, 3 - 1.8]);
    expect(anchorOfObstacle({ ...STAIR_ROOM, rotation_deg: 90 }, FLAT).map((value) => Number(value.toFixed(6)))).toEqual([22.5, 20.5, 3]);
    expect(anchorOfObstacle(WATER_TANK, FLAT)).toEqual([63.25, 24, 2]);
    expect(anchorOfObstacle(TREE, FLAT)).toEqual([97, 5, 6]);
    expect(anchorOfObstacle(WALL, FLAT)).toEqual([20, 15, 2.5]);
    expect(anchorOfObstacle(BUILDING, FLAT)).toEqual([104, 4, 8]);
    expect(anchorOfObstacle({ ...STAIR_ROOM, height: null }, FLAT)).toEqual([22.5, 18, 0]);
  });
});

// The footprint of a draft, drawn dashed on the roof before it has a height (decision 15).
describe("the footprint of an obstacle", () => {
  test("a box: its four corners, turned about its centre", () => {
    const { points, closed } = footprintOf(STAIR_ROOM);
    expect(closed).toBe(true);
    expect(points.map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))])).toEqual([
      [20, 16],
      [25, 16],
      [25, 20],
      [20, 20],
    ]);
    const turned = footprintOf({ ...STAIR_ROOM, rotation_deg: 90 }).points.map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))]);
    expect(turned).toEqual([
      [24.5, 15.5],
      [24.5, 20.5],
      [20.5, 20.5],
      [20.5, 15.5],
    ]);
  });

  test("a tank and a tree: a circle of the diameter", () => {
    const { points, closed } = footprintOf(WATER_TANK);
    expect(closed).toBe(true);
    expect(points).toHaveLength(24);
    points.forEach(([x, y]) => expect(Math.hypot(x - 62, y - 24)).toBeCloseTo(1.25));
    expect(footprintOf(TREE).points.every(([x, y]) => Math.abs(Math.hypot(x - 95, y - 5) - 2) < 1e-9)).toBe(true);
  });

  test("a wall: its points, open; a building: its points, closed", () => {
    expect(footprintOf(WALL)).toEqual({ points: WALL.points, closed: false });
    expect(footprintOf(BUILDING)).toEqual({ points: BUILDING.points, closed: true });
  });
});

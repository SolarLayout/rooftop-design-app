import { describe, expect, test } from "bun:test";
import type { Obstacle } from "../api";
import { factsOf, fieldsOfObstacle, newObstacleOf, OBSTACLE_KINDS, withObstacleField } from "./obstacle-fields";

// The obstacles of the Roof lens (plan/phase-05-plan.md, step 12, decision 15; the board "Obstacle edited
// on the roof"): the fields of each kind from plan/reference/functional-inventory.md, 1.2, and what a new
// one is.

const box = (over: Partial<Obstacle> = {}): Obstacle => ({
  name: "Stair room",
  kind: "box",
  x: 22.5,
  y: 18,
  length: 5,
  width: 4,
  rotation_deg: 0,
  diameter: 1,
  height: 3,
  thickness: 0.2,
  trunk_height: 2,
  points: [],
  auto: false,
  ...over,
});

describe("the fields of an obstacle", () => {
  test("a box: its sides, its height, its turn, where it stands", () => {
    expect(fieldsOfObstacle(box()).map((field) => [field.id, field.label, field.value, field.unit])).toEqual([
      ["length", "Length", 5, "m"],
      ["width", "Width", 4, "m"],
      ["height", "Height", 3, "m"],
      ["rotation_deg", "Rotation", 0, "°"],
      ["x", "East", 22.5, "m"],
      ["y", "North", 18, "m"],
    ]);
  });

  test("a tank: its diameter, its height, where it stands", () => {
    expect(fieldsOfObstacle(box({ kind: "cylinder", diameter: 2.5, height: 2 })).map((field) => field.id)).toEqual(["diameter", "height", "x", "y"]);
  });

  test("a tree: its crown, its height, where the crown starts, where it stands", () => {
    const fields = fieldsOfObstacle(box({ kind: "tree", diameter: 4, height: 6, trunk_height: 2 }));
    expect(fields.map((field) => [field.id, field.label])).toEqual([
      ["diameter", "Crown ⌀"],
      ["height", "Height"],
      ["trunk_height", "Crown starts at"],
      ["x", "East"],
      ["y", "North"],
    ]);
  });

  test("a wall: its height and its thickness; its points are a table of their own", () => {
    expect(fieldsOfObstacle(box({ kind: "wall", points: [[0, 0], [12, 0]] })).map((field) => field.id)).toEqual(["height", "thickness"]);
  });

  test("a building: its height alone; its points are a table of their own", () => {
    expect(fieldsOfObstacle(box({ kind: "building", points: [[0, 0], [8, 0], [8, 8]] })).map((field) => field.id)).toEqual(["height"]);
  });

  test("the ranges are the inventory's", () => {
    const of = (obstacle: Obstacle, id: string) => fieldsOfObstacle(obstacle).find((field) => field.id === id)?.range;
    expect(of(box(), "length")).toEqual({ min: 0.1, max: 500, decimals: 2 });
    expect(of(box(), "rotation_deg")).toEqual({ min: -180, max: 180, decimals: 0 });
    expect(of(box(), "height")).toEqual({ min: 0.05, max: 200, decimals: 2 });
    expect(of(box(), "x")).toEqual({ min: -5000, max: 5000, decimals: 2 });
    expect(of(box({ kind: "tree" }), "diameter")).toEqual({ min: 0.1, max: 100, decimals: 2 });
    expect(of(box({ kind: "tree" }), "trunk_height")).toEqual({ min: 0, max: 100, decimals: 2 });
    expect(of(box({ kind: "wall" }), "thickness")).toEqual({ min: 0.05, max: 5, decimals: 2 });
  });
});

describe("a new obstacle", () => {
  test("stands at the centre of the roof with the inventory's sizes, named by its kind and its count, without a height", () => {
    const fresh = newObstacleOf("box", [45, 20], [box(), box({ name: "Box 2", kind: "box" }), box({ kind: "cylinder" })]);
    expect(fresh).toMatchObject({ name: "Box 3", kind: "box", x: 45, y: 20, length: 2, width: 2, rotation_deg: 0 });
    expect(fresh.height).toBeNull();
  });

  test("a tank is 2 m wide, a tree's crown 4 m from 2 m up; a wall is 6 m long through the centre; a building a 10 m block 3 m east", () => {
    expect(newObstacleOf("cylinder", [45, 20], [])).toMatchObject({ name: "Tank 1", diameter: 2 });
    expect(newObstacleOf("tree", [45, 20], [])).toMatchObject({ name: "Tree 1", diameter: 4, trunk_height: 2 });
    expect(newObstacleOf("wall", [45, 20], [])).toMatchObject({ name: "Wall 1", thickness: 0.2, points: [[42, 20], [48, 20]] });
    expect(newObstacleOf("building", [45, 20], []).points).toEqual([
      [48, 15],
      [58, 15],
      [58, 25],
      [48, 25],
    ]);
  });

  test("counts only the kind's own, not what the engine added itself", () => {
    expect(newObstacleOf("box", [0, 0], [box({ auto: true }), box({ kind: "wall" })]).name).toBe("Box 1");
  });

  test("the kinds, in the order of the menu, with the word of each", () => {
    expect(OBSTACLE_KINDS.map((kind) => [kind.id, kind.word])).toEqual([
      ["box", "Box"],
      ["cylinder", "Tank"],
      ["wall", "Wall"],
      ["tree", "Tree"],
      ["building", "Building"],
    ]);
  });
});

describe("the facts of an obstacle in its row", () => {
  test("a box by its sides and its height, a tank by its diameter, a wall by its length, a building by its area, a tree by its crown", () => {
    expect(factsOf(box())).toBe("5.0 × 4.0 · h 3.0 m");
    expect(factsOf(box({ kind: "cylinder", diameter: 2.5, height: 2 }))).toBe("⌀ 2.5 · h 2.0 m");
    expect(factsOf(box({ kind: "wall", height: 0.8, points: [[0, 0], [12, 0], [12, 6]] }))).toBe("18.0 m · h 0.8 m");
    expect(factsOf(box({ kind: "building", height: 8, points: [[0, 0], [8, 0], [8, 8], [0, 8]] }))).toBe("64 m² · h 8.0 m");
    expect(factsOf(box({ kind: "tree", diameter: 4, height: 6 }))).toBe("crown ⌀ 4.0 · h 6.0 m");
  });
});

describe("the edit a field makes", () => {
  test("sets the value and leaves the rest", () => {
    const after = withObstacleField(box(), "x", 27.5);
    expect(after.x).toBe(27.5);
    expect(after.name).toBe("Stair room");
    expect(withObstacleField(box(), "x", 22.5)).toEqual(box());
  });
});

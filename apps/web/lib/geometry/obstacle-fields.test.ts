import { describe, expect, test } from "bun:test";
import type { Obstacle } from "../api";
import type { Project, Roof } from "../api";
import { type DraftObstacle, FEWEST_POINTS, heightToAdd, fieldsOfObstacle, newObstacleOf, OBSTACLE_KINDS, withDraftAt, withObstacleAdded, withObstacleAt, withObstacleField, withObstacleReplaced, withoutObstacleAt, withPoint, withPointAdded, withPointRemoved } from "./obstacle-fields";

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
      ["height", "Height above the roof", 3, "m"],
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
      ["diameter", "Crown diameter"],
      ["height", "Height above the roof"],
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

describe("the edit a field makes", () => {
  test("sets the value and leaves the rest", () => {
    const after = withObstacleField(box(), "x", 27.5);
    expect(after.x).toBe(27.5);
    expect(after.name).toBe("Stair room");
    expect(withObstacleField(box(), "x", 22.5)).toEqual(box());
  });
});

describe("the points of a wall and of a building", () => {
  const wall = box({ kind: "wall", points: [[0, 0], [6, 0]] });
  const building = box({ kind: "building", points: [[0, 0], [8, 0], [8, 8]] });

  test("a wall keeps two at least, a building three", () => {
    expect(FEWEST_POINTS).toEqual({ wall: 2, building: 3 });
  });

  test("a point is moved; the same point is the same obstacle", () => {
    expect(withPoint(wall, 1, [7, 1]).points).toEqual([[0, 0], [7, 1]]);
    expect(withPoint(wall, 1, [6, 0])).toBe(wall);
  });

  test("a wall's new point goes on along its last segment; a building's at the middle of its closing edge", () => {
    expect(withPointAdded(wall).points).toEqual([[0, 0], [6, 0], [12, 0]]);
    expect(withPointAdded(building).points).toEqual([[0, 0], [8, 0], [8, 8], [4, 4]]);
  });

  test("a point is removed, down to the fewest; the fewest stay", () => {
    expect(withPointRemoved(withPointAdded(building), 1).points).toEqual([[0, 0], [8, 8], [4, 4]]);
    expect(withPointRemoved(building, 1)).toBe(building);
    expect(withPointRemoved(wall, 0)).toBe(wall);
    expect(withPointRemoved(withPointAdded(wall), 0).points).toEqual([[6, 0], [12, 0]]);
  });
});

describe("the obstacles of the roof", () => {
  const roof = { obstacles: [box(), box({ name: "Water tank", kind: "cylinder" })] } as Roof;

  test("one is replaced at its index; the same one is the same roof", () => {
    const moved = withObstacleField(roof.obstacles[0], "x", 27.5);
    expect(withObstacleAt(roof, 0, moved).obstacles).toEqual([moved, roof.obstacles[1]]);
    expect(withObstacleAt(roof, 0, roof.obstacles[0])).toBe(roof);
  });

  test("one is taken away at its index", () => {
    expect(withoutObstacleAt(roof, 0).obstacles).toEqual([roof.obstacles[1]]);
  });

  test("the design with one replaced: one edit of the drop of a drag; the same one is the same design", () => {
    const design = { name: "A roof", roof } as Project;
    const moved = withObstacleField(roof.obstacles[0], "x", 27.5);
    const after = withObstacleReplaced(design, 0, moved);
    expect(after.roof.obstacles[0]).toBe(moved);
    expect(after.name).toBe("A roof");
    expect(withObstacleReplaced(design, 0, roof.obstacles[0])).toBe(design);
  });

  test("a draft joins the roof with its height, at the end", () => {
    const draft = newObstacleOf("tree", [45, 20], roof.obstacles);
    const after = withObstacleAdded(roof, draft, 6);
    expect(after.obstacles).toHaveLength(3);
    expect(after.obstacles[2]).toMatchObject({ name: "Tree 1", kind: "tree", height: 6, trunk_height: 2, diameter: 4 });
  });
});

// Add, then a tap on the roof places the draft where the tap was (plan step 19; components.md, "Obstacles on
// the roof"): a box, a tank or a tree by its centre; a wall or a building by moving its points along.
describe("the draft placed where the roof was tapped", () => {
  test("a box, a tank or a tree stands at the tap", () => {
    const box = newObstacleOf("box", [45, 20], []);
    expect(withDraftAt(box, [22.5, 18])).toMatchObject({ x: 22.5, y: 18, length: 2, width: 2 });
    expect(withDraftAt(newObstacleOf("tree", [45, 20], []), [10, 34])).toMatchObject({ x: 10, y: 34, diameter: 4 });
  });

  test("a wall or a building moves its points by as much as its centre moves", () => {
    const wall = newObstacleOf("wall", [45, 20], []);
    expect(withDraftAt(wall, [47, 25])).toMatchObject({ x: 47, y: 25, points: [[44, 25], [50, 25]] });
    const building = newObstacleOf("building", [45, 20], []);
    expect(withDraftAt(building, [46, 21]).points).toEqual([[49, 16], [59, 16], [59, 26], [49, 26]]);
  });

  test("the same place is the same draft", () => {
    const box = newObstacleOf("box", [45, 20], []);
    expect(withDraftAt(box, [45, 20])).toBe(box);
  });
});

// #179, item 30: a new obstacle is added by Add (or Enter), with the height its field holds; a height committed by
// leaving the field only fills the draft.
describe("a new obstacle, added with its height", () => {
  const draft: DraftObstacle = { ...newObstacleOf("box", [0, 0], []), height: null };

  test("a draft without a height cannot be added", () => {
    expect(heightToAdd(draft)).toBeNull();
    expect(heightToAdd(null)).toBeNull();
  });

  test("the height typed into the draft is the one it is added with", () => {
    const typed = withObstacleField(draft, "height", 2.5);
    expect(typed.height).toBe(2.5);
    expect(heightToAdd(typed)).toBe(2.5);
  });
});

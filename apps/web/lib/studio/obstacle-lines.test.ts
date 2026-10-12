import { describe, expect, test } from "bun:test";
import type { Obstacle } from "../api";
import { obstacleLinesOf } from "./obstacle-lines";

// The obstacles of the Roof step, one line each in words (V2 · 7, D103; the board "The Roof and Array steps"): the name,
// then what it is, how big and how high; the same ones counted together until one of them is selected.

const base = { name: "", kind: "box", x: 0, y: 0, length: 1.5, width: 1, rotation_deg: 0, diameter: 2, height: 1.2, thickness: 0.2, trunk_height: 2, points: [], auto: false } as unknown as Obstacle;
const box = (name: string, change: Partial<Obstacle> = {}): Obstacle => ({ ...base, name, ...change }) as Obstacle;
const STAIR = box("Stair room", { length: 5, width: 4, height: 3 });
const TANK = box("Water tank", { kind: "cylinder", diameter: 2.5, height: 2 });
const ACS = [1, 2, 3, 4].map((n) => box(`AC unit ${n}`));
const OBSTACLES = [STAIR, TANK, ...ACS];

describe("the lines of the obstacles", () => {
  test("one line each, the name and then its kind, size and height in words", () => {
    const lines = obstacleLinesOf([STAIR, TANK], { selected: null });

    expect(lines.map((line) => [line.title, line.detail])).toEqual([
      ["Stair room", "Box · 5.0 × 4.0 m · 3.0 m high"],
      ["Water tank", "Tank · 2.5 m across · 2.0 m high"],
    ]);
  });

  test("those of one kind, size and height are counted in one line: AC units · 4 boxes", () => {
    const lines = obstacleLinesOf(OBSTACLES, { selected: null });

    expect(lines.map((line) => [line.title, line.detail, line.indexes])).toEqual([
      ["Stair room", "Box · 5.0 × 4.0 m · 3.0 m high", [0]],
      ["Water tank", "Tank · 2.5 m across · 2.0 m high", [1]],
      ["AC units", "4 boxes · 1.5 × 1.0 m · 1.2 m high", [2, 3, 4, 5]],
    ]);
  });

  test("once one of them is selected they stand apart, so that it can be told from the others", () => {
    const lines = obstacleLinesOf(OBSTACLES, { selected: 3 });

    expect(lines.map((line) => line.title)).toEqual(["Stair room", "Water tank", "AC unit 1", "AC unit 2", "AC unit 3", "AC unit 4"]);
  });

  test("a tree, a wall and a building by what they are", () => {
    const lines = obstacleLinesOf(
      [
        box("Neem", { kind: "tree", diameter: 4, height: 8 }),
        box("Boundary", { kind: "wall", points: [[0, 0], [12, 0]] as never, height: 2 }),
        box("Next door", { kind: "building", points: [[0, 0], [10, 0], [10, 12], [0, 12]] as never, height: 15 }),
      ],
      { selected: null },
    );

    expect(lines.map((line) => line.detail)).toEqual(["Tree · crown 4.0 m across · 8.0 m high", "Wall · 12.0 m long · 2.0 m high", "Building · 120 m² · 15.0 m high"]);
  });

  test("a height still to be typed is said so", () => {
    expect(obstacleLinesOf([box("Vent", { height: null as never })], { selected: null })[0]?.detail).toBe("Box · 1.5 × 1.0 m · height to review");
  });

  test("the obstacles the app made for itself are no line", () => {
    expect(obstacleLinesOf([box("Parapet", { auto: true }), STAIR], { selected: null }).map((line) => line.title)).toEqual(["Stair room"]);
  });
});

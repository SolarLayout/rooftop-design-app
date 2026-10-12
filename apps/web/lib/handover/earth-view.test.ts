import { describe, expect, test } from "bun:test";
import type { Obstacle } from "../api";
import { earthViewOf, formatG } from "./earth-view";
import { A, D, DEMO, DOCUMENT } from "./test-fixtures";

// The Google Earth model's preview (plan/phase-09-plan.md, step 19, decision 8; the board "Handover, previews"): what is in
// the file, in the KML's own names as the engine writes them; what is not, in the board's words.

const AT_REST = { document: DOCUMENT, design: DEMO, option: A } as const;
const named = (rows: { name: string; words: string }[]) => rows.map((row) => [row.name, row.words]);

describe("in the file, for the demo's option A", () => {
  test("the roof, each obstacle as the KML names it with its height, the modules used by count", () => {
    const view = earthViewOf(AT_REST);

    expect(named(view.inside)).toEqual([
      ["Roof", "the outline"],
      ["Stair room h=3", "the box's footprint, its height in the name"],
      ["Water tank h=2", "the tank's footprint, its height in the name"],
      ["AC unit 1 h=1.2", "the box's footprint, its height in the name"],
      ["AC unit 2 h=1.2", "the box's footprint, its height in the name"],
      ["AC unit 3 h=1.2", "the box's footprint, its height in the name"],
      ["AC unit 4 h=1.2", "the box's footprint, its height in the name"],
      ["Modules (638)", "the positions used, one by one"],
    ]);
  });

  test("a wall, a tree and a building are named by their kind; a cylinder is a tank", () => {
    const kinds = (["wall", "tree", "building", "cylinder"] as const).map((kind, index) => ({ name: `O${index}`, kind, height: 2 }) as Obstacle);
    const view = earthViewOf({ ...AT_REST, document: { ...DOCUMENT, roof: { ...DOCUMENT.roof, obstacles: kinds } } });

    expect(view.inside.slice(1, 5).map((row) => row.words)).toEqual([
      "the wall's footprint, its height in the name",
      "the tree's footprint, its height in the name",
      "the building's footprint, its height in the name",
      "the tank's footprint, its height in the name",
    ]);
  });

  test("another option's modules", () => {
    expect(named(earthViewOf({ ...AT_REST, option: D }).inside).at(-1)).toEqual(["Modules (702)", "the positions used, one by one"]);
  });
});

describe("what the file does not draw (V2 · 9, audit V2-93)", () => {
  test("one line: the heights are in the names", () => {
    expect(earthViewOf(AT_REST).flat).toBe("Heights are in the names; Google Earth draws the shapes flat.");
  });
});

describe("a height as the engine's KML writes it (Python's :g, six significant digits)", () => {
  test("whole metres without a decimal, fractions as they are", () => {
    expect(formatG(3)).toBe("3");
    expect(formatG(2.0)).toBe("2");
    expect(formatG(1.2)).toBe("1.2");
    expect(formatG(0.5)).toBe("0.5");
    expect(formatG(12.75)).toBe("12.75");
  });

  test("six significant digits, the trailing zeros dropped", () => {
    expect(formatG(1234.5678)).toBe("1234.57");
    expect(formatG(0.1 + 0.2)).toBe("0.3");
    expect(formatG(1.0000001)).toBe("1");
  });

  test("very small and very large values take the exponent, as Python writes it", () => {
    expect(formatG(0.00012)).toBe("0.00012");
    expect(formatG(0.00001)).toBe("1e-05");
    expect(formatG(1234567)).toBe("1.23457e+06");
    expect(formatG(0)).toBe("0");
    expect(formatG(-2.5)).toBe("-2.5");
  });
});

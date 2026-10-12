import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { HEIGHTS, RADII, SPACES, TYPE_STYLES } from "./principles-data";

// The kit's specimen of V2's principles (D94) shows every type style of the stylesheet and nothing else, the seven
// spaces, the three heights and the four radii.

const css = readFileSync(path.resolve(import.meta.dir, "../../app/globals.css"), "utf8");

describe("the kit's principles", () => {
  test("every type style of the stylesheet is shown, once", () => {
    const utilities = [...css.matchAll(/^@utility type-([a-z-]+) \{/gm)].map(([, name]) => name).sort();
    expect(TYPE_STYLES.map((style) => style.name).sort()).toEqual(utilities);
  });

  test("the spacing is seven steps, the heights three, the radii four", () => {
    expect(SPACES.map((space) => space.px)).toEqual([4, 8, 12, 16, 24, 40, 64]);
    expect(HEIGHTS.map((height) => height.desktop)).toEqual([32, 40, 48]);
    expect(RADII.map((radius) => radius.name)).toEqual(["control", "row", "card", "panel"]);
  });
});

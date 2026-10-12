import { describe, expect, test } from "bun:test";
import { SECTION } from "./section-look";

describe("the heading of a section in an input panel (D94: D76 reversed)", () => {
  test("is the section style in the primary text: 16, weight 600, sentence case, no glow, no line", () => {
    const classes = SECTION.split(" ");
    expect(classes).toEqual(expect.arrayContaining(["type-section", "text-text"]));
    expect(classes.filter((name) => /uppercase|glow|heading|accent|border/.test(name))).toEqual([]);
  });
});

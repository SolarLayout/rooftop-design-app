import { describe, expect, test } from "bun:test";
import { SECTION } from "./section-look";

describe("the heading of a section in an input panel", () => {
  test("is in the heading's colour, at 600, uppercase, with its glow and no line", () => {
    const classes = SECTION.split(" ");
    expect(classes).toEqual(expect.arrayContaining(["type-section", "font-semibold", "text-heading", "uppercase", "heading-glow"]));
    expect(classes.some((name) => name.startsWith("border"))).toBe(false);
  });
});

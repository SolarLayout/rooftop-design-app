import { describe, expect, test } from "bun:test";
import { SECTION, SECTION_LINE, SECTION_TEXT } from "./section-look";

describe("the heading of a section in an input panel", () => {
  test("is in the heading's colour, at 600, uppercase, over its line", () => {
    expect(SECTION_TEXT.split(" ")).toEqual(expect.arrayContaining(["type-section", "font-semibold", "text-heading", "uppercase"]));
    expect(SECTION_LINE.split(" ")).toEqual(expect.arrayContaining(["border-b", "border-heading-line"]));
    expect(SECTION).toBe(`${SECTION_TEXT} ${SECTION_LINE}`);
  });
});

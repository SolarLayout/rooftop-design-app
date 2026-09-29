import { describe, expect, test } from "bun:test";
import { isLens, LENSES } from "./routes";

describe("the lenses of the Studio", () => {
  test("four, in the order of the work", () => {
    expect(LENSES.map((lens) => lens.id)).toEqual(["roof", "array", "sun", "strings"]);
    expect(LENSES.map((lens) => lens.name)).toEqual(["Roof", "Array", "Sun", "Strings"]);
  });

  test.each(["roof", "array", "sun", "strings"])("%s is a lens", (id) => {
    expect(isLens(id)).toBe(true);
  });

  test.each(["", "Roof", "energy", "roof/", "constructor"])("'%s' is none", (id) => {
    expect(isLens(id)).toBe(false);
  });
});

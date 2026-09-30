import { describe, expect, test } from "bun:test";
import { placeInShort } from "./place";

// The place of a design beside its name, as the top bar has it: "18.52° N · 73.86° E".

describe("the place of a design, in short", () => {
  test("two decimals, the degree sign without a space, north and east", () => {
    expect(placeInShort(18.52, 73.86)).toBe("18.52° N · 73.86° E");
  });

  test("south and west are said in words, not by a sign", () => {
    expect(placeInShort(-33.8688, -70.6693)).toBe("33.87° S · 70.67° W");
  });

  test("on the equator and on the prime meridian it is north and east", () => {
    expect(placeInShort(0, 0)).toBe("0.00° N · 0.00° E");
  });

  test("what rounds to nothing has no side of its own", () => {
    expect(placeInShort(-0.001, -0.004)).toBe("0.00° N · 0.00° E");
  });
});

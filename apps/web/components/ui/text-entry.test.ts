import { describe, expect, test } from "bun:test";
import { committedText } from "./text-entry";

// The words of a text field (docs/design/components.md, "Text field"): trimmed, the empty refused in the caller's words, cut
// to the length the field has room for.
const NAME = { maxLength: 200, needed: "A name is needed" };

describe("what Enter or leaving the field makes of the draft", () => {
  test("the words, trimmed", () => {
    expect(committedText("  Pune demo roof, block B  ", "Pune demo roof", NAME)).toEqual({ value: "Pune demo roof, block B", said: null });
  });

  test("an empty or blank entry gives the value of before back and says why, in the caller's words", () => {
    expect(committedText("", "Pune demo roof", NAME)).toEqual({ value: "Pune demo roof", said: "A name is needed" });
    expect(committedText("   ", "Pune demo roof", NAME)).toEqual({ value: "Pune demo roof", said: "A name is needed" });
  });

  test("what is longer than the field has room for is cut", () => {
    expect(committedText("a".repeat(250), "", NAME).value).toBe("a".repeat(200));
    expect(committedText(` ${"b".repeat(5)} `, "", { maxLength: 3, needed: "Needed" })).toEqual({ value: "bbb", said: null });
  });

  test("the same words as before are the same value, and nothing is said", () => {
    expect(committedText("Pune demo roof", "Pune demo roof", NAME)).toEqual({ value: "Pune demo roof", said: null });
  });
});

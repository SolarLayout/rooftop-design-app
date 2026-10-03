import { describe, expect, test } from "bun:test";
import { committedText } from "../../components/ui/text-entry";
import { NAME_RULES, withName } from "./name-field";
import { DOCUMENT } from "./test-fixtures";

// The name of the design as an edit (plan/phase-09-plan.md, decision 13): trimmed, 200 characters at most, never empty.
describe("the rules of the name", () => {
  test("trimmed", () => {
    expect(committedText("  Block B ", "Pune demo roof", NAME_RULES)).toEqual({ value: "Block B", said: null });
  });

  test("200 at most, as the API's Project.name", () => {
    expect(committedText("n".repeat(201), "Pune demo roof", NAME_RULES).value).toHaveLength(200);
  });

  test("the empty refused with \"A name is needed\"", () => {
    expect(committedText(" ", "Pune demo roof", NAME_RULES)).toEqual({ value: "Pune demo roof", said: "A name is needed" });
  });
});

describe("the edit", () => {
  test("gives a new document with the name, and leaves the old as it was", () => {
    const after = withName(DOCUMENT, "Block B");

    expect(after.name).toBe("Block B");
    expect(after).not.toBe(DOCUMENT);
    expect(DOCUMENT.name).toBe("Pune demo roof");
    expect({ ...after, name: DOCUMENT.name }).toEqual(DOCUMENT);
  });

  test("the same name is the same document: nothing is committed", () => {
    expect(withName(DOCUMENT, "Pune demo roof")).toBe(DOCUMENT);
  });
});

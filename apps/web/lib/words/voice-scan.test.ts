import { describe, expect, test } from "bun:test";
import { findingsOf, stringsOf } from "./voice-scan";

describe("what the voice finds (V2 · 12, D108)", () => {
  test("a word that never appears, whole, any case", () => {
    expect(findingsOf("The engine's shadows").map((one) => one.why)).toEqual(['never "engine"']);
    expect(findingsOf("Engineering")).toEqual([]);
    expect(findingsOf("Edited just now").map((one) => one.why)).toEqual(['never "just"']);
  });

  test("an old name of board 12, and a count said with (s)", () => {
    expect(findingsOf("Enter dimensions by hand").map((one) => one.why)).toEqual(['the old name "Enter dimensions by hand"']);
    expect(findingsOf("1 inverter(s)").map((one) => one.why)).toEqual(['no "(s)": say the count']);
  });

  test("no \"every\": the owner's word (2026-10-13); the field Walkway every keeps its label", () => {
    expect(findingsOf("Every position used")).toEqual([{ said: "Every position used", why: 'no "every": say "each", "all" or the number' }]);
    expect(findingsOf("Walkway every")).toEqual([]);
    expect(findingsOf("A walkway every 24 modules")).toEqual([{ said: "A walkway every 24 modules", why: 'no "every": say "each", "all" or the number' }]);
  });

  test("what is right says nothing", () => {
    expect(findingsOf("Enter the roof by hand")).toEqual([]);
    expect(findingsOf("Showing the last result")).toEqual([]);
  });
});

describe("the strings a person reads in a source", () => {
  test("quoted literals and the text between tags; comments and code left out", () => {
    const source = [
      "// the engine's own words are in a comment",
      "/* so is this engine */",
      'const a = "Choose the module";',
      "const b = `${n} strings on ${m} inverters`;",
      'const c = "flex items-center";',
      "<p>Enter the roof by hand</p>",
    ].join("\n");
    expect(stringsOf(source)).toEqual(["Choose the module", "${n} strings on ${m} inverters", "flex items-center", "Enter the roof by hand"]);
  });
});

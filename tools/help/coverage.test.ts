import { describe, expect, test } from "bun:test";
import { bareHeadingsIn, headingsWithoutHelp } from "./coverage";

// The help's coverage (D80): every section heading of an input panel carries its ?.

describe("a heading without its help", () => {
  test("found in the SECTION look, alone or among other classes", () => {
    const text = ['<h2 className={SECTION}>Edges</h2>', "<SectionHeading help=\"find.section.edges\">Edges</SectionHeading>", '<h2 className={classNames("hidden", SECTION)}>Roof type</h2>'].join("\n");
    expect(bareHeadingsIn(text)).toEqual([
      { line: 1, words: "<h2 className={SECTION}>Edges</h2>" },
      { line: 3, words: '<h2 className={classNames("hidden", SECTION)}>Roof type</h2>' },
    ]);
  });
});

describe("the components", () => {
  test("every section heading of an input panel has its help, or is named with why it has none", () => {
    expect(headingsWithoutHelp()).toEqual([]);
  });
});

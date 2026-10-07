import { describe, expect, test } from "bun:test";
import { frontmatterOf } from "./frontmatter";

describe("the frontmatter of a topic", () => {
  test("read, with its lists empty when not given", () => {
    expect(frontmatterOf({ title: "Edges", summary: "The lengths of the roof's edges.", kind: "section" })).toEqual({
      ok: true,
      frontmatter: { title: "Edges", summary: "The lengths of the roof's edges.", kind: "section", related: [], aliases: [] },
    });
  });

  test("the options are keyed as text, whatever YAML made of them", () => {
    const read = frontmatterOf({ title: "System voltage", summary: "The highest DC voltage.", kind: "section", values: { 600: "At most 600 V." } });
    expect(read.ok && read.frontmatter.values).toEqual({ "600": "At most 600 V." });
  });

  test("every way it is wrong, in words", () => {
    const read = frontmatterOf({ title: "", summary: "x".repeat(141), kind: "param", colour: "red", related: "a.section.b" });
    expect(read).toEqual({
      ok: false,
      problems: ['"colour" is not a field of a topic', "title: words, 80 characters at most", "summary: words, 140 characters at most", "kind: one of section, setting, metric, deliverable, tool, concept", "related: a list of keys"],
    });
  });

  test("no frontmatter at all", () => {
    expect(frontmatterOf(null)).toEqual({ ok: false, problems: ["the frontmatter is not a set of fields"] });
  });
});

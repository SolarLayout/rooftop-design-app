import { describe, expect, test } from "bun:test";
import { brokenLinks, clashingAliases, driftedOptions, linksOf, typedNumbers } from "./checks";
import type { Topic } from "./generate";

// The gate's checks, each on topics made for it: one that passes and the ways it fails.

const topic = (key: string, change: Partial<Topic["frontmatter"]> = {}, body = ""): Topic => ({
  key,
  path: `${key.split(".").join("/")}.mdx`,
  frontmatter: { title: "T", summary: "S", kind: "section", related: [], aliases: [], ...change },
  body,
});

describe("links", () => {
  test("found in a body", () => {
    expect(linksOf('See <HelpLink k="studio.section.inverter">the inverter</HelpLink> and <HelpLink k="find.section.edges">edges</HelpLink>.')).toEqual([
      "studio.section.inverter",
      "find.section.edges",
    ]);
  });

  test("a related topic or a link to nothing is refused; an alias is a topic", () => {
    const topics = [
      topic("studio.section.a", { related: ["studio.section.b", "studio.section.gone"] }, '<HelpLink k="studio.section.old-b">b</HelpLink> <HelpLink k="studio.section.nowhere">x</HelpLink>'),
      topic("studio.section.b", { aliases: ["studio.section.old-b"] }),
    ];
    expect(brokenLinks(topics)).toEqual([
      'studio/section/a.mdx: related to "studio.section.gone", which is no topic',
      'studio/section/a.mdx: a link to "studio.section.nowhere", which is no topic',
    ]);
  });
});

describe("aliases", () => {
  test("an alias that is a key, another's, or no key is refused", () => {
    const topics = [topic("studio.section.a", { aliases: ["studio.section.b", "studio.section.old"] }), topic("studio.section.b", { aliases: ["studio.section.old", "Old"] })];
    expect(clashingAliases(topics)).toEqual([
      'studio/section/a.mdx: alias "studio.section.b" is a topic\'s key',
      'studio/section/b.mdx: alias "studio.section.old" is studio/section/a.mdx\'s too',
      'studio/section/b.mdx: alias "Old" is no key',
    ]);
  });
});

describe("typed numbers", () => {
  test("a number with its unit in the prose is refused; on-screen words in code are not", () => {
    expect(typedNumbers([topic("studio.section.a", {}, "Keep it at 600 V or less.")])).toEqual([
      'studio/section/a.mdx: "600 V" is a number typed with its unit; say it from the code, or in words',
    ]);
    expect(typedNumbers([topic("studio.section.a", {}, "Choose `1500 V` here. Three limits, the lowest of them.")])).toEqual([]);
    expect(typedNumbers([topic("studio.section.a", {}, "A 4 mm² cable, a 2.5 m tank, 30%.")])).toHaveLength(1);
  });
});

describe("options", () => {
  const optionsOf = (key: string) => (key === "studio.section.volts" ? [{ id: "600", label: "600 V" }, { id: "1500", label: "1500 V" }] : undefined);

  test("exactly the code's", () => {
    expect(driftedOptions([topic("studio.section.volts", { values: { "600": "a", "1500": "b" } })], optionsOf)).toEqual([]);
  });

  test("missing, extra, absent, or given where the code offers none", () => {
    expect(driftedOptions([topic("studio.section.volts", { values: { "600": "a", "1000": "b" } })], optionsOf)).toEqual([
      "studio/section/volts.mdx: values miss 1500, which the code offers",
      "studio/section/volts.mdx: values name 1000, which the code does not offer",
    ]);
    expect(driftedOptions([topic("studio.section.volts")], optionsOf)).toEqual(["studio/section/volts.mdx: the section offers 600, 1500; say what each means in values"]);
    expect(driftedOptions([topic("studio.section.other", { values: { a: "b" } })], optionsOf)).toEqual([
      "studio/section/other.mdx: values given, but the code offers this section no options (tools/help/options.ts)",
    ]);
  });
});

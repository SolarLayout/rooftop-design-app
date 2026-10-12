import { describe, expect, test } from "bun:test";
import { answerNotFirst, badDocsPlaces, brokenLinks, clashingAliases, driftedOptions, linksOf, longSummaries, typedNumbers, voiceFindings } from "./checks";
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

describe("the place in the docs (issue 193, D91)", () => {
  test("every topic names a page of the docs and one of its sections", () => {
    const topics = [
      topic("studio.section.design-day", { docs: { page: "sun", section: "The day" } }),
      topic("studio.section.none"),
      topic("studio.section.moon", { docs: { page: "moon", section: "Craters" } }),
      topic("studio.section.lost", { docs: { page: "sun", section: "Moonlight" } }),
    ];
    expect(badDocsPlaces(topics)).toEqual([
      "studio/section/none.mdx: names no place in the docs; give docs, its page and section",
      'studio/section/moon.mdx: docs: "moon" is no page of the docs',
      'studio/section/lost.mdx: docs: "Moonlight" is no section of The Sun lens',
    ]);
  });
});

describe("the voice of a topic (V2 · 11, plan/v2/voice.md §9)", () => {
  test("a summary under 20 words passes; one of 20 or more is refused", () => {
    const short = topic("studio.section.a", { summary: "Set the parapet height and the strips kept free of modules at the edges and round obstacles." });
    const long = topic("studio.section.b", { summary: "The parapet, the setback from the edges, the walkways, the clearance around obstacles and the roof's albedo, each one set here." });
    expect(longSummaries([short, long])).toEqual(["studio/section/b.mdx: the summary has 21 words; say the thing's job in under 20"]);
  });

  test("a never-word or an old name in the title, the summary or the body is refused", () => {
    const topics = [
      topic("studio.section.a", { summary: "The engine spaces the rows." }),
      topic("studio.section.b", {}, "## What to set\n\nSet the `Shade-free window` first."),
      topic("studio.section.c", {}, "## What to set\n\nThe app spaces the rows."),
    ];
    expect(voiceFindings(topics)).toEqual(['studio/section/a.mdx: never "engine"', 'studio/section/b.mdx: the old name "Shade-free window"']);
  });

  test("a section answers first: its first heading is What to set (Choosing one for a choice, Reading it for a read-out)", () => {
    const topics = [
      topic("studio.section.a", {}, "Lead.\n\n## What to set\n\nWords.\n\n## What it changes"),
      topic("studio.section.b", {}, "## Choosing one\n\nWords."),
      topic("studio.section.c", {}, "## Reading it\n\nWords."),
      topic("studio.section.d", {}, "## How it limits a string\n\n## What to set"),
      topic("studio.section.e", {}, "No heading at all."),
    ];
    expect(answerNotFirst(topics)).toEqual([
      'studio/section/d.mdx: the first heading is "How it limits a string"; begin with What to set, Choosing one or Reading it',
      "studio/section/e.mdx: no heading; begin with What to set, Choosing one or Reading it",
    ]);
  });

  test("a how-to is its numbered steps", () => {
    const steps = topic("find.tool.a", { kind: "tool" }, '<Steps>\n<Step title="Click each corner">Words.</Step>\n</Steps>');
    const words = topic("find.tool.b", { kind: "tool" }, "## What it does\n\nWords.");
    expect(answerNotFirst([steps, words])).toEqual(["find/tool/b.mdx: a how-to without its numbered steps; write them in <Steps>"]);
  });
});

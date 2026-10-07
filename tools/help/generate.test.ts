import { describe, expect, test } from "bun:test";
import { manifestOf, topicOf } from "./generate";

describe("a topic read", () => {
  test("its key, frontmatter and body", () => {
    const topic = topicOf("find/section/edges.mdx", "---\ntitle: Edges\nsummary: The lengths of the edges.\nkind: section\n---\n\n## Typing a length\n");
    expect(topic).toEqual({
      key: "find.section.edges",
      path: "find/section/edges.mdx",
      frontmatter: { title: "Edges", summary: "The lengths of the edges.", kind: "section", related: [], aliases: [] },
      body: "\n## Typing a length\n",
    });
  });

  test("refused with its path: no frontmatter, a wrong field, a kind not its key's", () => {
    expect(() => topicOf("find/section/edges.mdx", "## Edges")).toThrow("find/section/edges.mdx: no frontmatter (--- … ---) at the top");
    expect(() => topicOf("find/section/edges.mdx", "---\ntitle: Edges\nkind: section\n---\n")).toThrow("find/section/edges.mdx: summary: words, 140 characters at most");
    expect(() => topicOf("find/section/edges.mdx", "---\ntitle: Edges\nsummary: S\nkind: tool\n---\n")).toThrow('find/section/edges.mdx: kind "tool" is not the key\'s, "section"');
    expect(() => topicOf("find/section/edges.mdx", "---\ntitle: Edges\nsummary: The edges: their lengths\nkind: section\n---\n")).toThrow(
      "find/section/edges.mdx: the frontmatter is not YAML (quote a line with a colon in it): ",
    );
  });
});

describe("the manifest", () => {
  test("every key a type, the options labelled by the code, the body loaded when opened, the aliases", () => {
    const topic = topicOf("studio/section/volts.mdx", '---\ntitle: Volts\nsummary: S\nkind: section\nvalues:\n  "600": At most 600.\naliases: [studio.section.old]\n---\n');
    const manifest = manifestOf([topic], () => [{ id: "600", label: "600 V" }]);
    expect(manifest).toContain('export const HELP_KEYS = [\n  "studio.section.volts",\n] as const;');
    expect(manifest).toContain('values: {"600":{"label":"600 V","meaning":"At most 600."}},');
    expect(manifest).toContain('load: () => import("../../content/help/studio/section/volts.mdx"),');
    expect(manifest).toContain('export const ALIASES: Record<string, HelpKey> = {\n  "studio.section.old": "studio.section.volts",\n};');
  });

  test("no topics, an empty manifest that still types", () => {
    expect(manifestOf([], () => undefined)).toContain("export const HELP_KEYS = [] as const;");
  });
});

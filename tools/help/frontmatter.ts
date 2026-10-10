// The frontmatter of a topic, read and checked: title (80 at most), summary (140 at most: the tooltip and the sheet's
// lead), kind (the key's own), values (a one-choice section's options and what each means), related, aliases, docs (the
// page and section of the docs that tell more, D91). Nothing else.
import type { DocsPlace } from "../../apps/web/lib/docs/docs";
import { HELP_KINDS, type HelpKind } from "../../apps/web/lib/help/types";

export type Frontmatter = {
  title: string;
  summary: string;
  kind: HelpKind;
  values?: Record<string, string>;
  related: string[];
  aliases: string[];
  docs?: DocsPlace;
};

const FIELDS = new Set(["title", "summary", "kind", "values", "related", "aliases", "docs"]);

const isText = (value: unknown, most: number): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= most;
const isTexts = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const isPlace = (value: unknown): value is DocsPlace =>
  typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 2 && isText((value as DocsPlace).page, 80) && isText((value as DocsPlace).section, 80);

/** The frontmatter, or every way it is wrong, each in words. */
export function frontmatterOf(raw: unknown): { ok: true; frontmatter: Frontmatter } | { ok: false; problems: string[] } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, problems: ["the frontmatter is not a set of fields"] };
  const fields = raw as Record<string, unknown>;
  const problems = Object.keys(fields)
    .filter((name) => !FIELDS.has(name))
    .map((name) => `"${name}" is not a field of a topic`);
  if (!isText(fields.title, 80)) problems.push("title: words, 80 characters at most");
  if (!isText(fields.summary, 140)) problems.push("summary: words, 140 characters at most");
  if (!HELP_KINDS.includes(fields.kind as HelpKind)) problems.push(`kind: one of ${HELP_KINDS.join(", ")}`);
  const { values } = fields;
  if (values !== undefined && (typeof values !== "object" || values === null || Array.isArray(values) || !Object.values(values).every((meaning) => isText(meaning, 140)))) {
    problems.push("values: each option and what it means, 140 characters at most");
  }
  if (fields.related !== undefined && !isTexts(fields.related)) problems.push("related: a list of keys");
  if (fields.aliases !== undefined && !isTexts(fields.aliases)) problems.push("aliases: a list of keys");
  if (fields.docs !== undefined && !isPlace(fields.docs)) problems.push("docs: a page and a section of the docs");
  if (problems.length > 0) return { ok: false, problems };
  return {
    ok: true,
    frontmatter: {
      title: fields.title as string,
      summary: fields.summary as string,
      kind: fields.kind as HelpKind,
      ...(values === undefined ? {} : { values: Object.fromEntries(Object.entries(values as Record<string, string>).map(([id, meaning]) => [String(id), meaning])) }),
      related: (fields.related as string[] | undefined) ?? [],
      aliases: (fields.aliases as string[] | undefined) ?? [],
      ...(fields.docs === undefined ? {} : { docs: { page: (fields.docs as DocsPlace).page, section: (fields.docs as DocsPlace).section } }),
    },
  };
}

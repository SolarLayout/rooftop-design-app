// The one list at the foot of a help topic (V2 · 11, V2-87): its related topics by their titles, then the place in the
// docs that tells more (D91), "<section>, in the docs". "In the docs" is no longer a list of its own. Pure.
import { resolvedKey } from "./where";

export type RelatedRow = { kind: "topic"; key: string; title: string } | { kind: "docs"; href: string; words: string };

type Registry = { entries: Readonly<Record<string, { title: string }>>; aliases: Readonly<Record<string, string>> };

/** The rows of Related: each related key that leads to a topic, once, then the docs' row when the topic has a place there. */
export function relatedRowsOf(related: readonly string[], registry: Registry, docs: { section: string; href: string } | null): RelatedRow[] {
  const keys = [...new Set(related.flatMap((raw) => resolvedKey(raw, registry) ?? []))];
  const topics = keys.flatMap((key): RelatedRow[] => {
    const entry = registry.entries[key];
    return entry ? [{ kind: "topic", key, title: entry.title }] : [];
  });
  return docs ? [...topics, { kind: "docs", href: docs.href, words: `${docs.section}, in the docs` }] : topics;
}

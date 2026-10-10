// The gate of the help (D80, after solarlayout's packages/help): what would let a topic say something false or lead
// nowhere. Each check gives its problems in words, with the topic's path; none is the topic as it should be.
import { problemsOfPlace } from "../../apps/web/lib/docs/docs";
import { isHelpKey } from "../../apps/web/lib/help/keys";
import type { Topic } from "./generate";
import type { Option } from "./options";

/** The keys a body links to: <HelpLink k="…">. */
export function linksOf(body: string): string[] {
  return [...body.matchAll(/<HelpLink\s+k="([^"]+)"/g)].flatMap((found) => (found[1] === undefined ? [] : [found[1]]));
}

/** Every `related` entry and every link of a body names a topic or an alias. */
export function brokenLinks(topics: readonly Topic[]): string[] {
  const known = new Set(topics.flatMap(({ key, frontmatter }) => [key, ...frontmatter.aliases]));
  return topics.flatMap(({ path, frontmatter, body }) =>
    [...frontmatter.related.map((key) => ({ key, where: "related" })), ...linksOf(body).map((key) => ({ key, where: "a link" }))]
      .filter(({ key }) => !known.has(key))
      .map(({ key, where }) => `${path}: ${where} to "${key}", which is no topic`),
  );
}

/** An alias is a key in form, and names one topic only, never a key itself. */
export function clashingAliases(topics: readonly Topic[]): string[] {
  const keys = new Set(topics.map(({ key }) => key));
  const seen = new Map<string, string>();
  return topics.flatMap(({ path, frontmatter }) =>
    frontmatter.aliases.flatMap((alias) => {
      const problems: string[] = [];
      if (!isHelpKey(alias)) problems.push(`${path}: alias "${alias}" is no key`);
      if (keys.has(alias)) problems.push(`${path}: alias "${alias}" is a topic's key`);
      const before = seen.get(alias);
      if (before) problems.push(`${path}: alias "${alias}" is ${before}'s too`);
      seen.set(alias, path);
      return problems;
    }),
  );
}

// A number with a unit drifts silently when the code changes: a body says it with a component, or in other words.
const NUMBER_WITH_UNIT = /\b\d+(?:[.,]\d+)?\s?(?:mm²|m²|kWp|kWh|MWh|MW|kW|kV|mm|cm|km|m|V|A|W|°C|°|%)(?![\p{L}\d])/u;

/** A body with a number and a unit typed into it, outside the on-screen words quoted in code. */
export function typedNumbers(topics: readonly Topic[]): string[] {
  return topics.flatMap(({ path, body }) => {
    const prose = body.replace(/`[^`]*`/g, "");
    const found = NUMBER_WITH_UNIT.exec(prose);
    return found ? [`${path}: "${found[0]}" is a number typed with its unit; say it from the code, or in words`] : [];
  });
}

/** A one-choice section's options in the topic are exactly the code's; a section the code gives options has them. */
export function driftedOptions(topics: readonly Topic[], optionsOf: (key: string) => readonly Option[] | undefined): string[] {
  return topics.flatMap(({ key, path, frontmatter }) => {
    const code = optionsOf(key);
    const written = frontmatter.values ? Object.keys(frontmatter.values) : null;
    if (!code && written) return [`${path}: values given, but the code offers this section no options (tools/help/options.ts)`];
    if (code && !written) return [`${path}: the section offers ${code.map(({ id }) => id).join(", ")}; say what each means in values`];
    if (!code || !written) return [];
    const ids = code.map(({ id }) => id);
    const missing = ids.filter((id) => !written.includes(id));
    const extra = written.filter((id) => !ids.includes(id));
    return [
      ...(missing.length ? [`${path}: values miss ${missing.join(", ")}, which the code offers`] : []),
      ...(extra.length ? [`${path}: values name ${extra.join(", ")}, which the code does not offer`] : []),
    ];
  });
}

/** Every topic names the page and section of the docs that tell more (D91), and the docs have them (lib/docs/docs.ts). */
export function badDocsPlaces(topics: readonly Topic[]): string[] {
  return topics.flatMap(({ path, frontmatter }) =>
    frontmatter.docs === undefined
      ? [`${path}: names no place in the docs; give docs, its page and section`]
      : problemsOfPlace(frontmatter.docs).map((problem) => `${path}: docs: ${problem}`),
  );
}

// The in-app help (D80, plan/phase-14-in-app-help.md), after the core of solarlayout's packages/help: one MDX topic per
// key, its metadata loaded with the page, its body only when it is opened.
import type { MDXContent } from "mdx/types";

/** Where in the app a topic belongs: the key's first part. */
export const HELP_PLACES = ["find", "studio", "performance", "handover", "home", "app"] as const;
export type HelpPlace = (typeof HELP_PLACES)[number];

/** What a topic explains: the key's second part. */
export const HELP_KINDS = ["section", "setting", "metric", "deliverable", "tool", "concept"] as const;
export type HelpKind = (typeof HELP_KINDS)[number];

/** What is known of a topic with the page: its title, its summary (140 characters at most), its options, its links. */
export type HelpMeta = {
  title: string;
  summary: string;
  kind: HelpKind;
  /** A one-choice section's options: the option as the code keys it → its label and what it means. */
  values?: Readonly<Record<string, { label: string; meaning: string }>>;
  related: readonly string[];
  aliases: readonly string[];
};

export type HelpEntry = HelpMeta & { load: () => Promise<{ default: MDXContent }> };

export type HelpRegistry = { entries: Readonly<Record<string, HelpEntry>>; aliases: Readonly<Record<string, string>> };

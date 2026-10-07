// Over the help sheet's title, what the topic is and where it was opened (D80): "Section · Strings lens". And a key read
// from the address made a topic's, through its aliases.
import { isLens, LENSES } from "../routes";
import type { HelpKind } from "./types";

const KIND: Record<HelpKind, string> = { section: "Section", setting: "Setting", metric: "Metric", deliverable: "Deliverable", tool: "Tool", concept: "Concept" };

const SCREEN: Record<string, string> = { find: "Find", performance: "Performance", handover: "Handover", present: "Present", "": "Home" };

/** "Section · Strings lens": the kind of the topic, then the screen of the address. */
export function whereOf(kind: HelpKind, pathname: string): string {
  const [workspace = "", lens = ""] = pathname.split("/").filter(Boolean);
  const screen = workspace === "studio" && isLens(lens) ? `${LENSES.find(({ id }) => id === lens)?.name} lens` : (SCREEN[workspace] ?? "Studio");
  return `${KIND[kind]} · ${screen}`;
}

/** The topic a key names, directly or by an alias; null for none. */
export function resolvedKey(raw: string, registry: { entries: object; aliases: Readonly<Record<string, string>> }): string | null {
  if (Object.hasOwn(registry.entries, raw)) return raw;
  return Object.hasOwn(registry.aliases, raw) ? (registry.aliases[raw] ?? null) : null;
}

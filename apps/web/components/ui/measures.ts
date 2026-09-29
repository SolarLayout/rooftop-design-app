import type { CSSProperties } from "react";

/** What a utility can read: `left-at` reads `at`, `w-span` reads `span` (app/globals.css). */
export type Measure = "at" | "span";

/**
 * Numbers of the data as a style: where the handle of a slider is, how wide the filled part. Each is a
 * share, from 0 to 1, and a utility makes a place or a width of it. It is the only inline style there
 * is (components/tokens-only.test.ts): a size, a colour or a shadow is a token and never comes this way.
 */
export function measures(values: Partial<Record<Measure, number>>): CSSProperties {
  const style: Record<string, string> = {};
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) throw new Error(`${name} is no number: ${value}.`);
    style[`--${name}`] = String(Number(value.toFixed(6)));
  }
  return style;
}

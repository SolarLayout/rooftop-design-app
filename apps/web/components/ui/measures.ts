import type { CSSProperties } from "react";

/**
 * What a utility can read (app/globals.css). A share, from 0 to 1: `left-at` reads `at`, `w-span` and
 * `h-span` read `span`. A place on the screen, in pixels: `placed` reads `x` and `y`.
 */
export type Measure = "at" | "span" | "x" | "y";

const UNIT: Record<Measure, string> = { at: "", span: "", x: "px", y: "px" };

/**
 * Numbers of the data as a style: where the handle of a slider is, how wide the filled part, where a
 * list floats. A utility makes a place or a width of each. It is the only inline style there is
 * (components/tokens-only.test.ts): a size, a colour or a shadow is a token and never comes this way.
 */
export function measures(values: Partial<Record<Measure, number>>): CSSProperties {
  const style: Record<string, string> = {};
  for (const [name, value] of Object.entries(values) as Array<[Measure, number]>) {
    if (!Number.isFinite(value)) throw new Error(`${name} is no number: ${value}.`);
    style[`--${name}`] = `${Number(value.toFixed(6))}${UNIT[name]}`;
  }
  return style;
}

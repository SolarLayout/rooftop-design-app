// The number of a field: how it is shown, what is made of what was typed, and how it is stepped.
// Format of numbers: docs/design/guidelines.md, "Numbers and units".

export type Range = {
  /** The lowest that can be set; without it there is none. */
  min?: number;
  /** The highest that can be set; without it there is none. */
  max?: number;
  /** Decimals the field shows and keeps. */
  decimals: number;
  /** What one step changes; without it, one of the last decimal. */
  step?: number;
};

/** Why the field holds another number than was typed. */
export type Correction = "lowest" | "highest" | "not-a-number";

export type Committed = { value: number; text: string; correction: Correction | null };

const MINUS = "−";
const TYPED = /^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d*)?$/;

function rounded(value: number, decimals: number): number {
  const result = Number(`${Math.round(Number(`${value}e${decimals}`))}e-${decimals}`);
  return Object.is(result, -0) ? 0 : result;
}

/** A number as the field shows it: fixed decimals, a comma between thousands, a true minus sign. */
export function shown(value: number, decimals: number): string {
  const exact = rounded(value, decimals);
  const [whole, fraction] = Math.abs(exact).toFixed(decimals).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, ",");
  return `${exact < 0 ? MINUS : ""}${grouped}${fraction === undefined ? "" : `.${fraction}`}`;
}

/** What was typed, as a number; null when it is none. */
export function numberOf(typed: string): number | null {
  const text = typed.trim().replace(MINUS, "-");
  if (!TYPED.test(text) || !/\d/.test(text)) return null;
  const value = Number(text.replaceAll(",", ""));
  return Number.isFinite(value) ? value : null;
}

/** What Enter or leaving the field makes of the draft. `before` is the value the field had. */
export function committed(draft: string, before: number, range: Range): Committed {
  const typed = numberOf(draft);
  if (typed === null) return { value: before, text: shown(before, range.decimals), correction: "not-a-number" };

  const exact = rounded(typed, range.decimals);
  if (range.min !== undefined && exact < range.min) {
    return { value: range.min, text: shown(range.min, range.decimals), correction: "lowest" };
  }
  if (range.max !== undefined && exact > range.max) {
    return { value: range.max, text: shown(range.max, range.decimals), correction: "highest" };
  }
  return { value: exact, text: shown(exact, range.decimals), correction: null };
}

/** The value one step further, inside the range. */
export function stepped(value: number, direction: "up" | "down", range: Range): number {
  const step = range.step ?? 10 ** -range.decimals;
  const next = rounded(value + (direction === "up" ? step : -step), Math.max(range.decimals, 6));
  const inside = Math.min(range.max ?? Infinity, Math.max(range.min ?? -Infinity, next));
  return rounded(inside, Math.max(range.decimals, 6));
}

/** A number as it is shown, with its unit: a space between them, none before the degree sign. */
export function withUnit(number: string, unit: string | undefined): string {
  if (!unit) return number;
  return `${number}${unit === "°" ? "" : " "}${unit}`;
}

/** What the field says after it changed the entry: what happened and what can be entered. */
export function saidOf(correction: Correction | null, range: Range, unit?: string): string | null {
  const { min, max } = range;
  if (correction === null) return null;
  if (correction === "highest" && max !== undefined) return `The highest is ${withUnit(shown(max, range.decimals), unit)}.`;
  if (correction === "lowest" && min !== undefined) return `The lowest is ${withUnit(shown(min, range.decimals), unit)}.`;
  if (min !== undefined && max !== undefined) {
    return `Enter a number from ${shown(min, range.decimals)} to ${withUnit(shown(max, range.decimals), unit)}.`;
  }
  if (min !== undefined) return `Enter ${withUnit(shown(min, range.decimals), unit)} or more.`;
  if (max !== undefined) return `Enter ${withUnit(shown(max, range.decimals), unit)} or less.`;
  return "Enter a number.";
}

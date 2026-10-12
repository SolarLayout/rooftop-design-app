// Who set each value of a design (V2 · 3, D97): the app (Default), the site's weather, the user's country (D87) or the
// user (Yours). The same four words stand at the right of a section and in a field's hint, on every step, so that a new
// user sees what to check and what was left as the app gave it. Pure.
import { shown, withUnit } from "../../components/ui/number-entry";

export type SetBy =
  | { kind: "default" }
  | { kind: "weather" }
  | { kind: "country"; country: string }
  /** The default the user's value took the place of, as it is shown; null where there is none to say. */
  | { kind: "yours"; byDefault: string | null };

export const DEFAULT: SetBy = { kind: "default" };
export const FROM_THE_WEATHER: SetBy = { kind: "weather" };

/** The word at the right of a section. */
export function wordOf(by: SetBy): string {
  switch (by.kind) {
    case "default":
      return "Default";
    case "weather":
      return "From the weather";
    case "country":
      return `Set for ${by.country}`;
    case "yours":
      return "Yours";
  }
}

/** The hint under a field: the word, and for the user's value the default it took the place of. */
export const hintOf = (by: SetBy): string => (by.kind === "yours" && by.byDefault !== null ? `Yours · default ${by.byDefault}` : wordOf(by));

/** How a default is said: a number at the field's decimals with its unit, or the words of a choice. */
export type DefaultShown = { decimals: number; unit?: string } | { words: string };

/** A value against its default: the same (a number at the field's decimals) is the app's, another the user's. */
export function setByOfValue<Value extends number | string | boolean>(value: Value, byDefault: Value, as: DefaultShown): SetBy {
  if ("words" in as) return value === byDefault ? DEFAULT : { kind: "yours", byDefault: as.words };
  const same = typeof value === "number" && typeof byDefault === "number" ? shown(value, as.decimals) === shown(byDefault, as.decimals) : value === byDefault;
  return same ? DEFAULT : { kind: "yours", byDefault: withUnit(shown(byDefault as number, as.decimals), as.unit) };
}

/** A section: the user's when any of its fields is; else the first source that is not the app's own default. */
export function sectionSetByOf(fields: readonly SetBy[]): SetBy | null {
  if (fields.length === 0) return null;
  if (fields.some((by) => by.kind === "yours")) return { kind: "yours", byDefault: null };
  return fields.find((by) => by.kind !== "default") ?? DEFAULT;
}

/** The module or the inverter: the app's until the user reads a file of their own (`pan_text`, `ond_text`). */
export const fileSetByOf = (text: string | null | undefined): SetBy => (text ? { kind: "yours", byDefault: null } : DEFAULT);

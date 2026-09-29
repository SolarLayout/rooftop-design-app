// The places of the app that have a name of their own in the address (docs/design/information-architecture.md).

/** The lenses of the Studio, in the order of the work. */
export const LENSES = [
  { id: "roof", name: "Roof" },
  { id: "array", name: "Array" },
  { id: "sun", name: "Sun" },
  { id: "strings", name: "Strings" },
] as const;

export type Lens = (typeof LENSES)[number]["id"];

export function isLens(value: string): value is Lens {
  return LENSES.some((lens) => lens.id === value);
}

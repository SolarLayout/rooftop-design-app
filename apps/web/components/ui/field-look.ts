import { classNames } from "./class-names";

// The look of what is typed into: recessed, and with an accent line and a halo while the focus is inside
// (docs/design/components.md, "Number field").

export const WELL = classNames(
  "border border-line bg-well shadow-well press-motion",
  "focused:border-accent focused:shadow-well-focus",
);

/** The input inside a well: it has no surface and no ring of its own. */
export const INPUT = classNames(
  "min-w-0 border-0 bg-transparent text-text outline-none",
  "type-value-s desktop:type-value-field",
  "disabled:cursor-default",
);

export const UNIT = "type-caption text-text-2 whitespace-nowrap";

/** What a field says under itself. It takes no room while it says nothing. */
export const SAID = "type-caption text-text-2 not-empty:mt-1.5";

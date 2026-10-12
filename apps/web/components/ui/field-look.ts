import { classNames } from "./class-names";

// The look of what is typed into: recessed, and with an accent line and a halo while the focus is inside
// (docs/design/components.md, "Number field").

export const WELL = classNames(
  "border border-line bg-well shadow-well press-motion",
  "focused:border-accent focused:shadow-well-focus",
);

const INPUT_BASE = classNames("min-w-0 border-0 bg-transparent text-text outline-none", "disabled:cursor-default");

/** The input inside a well: it has no surface and no ring of its own. */
export const INPUT = classNames(INPUT_BASE, "type-mono-touch desktop:type-mono");

/** The same inside the loss chain; empty for its default, it says the default inside itself. */
export const INPUT_IN_THE_CHAIN = classNames(INPUT_BASE, "type-mono-touch desktop:type-mono placeholder:text-text-3");

/** The input of a text field: words in Geist, at the left, in the size of body text. */
export const INPUT_WORDS = classNames(INPUT_BASE, "placeholder:text-text-3");

export const UNIT = "type-body-touch desktop:type-body text-text-2 whitespace-nowrap";

/** What a field says under itself. It takes no room while it says nothing. */
export const SAID = "type-body-touch desktop:type-body text-text-2 not-empty:mt-1.5";

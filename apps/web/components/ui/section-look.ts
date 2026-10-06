// The heading of a section in an input panel (the Studio's inspectors, Find's panels): uppercase, in the primary action's
// orange at weight 600, over a line of its colour (docs/design/design-tokens.md, `color-heading`). A heading with words
// at its right puts the line under its whole row: the row takes SECTION_LINE, the heading SECTION_TEXT.
import { classNames } from "./class-names";

export const SECTION_TEXT = "type-section font-semibold text-heading uppercase";
export const SECTION_LINE = "border-b border-heading-line pb-1.5";
export const SECTION = classNames(SECTION_TEXT, SECTION_LINE);

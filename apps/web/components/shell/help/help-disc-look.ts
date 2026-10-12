import { classNames } from "@/components/ui/class-names";

// The ? beside a section's name (components.md, "Help disc and help sheet"; D94, D80 kept): quiet, a ring in the line colour
// with the ? in text-3, 20 drawn in a target of 24 on desktop and 44 on touch; the pointer over it lifts the ? to text-2;
// while its topic is shown it rings in the accent.

export const TARGET = "group inline-grid size-touch shrink-0 cursor-pointer place-items-center rounded-full focus-ring -my-2.5 desktop:-my-1 desktop:size-6";

const AT_REST = "border-line-strong bg-transparent text-text-3 group-hovered:border-text-3 group-hovered:text-text-2";
const OPEN = "border-accent bg-transparent text-accent shadow-help-held";

/** The disc's look: at rest, or while its topic is shown in the sheet. */
export function discLook(isOpen: boolean): string {
  return classNames("grid size-5 place-items-center rounded-full border press-motion", isOpen ? OPEN : AT_REST);
}

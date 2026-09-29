import { classNames } from "./class-names";

// The look of a list that floats and of its rows: the choices of a Select, the menu of the project
// switcher (docs/design/components.md, "Select" and "Project switcher, open").

/** The list on desktop. On phone and tablet it stands in a bottom sheet and has no surface of its own. */
export const LIST = classNames(
  "flex flex-col gap-0.5",
  "desktop:rounded-card-s desktop:border desktop:border-line-strong desktop:bg-surface-1 desktop:p-1.5 desktop:shadow-float",
);

export const ROW = classNames(
  "flex h-13 cursor-pointer items-center gap-2.5 rounded-item px-2.5 select-none",
  "desktop:h-10",
);

/** The row under the pointer or the keyboard. */
export const ROW_MARKED = "bg-surface-2";

/** One fact at the right of a row. */
export const FACT = "type-caption text-text-3";

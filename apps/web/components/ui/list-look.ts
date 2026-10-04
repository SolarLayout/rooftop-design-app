import { classNames } from "./class-names";

// The look of a list that floats and of its rows: the choices of a Select, the menu of the project
// switcher (docs/design/components.md, "Select" and "Project switcher, open").

/** The list on desktop. On phone and tablet it stands in a bottom sheet and has no surface of its own. */
export const LIST = classNames(
  "flex flex-col gap-0.5",
  "desktop:rounded-card-s desktop:border desktop:border-line-strong desktop:bg-surface-1 desktop:p-1.5 desktop:shadow-float",
);

/**
 * The surface of a panel that floats at every size, on touch too (the Layers panel of the stage, decision D57): what
 * LIST has on desktop, the width of the card's menu given by the FloatingPanel around it.
 */
export const FLOATING_SURFACE = "flex flex-col rounded-card-s border border-line-strong bg-surface-1 p-1.5 shadow-float";

export const ROW = classNames(
  "flex h-13 cursor-pointer items-center gap-2.5 rounded-item px-2.5 select-none",
  "desktop:h-10",
);

/** The row under the pointer or the keyboard. */
export const ROW_MARKED = "bg-surface-2";

/** One fact at the right of a row. */
export const FACT = "type-caption text-text-3";

/**
 * A row of a menu (the project switcher's, a card's): 52 high on phone and tablet, 44 on desktop, an icon of 18 and a fact
 * at the right; under the pointer or the keyboard on `surface-2`.
 */
export const MENU_ROW = classNames(
  "flex h-13 items-center gap-3 rounded-item px-2.5 select-none focus-ring desktop:h-11",
  "hovered:bg-surface-2 focus-visible:bg-surface-2",
);

/** A row of a menu that does something when pressed. */
export const PRESSABLE_MENU_ROW = classNames(MENU_ROW, "w-full cursor-pointer text-left");

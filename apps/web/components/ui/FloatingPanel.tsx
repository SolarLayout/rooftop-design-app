"use client";

import type { ReactNode } from "react";
import { classNames } from "./class-names";
import { SheetGrip } from "./SheetGrip";
import type { Floating } from "./use-floating";

type Props = {
  /** Of `useFloating`. */
  floating: Floating;
  /** How wide the panel is on desktop. On phone and tablet it is as wide as the screen. */
  width?: "list" | "menu";
  children: ReactNode;
};

const WIDTH = { list: "desktop:w-80", menu: "desktop:w-85" };

// A popover of the browser has colours and a width of its own, and cuts off what stands out of it. While
// it is closed the browser does not show it; open, it is a column.
const POPOVER = "max-w-none flex-col text-text open:flex";

// On phone and tablet: a bottom sheet over a dimmed screen.
const SHEET = classNames(
  "fixed inset-x-0 top-auto bottom-0 max-h-3/4 w-full overflow-hidden rounded-t-panel border-t border-line bg-chrome",
  "backdrop:bg-dim",
);

// On desktop: beside its control, as wide as it is said to be. What is in it has the surface and the shadow.
const BESIDE = classNames(
  "desktop:placed desktop:overflow-visible desktop:rounded-none desktop:border-t-0 desktop:bg-transparent",
  "desktop:backdrop:bg-transparent",
);

/**
 * What floats beside the control that opened it: a list of choices, the menu of the project switcher.
 * On phone and tablet it is a bottom sheet. A press on its handle, or a drag of it downwards, closes it.
 */
export function FloatingPanel({ floating, width = "list", children }: Props) {
  return (
    <div {...floating.panel} className={classNames(POPOVER, SHEET, BESIDE, WIDTH[width])}>
      <SheetGrip onClose={floating.close} className="desktop:hidden" />
      <div className="min-h-0 grow overflow-y-auto px-4 pt-2 pb-4 desktop:overflow-visible desktop:p-0">{children}</div>
    </div>
  );
}

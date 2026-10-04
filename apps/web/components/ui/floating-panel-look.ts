import { classNames } from "./class-names";

// The look of a panel that floats beside the control that opened it (docs/design/components.md, "Select"): a
// popover of the browser, placed by `useFloating`. On phone and tablet it is a bottom sheet, unless it is asked to
// stay floating there too (the Layers panel of the stage, decision D57).

/** How wide the panel is: a list of choices, the project switcher's menu, the search's places, the menu of a card. */
export type PanelWidth = "list" | "menu" | "search" | "card";

/** What the panel is on phone and tablet: a bottom sheet over a dimmed screen, or floating beside its control as on desktop. */
export type OnTouch = "sheet" | "floating";

const WIDTH_ON_DESKTOP: Record<PanelWidth, string> = { list: "desktop:w-80", menu: "desktop:w-85", search: "desktop:w-100", card: "desktop:w-60" };
const WIDTH: Record<PanelWidth, string> = { list: "w-80", menu: "w-85", search: "w-100", card: "w-60" };

// A popover of the browser has colours and a width of its own, and cuts off what stands out of it. While
// it is closed the browser does not show it; open, it is a column.
const POPOVER = "max-w-none flex-col text-text open:flex";

// On phone and tablet: a bottom sheet over a dimmed screen.
const SHEET = classNames(
  "fixed inset-x-0 top-auto bottom-0 max-h-3/4 w-full overflow-hidden rounded-t-panel border-t border-line bg-chrome",
  "backdrop:bg-dim",
);

// On desktop: beside its control, as wide as it is said to be. What is in it has the surface and the shadow.
const BESIDE_ON_DESKTOP = classNames(
  "desktop:placed desktop:overflow-visible desktop:rounded-none desktop:border-t-0 desktop:bg-transparent",
  "desktop:backdrop:bg-transparent",
);

// On every size: beside its control, with no look of its own; what is in it has the surface and the shadow.
const BESIDE = "placed overflow-visible bg-transparent backdrop:bg-transparent";

/** The classes of the panel: a sheet on touch and beside the control on desktop, or beside the control everywhere. */
export function floatingPanelLook(width: PanelWidth, onTouch: OnTouch): string {
  return onTouch === "floating" ? classNames(POPOVER, BESIDE, WIDTH[width]) : classNames(POPOVER, SHEET, BESIDE_ON_DESKTOP, WIDTH_ON_DESKTOP[width]);
}

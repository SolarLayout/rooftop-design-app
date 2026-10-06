// The look of a dialog (docs/design/components.md, "Dialog"): a panel in the middle of the screen from tablet on, a
// bottom sheet on phone. The wide one holds the equipment picker (D75). Pure, so that it is tested without a browser.
import { classNames } from "./class-names";

export type DialogSize = "narrow" | "wide";
/** Where an action is shown: on every size, on the phone's sheet alone, or on the panel of tablet and desktop alone. */
export type ActionShown = "always" | "phone" | "panel";

const SHEET = "w-full rounded-t-panel border border-b-0 border-line bg-chrome px-4 pb-4";
const PANEL = classNames(
  "tablet:max-w-full tablet:rounded-panel tablet:border-b tablet:border-line-strong tablet:bg-surface-1",
  "tablet:px-5.5 tablet:pt-5.5 tablet:pb-5 tablet:shadow-panel",
);
const WIDTH: Record<DialogSize, string> = {
  narrow: "tablet:w-110",
  // On phone the sheet at its full height; from tablet on as high as what it holds, never higher than the screen.
  wide: "h-full tablet:h-auto tablet:max-h-full tablet:w-170 desktop:w-190",
};

export function panelLook(size: DialogSize): string {
  return classNames("flex flex-col gap-2.5", SHEET, PANEL, WIDTH[size]);
}

/** The dialog of the browser, across the screen: the panel at the bottom on phone, in the middle from tablet on. */
export function dialogLook(size: DialogSize): string {
  return classNames(
    "fixed inset-0 size-full max-h-none max-w-none items-end justify-center bg-transparent text-text outline-none",
    "backdrop:bg-dim open:flex tablet:items-center tablet:p-panel",
    size === "wide" && "pt-12",
  );
}

/** The wrapper of an action, which shows or hides it by the size: the button's own display is never fought. */
export function actionLook(shown: ActionShown): string {
  if (shown === "phone") return "flex flex-col tablet:hidden";
  if (shown === "panel") return "hidden tablet:flex";
  return "flex flex-col tablet:flex-row";
}

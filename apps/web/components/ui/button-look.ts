import { classNames } from "./class-names";

// The look of everything that is pressed: Button, ButtonLink and IconButton
// (docs/design/components.md, "Buttons"; board "Controls, depth and motion").

export type ButtonKind = "primary" | "secondary" | "quiet";

/**
 * V2's heights (D94): compact 32 (`xs`, `s`), standard 40 (`m`, `l`), primary 48 (`xl`) on desktop; on phone and tablet
 * nothing is lower than 44, and the primary is 48. `sheet` is for the actions of a dialog: 40 on desktop, 44 on tablet,
 * and on phone 48, a quiet one 44. One row, one height. Every button has the control's radius, 8, but the large orange primary
 * (`primary`, `xl`): the radius of Home's Find the roof, 14 (`radius-cta`; the owner, 2026-10-13).
 */
export type ButtonSize = "xs" | "s" | "m" | "l" | "xl" | "sheet";

/** Sides on desktop: 32 (`xs`), 40 (`s`, `m`); 44 on phone and tablet, and `l` everywhere. */
export type IconButtonSize = "xs" | "s" | "m" | "l";

const PRESSABLE = classNames(
  "inline-flex shrink-0 cursor-pointer items-center justify-center select-none whitespace-nowrap",
  "press-motion focus-ring pressed:lowered-by-press",
  "disabled:cursor-default disabled:opacity-disabled disabled:flat",
  // Shown, and cannot be used yet: it looks the same, and still takes the focus, so that it is found.
  "aria-disabled:cursor-default aria-disabled:opacity-disabled aria-disabled:flat",
);

const KIND: Record<ButtonKind, string> = {
  primary: classNames(
    "bg-accent text-accent-ink font-semibold shadow-primary",
    "hovered:raised-by-hover hovered:bg-accent-hover hovered:shadow-primary-hover",
    "pressed:bg-accent-pressed pressed:shadow-primary-pressed",
  ),
  secondary: classNames(
    "border bg-control text-text font-medium shadow-raised",
    "hovered:raised-by-hover hovered:border-line-hover hovered:bg-control-hover hovered:shadow-raised-hover",
    "pressed:bg-control-pressed pressed:shadow-pressed",
  ),
  quiet: classNames(
    "bg-transparent text-text-2",
    "hovered:bg-surface-2 hovered:text-text",
    "pressed:bg-control-pressed pressed:text-text pressed:shadow-pressed",
  ),
};

const HEIGHT: Record<ButtonSize, string> = {
  xs: "h-touch desktop:h-8",
  s: "h-touch desktop:h-8",
  m: "h-touch desktop:h-10",
  l: "h-touch desktop:h-10",
  xl: "h-12 text-(length:--text-section)",
  sheet: "h-12 tablet:h-touch desktop:h-10",
};
const HEIGHT_OF_A_QUIET_ACTION = "h-touch desktop:h-10";

const SIDE: Record<IconButtonSize, string> = {
  xs: "size-touch desktop:size-8",
  s: "size-touch desktop:size-10",
  m: "size-touch desktop:size-10",
  l: "size-touch",
};

const PADDING: Record<ButtonKind, string> = { primary: "px-4", secondary: "px-3.5", quiet: "px-3.5" };

export function buttonLook(kind: ButtonKind, size: ButtonSize): string {
  const border = kind === "secondary" && "border-line-strong pressed:border-line-strong";
  const height = size === "sheet" && kind === "quiet" ? HEIGHT_OF_A_QUIET_ACTION : HEIGHT[size];
  const corners = kind === "primary" && size === "xl" ? "rounded-cta" : "rounded-control";
  return classNames(PRESSABLE, "gap-inline", corners, KIND[kind], border, height, size === "xl" ? "px-5" : PADDING[kind]);
}

/** The look of a button while the panel it opens is open: pressed, and staying so, as the trigger of a Select does. */
const OPEN: Record<ButtonKind, string> = {
  primary: "bg-accent-pressed text-accent-ink font-semibold shadow-primary-pressed",
  secondary: "border border-line-strong bg-control-pressed text-text font-medium shadow-pressed",
  quiet: "bg-control-pressed text-text shadow-pressed",
};

/** `isOpen`: the button opens a panel that is open now (the Layers button of the stage); it looks pressed until the panel closes. */
export function iconButtonLook(kind: ButtonKind, size: IconButtonSize, shape: "square" | "round", isOpen = false): string {
  const border = kind === "secondary" && "border-line pressed:border-line";
  const corners = shape === "round" ? "rounded-full" : "rounded-control";
  return isOpen ? classNames(PRESSABLE, OPEN[kind], SIDE[size], corners) : classNames(PRESSABLE, KIND[kind], border, SIDE[size], corners);
}

import { classNames } from "./class-names";

// The look of everything that is pressed: Button, ButtonLink and IconButton
// (docs/design/components.md, "Buttons"; board "Controls, depth and motion").

export type ButtonKind = "primary" | "secondary" | "quiet";

/**
 * Heights on desktop: 36, 40, 44, 56. On phone and tablet nothing is lower than 44. `sheet` is for the
 * actions of a dialog: 40 on desktop, 44 on tablet, and on phone 48, a quiet one 44.
 */
export type ButtonSize = "s" | "m" | "l" | "xl" | "sheet";

/** Sides on desktop: 32, 38, 40, 44. On phone and tablet nothing is smaller than 44. */
export type IconButtonSize = "xs" | "s" | "m" | "l";

const PRESSABLE = classNames(
  "inline-flex shrink-0 cursor-pointer items-center justify-center select-none whitespace-nowrap",
  "press-motion focus-ring pressed:lowered-by-press",
  "disabled:cursor-default disabled:opacity-disabled disabled:flat",
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
  s: "h-touch rounded-row desktop:h-9 desktop:rounded-control",
  m: "h-touch rounded-row desktop:h-10 desktop:rounded-control",
  l: "h-touch rounded-row",
  xl: "h-14 rounded-card-s text-(length:--text-title)",
  sheet: "h-12 rounded-row tablet:h-touch desktop:h-10 desktop:rounded-control",
};
const HEIGHT_OF_A_QUIET_ACTION = "h-touch rounded-row desktop:h-10 desktop:rounded-control";

const SIDE: Record<IconButtonSize, string> = {
  xs: "size-touch desktop:size-8",
  s: "size-touch desktop:size-9.5",
  m: "size-touch desktop:size-10",
  l: "size-touch",
};

const PADDING: Record<ButtonKind, string> = { primary: "px-4", secondary: "px-3.5", quiet: "px-3.5" };

export function buttonLook(kind: ButtonKind, size: ButtonSize): string {
  const border = kind === "secondary" && "border-line-strong pressed:border-line-strong";
  const height = size === "sheet" && kind === "quiet" ? HEIGHT_OF_A_QUIET_ACTION : HEIGHT[size];
  return classNames(PRESSABLE, "gap-inline", KIND[kind], border, height, size === "xl" ? "px-5" : PADDING[kind]);
}

export function iconButtonLook(kind: ButtonKind, size: IconButtonSize, shape: "square" | "round"): string {
  const border = kind === "secondary" && "border-line pressed:border-line";
  const corners = shape === "round" ? "rounded-full" : "rounded-row desktop:rounded-control";
  return classNames(PRESSABLE, KIND[kind], border, SIDE[size], corners);
}

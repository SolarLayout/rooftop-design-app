import type { ReactNode } from "react";
import { classNames } from "./class-names";

// Stroke icons on a 24 by 24 view box, in the colour of the text around them
// (docs/design/design-tokens.md, "Icons"). The paths are those of the approved mockups.
const STROKED = {
  "arrow-left": <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  download: <path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" />,
  minus: <path d="M5 12h14" />,
  note: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5v.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  tick: <path d="m5 12 5 5 9-10" />,
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

// The only filled icon beside the logo.
const FILLED = {
  play: <path d="M7 4v16l13-8z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof STROKED | keyof typeof FILLED;
export type IconSize = 14 | 16 | 18 | 20 | 22;

const SIZE: Record<IconSize, string> = {
  14: "size-3.5",
  16: "size-4",
  18: "size-4.5",
  20: "size-5",
  22: "size-5.5",
};

/** The tick is the heaviest; the icons of the navigation, which are larger, the lightest. */
export type IconStroke = "icon" | "light" | "tick";

const STROKE: Record<IconStroke, string> = { icon: "stroke-icon", light: "stroke-icon-light", tick: "stroke-tick" };

const isFilled = (name: IconName): name is keyof typeof FILLED => name in FILLED;

type Props = {
  name: IconName;
  size?: IconSize;
  stroke?: IconStroke;
  /** What the icon says, where nothing beside it does. Without it the icon is for the eye only. */
  label?: string;
  className?: string;
};

/** An icon in the colour of the text around it. */
export function Icon({ name, size = 16, stroke = "icon", label, className }: Props) {
  const look = isFilled(name) ? "fill-current" : classNames("fill-none stroke-current", STROKE[stroke]);
  return (
    <svg
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      className={classNames("shrink-0", SIZE[size], look, className)}
    >
      {isFilled(name) ? FILLED[name] : STROKED[name]}
    </svg>
  );
}

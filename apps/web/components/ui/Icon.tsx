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
  plus: <path d="M12 5v14M5 12h14" />,
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

const isFilled = (name: IconName): name is keyof typeof FILLED => name in FILLED;

type Props = { name: IconName; size?: IconSize; className?: string };

/** An icon for the eye only. What it means is said by the control it is in. */
export function Icon({ name, size = 16, className }: Props) {
  const look = isFilled(name) ? "fill-current" : "fill-none stroke-current stroke-icon";
  return (
    <svg
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={classNames("shrink-0", SIZE[size], look, className)}
    >
      {isFilled(name) ? FILLED[name] : STROKED[name]}
    </svg>
  );
}

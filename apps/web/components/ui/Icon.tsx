import type { ReactNode } from "react";
import { classNames } from "./class-names";

// Stroke icons on a 24 by 24 view box, in the colour of the text around them
// (docs/design/design-tokens.md, "Icons"). The paths are those of the approved mockups.
const STROKED = {
  array: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 12h18M9 4v16M15 4v16" />
    </>
  ),
  "arrow-left": <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
  "arrow-right": <path d="M5 12h14m0 0-6-6m6 6-6 6" />,
  "arrow-up": <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-up": <path d="m6 15 6-6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  download: <path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  handover: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 13h6M9 17h6" />
    </>
  ),
  home: <path d="m4 11 8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="8" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  pin: (
    <>
      <path d="M12 21s6-5.7 6-11a6 6 0 0 0-12 0c0 5.3 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  note: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5v.5" />
    </>
  ),
  performance: <path d="M5 20V10M12 20V4M19 20v-7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  roof: (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v9h14v-9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  strings: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  studio: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  tick: <path d="m5 12 5 5 9-10" />,
  upload: <path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" />,
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

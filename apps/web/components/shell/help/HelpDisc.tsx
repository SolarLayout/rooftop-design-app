"use client";

import { classNames } from "@/components/ui/class-names";
import type { ShownAs } from "@/components/ui/shown-as";
import { Tooltip } from "@/components/ui/Tooltip";
import { MANIFEST, type HelpKey } from "@/lib/help/manifest.gen";
import { useHelp } from "./HelpProvider";

type Props = {
  topic: HelpKey;
  /** The section's own value, so that the sheet marks it among the options ("Your choice"). */
  value?: string;
  /** A state shown without a pointer: for the kit. */
  shownAs?: ShownAs;
  className?: string;
};

// The disc of the primary action (components.md, "Help disc and help sheet"): its orange, light and shadow, a ? in its ink;
// 16 in a press of 24 on desktop, 20 in a press of 44 on touch; held in and ringed while its topic is shown.
const TARGET = "group inline-grid size-touch shrink-0 cursor-pointer place-items-center rounded-full focus-ring -my-2.5 desktop:-my-1 desktop:size-6";
const DISC = classNames(
  "grid size-5 place-items-center rounded-full bg-accent text-accent-ink shadow-primary desktop:size-4",
  "group-hovered:raised-by-hover group-hovered:bg-accent-hover group-hovered:shadow-primary-hover",
  "group-pressed:translate-y-0 group-pressed:bg-accent-pressed group-pressed:shadow-primary-pressed",
);
const HELD = "bg-accent-pressed shadow-help-held";

/** The ? beside a section heading: its summary under the pointer, its topic in the help sheet when pressed. */
export function HelpDisc({ topic, value, shownAs, className }: Props) {
  const help = useHelp();
  if (!help) return null;
  const entry = MANIFEST[topic];
  const isShown = help.shown?.key === topic;
  return (
    <Tooltip words={entry.summary} more="Click for more" className={className}>
      <button
        type="button"
        aria-label={`Help: ${entry.title}`}
        aria-haspopup="dialog"
        aria-expanded={isShown}
        data-help={topic}
        data-shown-as={shownAs}
        onClick={() => help.open(topic, value)}
        className={TARGET}
      >
        <span className={classNames(DISC, isShown && HELD)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3 desktop:size-2.5">
            <path d="M8.6 8.6a3.4 3.4 0 1 1 4.6 3.2c-.8.4-1.2 1.1-1.2 2v.4" />
            <path d="M12 18.4h.01" />
          </svg>
        </span>
      </button>
    </Tooltip>
  );
}

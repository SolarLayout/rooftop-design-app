"use client";

import type { ShownAs } from "@/components/ui/shown-as";
import { Tooltip } from "@/components/ui/Tooltip";
import { MANIFEST, type HelpKey } from "@/lib/help/manifest.gen";
import { discLook, TARGET } from "./help-disc-look";
import { useHelp } from "./HelpProvider";

type Props = {
  topic: HelpKey;
  /** The section's own value, so that the sheet marks it among the options ("Your choice"). */
  value?: string;
  /** The words of that mark where the section says who set the value ("Set for India", D87); "Your choice" without. */
  mark?: string;
  /** A state shown without a pointer: for the kit. */
  shownAs?: ShownAs;
  className?: string;
};

/** The ? beside a section heading: its summary under the pointer, its topic in the help sheet when pressed. */
export function HelpDisc({ topic, value, mark, shownAs, className }: Props) {
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
        onClick={() => help.open(topic, value, mark)}
        className={TARGET}
      >
        <span className={discLook(isShown)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3">
            <path d="M8.6 8.6a3.4 3.4 0 1 1 4.6 3.2c-.8.4-1.2 1.1-1.2 2v.4" />
            <path d="M12 18.4h.01" />
          </svg>
        </span>
      </button>
    </Tooltip>
  );
}

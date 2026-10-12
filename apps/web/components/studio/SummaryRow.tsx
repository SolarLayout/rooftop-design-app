"use client";

import { useId, type ReactNode } from "react";
import { HelpDisc } from "@/components/shell/help/HelpDisc";
import { Icon } from "@/components/ui/Icon";
import { SECTION } from "@/components/ui/section-look";
import type { HelpKey } from "@/lib/help/manifest.gen";
import { useSectionOpen } from "./use-section-open";

type Props = {
  /** The section's id on the device ("roof.edges"): what the user opened or closed is remembered by it. */
  id: string;
  title: string;
  help?: HelpKey;
  /** The section's own value and the words of its mark, for its topic in the help sheet (D80, D87). */
  helpValue?: string;
  helpMark?: string;
  /** The section's facts on one line, in text-2; null while there are none yet. */
  facts: string | null;
  /** Who set it (V2 · 3): Default, From the weather, Set for <country>, Yours; null where nothing is set. */
  setBy: string | null;
  /** The step's own sections are open the first time. */
  opensFirst?: boolean;
  /** Open while this holds, whatever the user left: an obstacle selected on the roof shows its card. */
  isHeldOpen?: boolean;
  children: ReactNode;
};

/**
 * A section of the work column as one line (V2 · 3, D97; the board "The Studio's first open"): its name with its ?, its
 * facts on one line, who set it at the right, a chevron; pressed, its fields open in place. 56 high, 64 on touch. The
 * whole row is the button; the ? stands above it.
 */
export function SummaryRow({ id, title, help, helpValue, helpMark, facts, setBy, opensFirst = false, isHeldOpen = false, children }: Props) {
  const [isLeftOpen, setOpen] = useSectionOpen(id, opensFirst);
  const isOpen = isLeftOpen || isHeldOpen;
  const heading = useId();
  const body = useId();
  return (
    <section aria-labelledby={heading} data-testid={`summary-${id}`} className="border-b border-line-subtle">
      <div className="relative flex min-h-16 items-center gap-3 py-2.5 desktop:min-h-14">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <h2 id={heading} className={SECTION}>
              <button type="button" aria-expanded={isOpen} aria-controls={body} onClick={() => setOpen(!isOpen)} className="cursor-pointer text-left focus-ring after:absolute after:inset-0">
                {title}
              </button>
            </h2>
            {help ? <HelpDisc topic={help} className="relative" {...(helpValue === undefined ? {} : { value: helpValue })} {...(helpMark === undefined ? {} : { mark: helpMark })} /> : null}
          </div>
          {facts ? <p className="truncate type-body-touch text-text-2 desktop:type-body">{facts}</p> : null}
        </div>
        {setBy ? <span className="shrink-0 type-unit text-text-3">{setBy}</span> : null}
        <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={16} className="shrink-0 text-text-3" />
      </div>
      {isOpen ? (
        <div id={body} className="flex flex-col gap-row pb-group">
          {children}
        </div>
      ) : null}
    </section>
  );
}

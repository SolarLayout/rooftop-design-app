"use client";

import { useResults } from "@/components/shell/stores";
import { useSectionOpen } from "@/components/shell/use-section-open";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { designOf, readoutsOf } from "@/lib/stores/results-store";
import { figuresOf } from "@/lib/studio/sun-figures";
import { SunCardBody } from "./SunInspector";

/** Where the card stands on the stage: under the title, at the left, above the timeline; the chip takes its place. */
const PLACE = "absolute top-28 left-6 z-stage-overlay";
/** The room the open card may take: from under the title to over the timeline; it scrolls inside when it needs more. */
const ROOM = "pointer-events-none absolute top-28 bottom-26 left-6 z-stage-overlay flex flex-col items-start";

/**
 * The card of the Sun view on the stage (V2 · 7, D103; the board "The Roof and Array steps", frames 5 and 6): "Shade over the
 * year" with its close button, the energy lost to shade by its cause and what is drawn on the roof. Closed, it folds to a chip at its
 * place, "Shade over the year 0.92 %", that opens it again; the arc and the timeline stay. Open or folded is remembered on this
 * device. Desktop alone: on touch the sheet holds the card's content.
 */
export function ShadeCard({ className }: { className?: string }) {
  const [isOpen, setOpen] = useSectionOpen("sun.card", true);
  const design = useResults(designOf);
  const readouts = useResults(readoutsOf);
  const total = figuresOf(design, readouts?.keepout_area_m2 ?? null).total;

  if (!isOpen) {
    return (
      <button
        type="button"
        data-testid="shade-chip"
        aria-expanded={false}
        onClick={() => setOpen(true)}
        className={classNames(PLACE, "flex h-touch cursor-pointer items-center gap-2 rounded-control border border-line bg-control px-3 shadow-raised press-motion focus-ring hovered:border-line-hover desktop:h-10", className)}
      >
        <span className="type-body">Shade over the year</span>
        {total === null ? null : <span className="type-body text-text-2 tabular-nums">{total} %</span>}
        <Icon name="chevron-down" size={14} className="text-text-2" />
      </button>
    );
  }
  return (
    <div className={classNames(ROOM, className)}>
      <section aria-label="Shade over the year" data-testid="shade-card" className="pointer-events-auto relative min-h-0 w-80 overflow-y-auto rounded-card border border-line bg-surface-1 p-4 shadow-float">
        <IconButton kind="quiet" size="xs" icon="close" iconSize={18} label="Close Shade over the year" onClick={() => setOpen(false)} className="absolute top-3 right-3" />
        <SunCardBody size="desktop" />
      </section>
    </div>
  );
}

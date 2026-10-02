"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import type { CurrentPerMppt, Inverter } from "@/lib/api";
import { inverterCardOf } from "@/lib/studio/inverter-card";

type Props = {
  /** The inverter of the run, with the current per MPPT of its file; null before a run read one. */
  inverter: { inverter: Inverter; current: CurrentPerMppt } | null;
  /** The current per MPPT the user entered in place of the file's; null for none. */
  entered: number | null;
};

const CARD = "flex items-center gap-3.5 rounded-card-s border border-line bg-surface-1 p-card-compact shadow-card";

/** The inverter as a drawing: a box with its three lines, the first in the accent (the board "Studio, Strings lens"). */
function InverterGlyph() {
  return (
    <span aria-hidden="true" className="flex h-14 w-11 shrink-0 flex-col items-center justify-center gap-1.25 rounded-xs border-outline border-line-strong bg-surface-2">
      <span className="h-0.75 w-5.5 rounded-full bg-accent" />
      <span className="h-0.75 w-5.5 rounded-full bg-line-strong" />
      <span className="h-0.75 w-5.5 rounded-full bg-line-strong" />
    </span>
  );
}

/**
 * The inverter of the design (the board "Studio, Strings lens"; docs/design/components.md, "Cards"): the model,
 * the maker as the file states it with the power and the MPPTs, the current per MPPT and the inputs. Before a run
 * read the inverter, skeletons.
 */
export function InverterCard({ inverter, entered }: Props) {
  if (!inverter) {
    return (
      <section aria-label="Inverter" data-testid="inverter-card" className={CARD}>
        <InverterGlyph />
        <div className="flex grow flex-col gap-2">
          <Skeleton kind="value" className="w-30" />
          <Skeleton kind="label" className="w-45" />
          <Skeleton kind="label" className="w-40" />
        </div>
      </section>
    );
  }
  const card = inverterCardOf(inverter.inverter, inverter.current, entered);
  return (
    <section aria-label="Inverter" data-testid="inverter-card" className={CARD}>
      <InverterGlyph />
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <p data-testid="inverter-name" className="truncate font-semibold">
          {card.name}
        </p>
        <p data-testid="inverter-line" className="truncate type-caption text-text-2">
          {card.line}
        </p>
        <p data-testid="inverter-facts" className="truncate type-value-xs text-text-3">
          {card.facts}
        </p>
      </div>
    </section>
  );
}

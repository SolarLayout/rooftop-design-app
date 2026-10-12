"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { StatusMark } from "@/components/ui/StatusMark";
import { inverterCardOf, type InverterShown } from "@/lib/studio/inverter-card";
import { ChangeButton } from "./ChangeButton";

type Props = {
  /** The inverter shown, with the current per MPPT of its file; null before a run or a file gave one. */
  inverter: InverterShown | null;
  /** The current per MPPT the user entered in place of the file's; null for none. */
  entered: number | null;
  /** Opens the picker of the library (D75). */
  onChange: () => void;
};

const CARD = "flex flex-col gap-2.5 rounded-row border border-line bg-surface-1 p-card-compact shadow-card";

/** The inverter as a drawing: a box with its three lines, the first in the accent (the board "Studio, Strings lens"). */
function InverterGlyph() {
  return (
    <span aria-hidden="true" className="flex h-14 w-11 shrink-0 flex-col items-center justify-center gap-1.25 rounded-control border-outline border-line-strong bg-surface-2">
      <span className="h-0.75 w-5.5 rounded-full bg-accent" />
      <span className="h-0.75 w-5.5 rounded-full bg-line-strong" />
      <span className="h-0.75 w-5.5 rounded-full bg-line-strong" />
    </span>
  );
}

/**
 * The inverter of the design (the boards "Studio, Strings lens" and "Inverter and sizing"; docs/design/components.md,
 * "Cards"): the model, the maker as the file states it with the power and the MPPTs, the current per MPPT and the
 * inputs, Change (D75), and the file's name under the card. A current per MPPT that is not known has its line under
 * the rest, with a note mark. Before a run read the inverter, skeletons.
 */
export function InverterCard({ inverter, entered, onChange }: Props) {
  if (!inverter) {
    return (
      <section aria-label="Inverter" data-testid="inverter-card" className={CARD}>
        <div className="flex items-center gap-3.5">
          <InverterGlyph />
          <div className="flex grow flex-col gap-2">
            <Skeleton kind="value" className="w-30" />
            <Skeleton kind="label" className="w-45" />
            <Skeleton kind="label" className="w-40" />
          </div>
        </div>
      </section>
    );
  }
  const card = inverterCardOf(inverter.inverter, inverter.current, entered);
  const facts = (
    <p data-testid="inverter-facts" className={card.isCurrentKnown ? "type-body-touch desktop:type-body text-text-3" : "flex items-center gap-2 type-body-touch desktop:type-body text-text-2"}>
      {card.isCurrentKnown ? null : <StatusMark kind="note" label="Note" wordsShown={false} size={14} />}
      <span>{card.facts}</span>
    </p>
  );
  return (
    <div className="flex flex-col gap-2">
      <section aria-label="Inverter" data-testid="inverter-card" className={CARD}>
        <div className="flex items-center gap-3.5">
          <InverterGlyph />
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <p data-testid="inverter-name" className="truncate font-semibold">
              {card.name}
            </p>
            <p data-testid="inverter-line" className="type-body-touch desktop:type-body text-text-2">
              {card.line}
            </p>
            {card.isCurrentKnown ? facts : null}
          </div>
          <ChangeButton kind="inverters" onChange={onChange} />
        </div>
        {card.isCurrentKnown ? null : facts}
      </section>
      <code data-testid="inverter-file" className="type-body-touch desktop:type-body text-text-3">
        {card.file}
      </code>
    </div>
  );
}

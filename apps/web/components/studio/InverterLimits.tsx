"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { NumberField } from "@/components/ui/NumberField";
import { StatusMark } from "@/components/ui/StatusMark";
import type { Project } from "@/lib/api";
import type { InverterShown } from "@/lib/studio/inverter-card";
import { acCableFieldOf, currentFieldOf, INVERTER_RANGES } from "@/lib/studio/inverter-fields";

type Props = {
  document: Project;
  /** The inverter shown on the card, with the current per MPPT of its file; null before a run read one. */
  inverter: InverterShown | null;
  /** Grows by one for each request to put the focus in the current per MPPT (the MPPT table's link). */
  focusCurrent: number;
  /** The current per MPPT entered, or given back to the file's (null). */
  onCurrent: (value: number | null) => void;
  onCable: (value: number) => void;
};

/**
 * Inverter limits and cabling (the board "Inverter and sizing"; plan/phase-07-plan.md, decision 16), inside the Strings
 * step's summary row (V2 · 3): the current per MPPT, empty for the file's with where that comes from and the API's note,
 * a value entered with "Use the file's"; and the AC cable per inverter in metres. A value entered commits an edit of the
 * document; the run follows.
 */
export function InverterLimits({ document, inverter, focusCurrent, onCurrent, onCable }: Props) {
  const current = useRef<HTMLDivElement>(null);
  const field = currentFieldOf(document, inverter);
  const cable = acCableFieldOf(document);

  useEffect(() => {
    if (focusCurrent === 0) return;
    const input = current.current?.querySelector("input");
    input?.scrollIntoView({ block: "center" });
    input?.focus();
  }, [focusCurrent]);

  return (
    <div className="flex flex-col gap-3">
      <div ref={current} className="flex flex-col gap-1.5">
        <NumberField label="Current per MPPT" detail={field.detail} value={field.value} unit="A" range={INVERTER_RANGES.imax_mppt_override} onCommit={onCurrent} />
        {field.reset ? (
          <Button kind="quiet" size="s" className="self-end" onClick={() => onCurrent(null)}>
            {field.reset}
          </Button>
        ) : null}
        {field.note ? (
          <p data-testid="current-note" className="flex items-start gap-2 rounded-row border border-note-line bg-note-surface px-3 py-2.5 type-body-touch desktop:type-body text-text">
            <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
            {field.note}
          </p>
        ) : null}
      </div>
      <NumberField label="AC cable per inverter" detail={cable.detail} value={cable.value} unit="m" range={INVERTER_RANGES.ac_cable_m} onCommit={onCable} />
    </div>
  );
}

"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { NumberField } from "@/components/ui/NumberField";
import { StatusMark } from "@/components/ui/StatusMark";
import type { Project } from "@/lib/api";
import type { InverterShown } from "@/lib/studio/inverter-card";
import { acCableFieldOf, currentFieldOf, INVERTER_RANGES, limitsRowOf } from "@/lib/studio/inverter-fields";

const ROW = "flex h-11 w-full cursor-pointer items-center gap-2.5 px-3 text-left type-body-touch desktop:type-body focus-ring";

type Props = {
  document: Project;
  /** The inverter shown on the card, with the current per MPPT of its file; null before a run read one. */
  inverter: InverterShown | null;
  isOpen: boolean;
  onOpen: (isOpen: boolean) => void;
  /** Grows by one for each request to put the focus in the current per MPPT (the MPPT table's link). */
  focusCurrent: number;
  /** The current per MPPT entered, or given back to the file's (null). */
  onCurrent: (value: number | null) => void;
  onCable: (value: number) => void;
};

/**
 * Inverter limits and cabling (the board "Inverter and sizing"; plan/phase-07-plan.md, decision 16): a closed row
 * at the end of the inspector with the current per MPPT and the AC cable; opened in place, the current per MPPT,
 * empty for the file's with where that comes from and the API's note, a value entered with "Use the file's"; and
 * the AC cable per inverter in metres. A value entered commits an edit of the document; the run follows.
 */
export function InverterLimits({ document, inverter, isOpen, onOpen, focusCurrent, onCurrent, onCable }: Props) {
  const body = useId();
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
    <section aria-label="Inverter limits and cabling" className={classNames("rounded-row border border-line bg-surface-1", isOpen ? "shadow-card" : "shadow-row")}>
      <button type="button" aria-expanded={isOpen} aria-controls={body} className={ROW} onClick={() => onOpen(!isOpen)}>
        <span className={classNames("grow", isOpen ? "font-medium text-text" : "text-text-2")}>Inverter limits and cabling</span>
        <span data-testid="limits-row" className="type-body-touch desktop:type-body whitespace-nowrap">
          {limitsRowOf(document, inverter)}
        </span>
        <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={16} />
      </button>
      {isOpen ? (
        <div id={body} className="flex flex-col gap-3 border-t border-line-subtle px-3 pt-3 pb-4">
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
      ) : null}
    </section>
  );
}

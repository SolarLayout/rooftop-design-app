"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { useId } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { StatusMark } from "@/components/ui/StatusMark";
import type { BeforeAVoltage } from "@/lib/studio/strings-view";
import { VOLTAGES, type Volts } from "@/lib/studio/voltages";
import { SECTION } from "./inspector-look";

const VOLTAGE_OPTIONS = VOLTAGES.map((volts) => ({ value: String(volts) as `${Volts}`, label: `${volts} V` }));

const CHOICE =
  "h-13 cursor-pointer rounded-row border border-line-strong bg-control font-mono type-value-s font-medium shadow-raised press-motion focus-ring hovered:raised-by-hover hovered:border-line-hover hovered:bg-control-hover pressed:lowered-by-press pressed:bg-control-pressed pressed:shadow-pressed";

/**
 * The decision of the system voltage, while there is none (docs/design/components.md, "Decision card"; the
 * board "Studio, Strings lens, no system voltage yet"; plan/phase-07-plan.md, decision 1): nothing is chosen,
 * the three choices are large raised buttons, and the line under them says which ratings set the limit.
 * Under it what waits for the choice and what is done already.
 */
export function VoltageDecision({ view, onChoose }: { view: BeforeAVoltage; onChoose: (volts: Volts) => void }) {
  const heading = useId();
  return (
    <section aria-labelledby={heading} data-testid="voltage-decision" className="flex flex-col gap-3 rounded-card-s border border-accent bg-note-surface p-4 shadow-halo-decision">
      <div className="flex items-center gap-2.5">
        <StatusMark kind="note" label="Yours to decide" wordsShown={false} size={20} />
        <h2 id={heading} className="type-title">
          Choose a system voltage
        </h2>
      </div>
      <p className="type-small text-text">Nothing is sized until you choose. This one is yours to decide: it depends on the site and its equipment.</p>
      <div role="group" aria-label="System voltage" className="grid grid-cols-3 gap-2">
        {VOLTAGES.map((volts) => (
          <button key={volts} type="button" className={CHOICE} onClick={() => onChoose(volts)}>
            {volts} V
          </button>
        ))}
      </div>
      {view.limitLine ? <p className="type-caption text-text-2">{view.limitLine}</p> : null}
    </section>
  );
}

/** What waits for the voltage, and what the run did already (the same board). */
export function WaitingAndDone({ view }: { view: BeforeAVoltage }) {
  const waiting = useId();
  const done = useId();
  return (
    <>
      <section aria-labelledby={waiting} className="flex flex-col gap-2">
        <SectionHeading id={waiting} help="studio.section.system-voltage">
          Waiting for your choice
        </SectionHeading>
        <ul className="flex flex-col">
          {view.waiting.map((what) => (
            <li key={what} className="flex h-11 items-center gap-2.5 border-b border-line-subtle text-text-2 last:border-b-0">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full border-outline border-line-strong" />
              {what}
            </li>
          ))}
        </ul>
      </section>
      {view.done.length > 0 ? (
        <section aria-labelledby={done} className="flex flex-col gap-2">
          <h2 id={done} className={SECTION}>
            Already done
          </h2>
          <ul className="flex flex-col">
            {view.done.map((what) => (
              <li key={what} className="flex h-10 items-center gap-2.5">
                <StatusMark kind="fits" label="Done" wordsShown={false} size={16} />
                {what}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/** The voltage once chosen: three in a segmented control, the user's choice (the board "Studio, Strings lens"). */
export function SystemVoltage({ voltage, onChoose }: { voltage: Volts; onChoose: (volts: Volts) => void }) {
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <SectionHeading id={heading} help="studio.section.system-voltage" value={String(voltage)}>
          System voltage
        </SectionHeading>
        <span className="ml-auto type-caption text-text-3">Your choice</span>
      </div>
      <Segmented label="System voltage" fill options={VOLTAGE_OPTIONS} value={String(voltage) as `${Volts}`} onChange={(value) => onChoose(Number(value) as Volts)} />
    </section>
  );
}

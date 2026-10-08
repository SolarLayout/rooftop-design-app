"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { StatusMark } from "@/components/ui/StatusMark";
import type { VoltageWords } from "@/lib/studio/voltage-words";
import { VOLTAGES, type Volts } from "@/lib/studio/voltages";

const VOLTAGE_OPTIONS = VOLTAGES.map((volts) => ({ value: String(volts) as `${Volts}`, label: `${volts} V` }));

type Props = {
  /** The design's voltage; none for a design the app did not make (D87). */
  voltage: Volts | null;
  /** What the lens says of it; none without a voltage. */
  words: VoltageWords | null;
  onChoose: (volts: Volts) => void;
};

/**
 * The system voltage (the boards "System voltage · Set by the user's country"; D87, D88): three in a segmented control,
 * who set it beside the heading, where the app's value comes from under it, what the equipment's rating does to the
 * strings, and a higher voltage the equipment takes. The app never moves the value: a press here is the user's choice.
 */
export function SystemVoltage({ voltage, words, onChoose }: Props) {
  const heading = useId();
  return (
    <section aria-labelledby={heading} data-testid="system-voltage" className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <SectionHeading id={heading} help="studio.section.system-voltage" value={voltage === null ? undefined : String(voltage)} mark={words?.who}>
          System voltage
        </SectionHeading>
        {words ? <span className="ml-auto type-caption text-text-3">{words.who}</span> : null}
      </div>
      <Segmented label="System voltage" fill options={VOLTAGE_OPTIONS} value={voltage === null ? null : (String(voltage) as `${Volts}`)} onChange={(value) => onChoose(Number(value) as Volts)} />
      {words?.line ? <p className="type-caption text-text-2">{words.line}</p> : null}
      {words?.limit ? <p className="type-caption text-text-2">{words.limit}</p> : null}
      {words?.note ? (
        <div data-testid="voltage-note" className="flex items-start gap-2.5 rounded-row border border-note-line bg-surface-1 px-4 py-3 type-small">
          <StatusMark kind="note" label="Sized to the equipment" wordsShown={false} size={16} />
          <span className="flex grow flex-col gap-2">
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{words.note.title}</span>
              <span className="type-caption text-text-2">{words.note.detail}</span>
            </span>
            {words.note.use !== null ? <UseButton volts={words.note.use} onChoose={onChoose} className="self-start" /> : null}
          </span>
        </div>
      ) : null}
      {words?.offer ? (
        <div data-testid="voltage-offer" className="flex items-center gap-3 type-caption text-text-2">
          <span className="grow">{words.offer.words}</span>
          <UseButton volts={words.offer.use} onChoose={onChoose} />
        </div>
      ) : null}
    </section>
  );
}

function UseButton({ volts, onChoose, className }: { volts: Volts; onChoose: (volts: Volts) => void; className?: string }) {
  return (
    <Button size="s" className={className} onClick={() => onChoose(volts)}>
      Use {volts}&nbsp;V
    </Button>
  );
}

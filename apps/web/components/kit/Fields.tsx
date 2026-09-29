"use client";

import { useRef, useState } from "react";
import { NumberField } from "@/components/ui/NumberField";
import type { Range } from "@/components/ui/number-entry";
import { Stepper } from "@/components/ui/Stepper";
import { Example, Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const SETBACK: Range = { min: 0, max: 5, decimals: 2, step: 0.25 };
const CLEARANCE: Range = { min: 0, max: 3, decimals: 2, step: 0.05 };
const MODULES_IN_TILT = { min: 1, max: 4, decimals: 0, step: 1 };

/** A value, and how often it was committed: the kit says both, so that a test can hold them. */
function useCommitted(name: string, first: number, onPress: (what: string) => void) {
  const [value, setValue] = useState(first);
  const commits = useRef(0);

  function onCommit(next: number) {
    commits.current += 1;
    setValue(next);
    onPress(`${name}, ${next}, commit ${commits.current}`);
  }
  return { value, onCommit };
}

export function Fields({ onPress }: Props) {
  const setback = useCommitted("Setback", 1, onPress);
  const clearance = useCommitted("Lower-edge clearance", 0.5, onPress);
  const modules = useCommitted("Modules in tilt", 2, onPress);

  return (
    <Section title="Recessed: fields">
      <Row label="Number field, the label inside">
        <div className="grid w-full max-w-90 gap-3">
          <Example name="number-field" caption="Rest. From 0 to 5 m, in steps of 0.25">
            <NumberField label="Setback" unit="m" range={SETBACK} labelInside className="w-full" {...setback} />
          </Example>
          <Example name="number-field-focus" caption="Focus">
            <NumberField label="Setback" unit="m" range={SETBACK} labelInside shownAs="focus" className="w-full" value={1.25} onCommit={() => undefined} />
          </Example>
          <Example name="number-field-disabled" caption="Cannot be used">
            <NumberField label="Setback" unit="m" range={SETBACK} labelInside disabled className="w-full" value={1} onCommit={() => undefined} />
          </Example>
        </div>
      </Row>
      <Row label="In a row of the inspector, the label before the field">
        <div className="grid w-full max-w-90 gap-1">
          <Example name="stepper" caption="Stepper, from 1 to 4">
            <Stepper label="Modules in tilt" range={MODULES_IN_TILT} className="w-full" {...modules} />
          </Example>
          <Example name="number-field-row" caption="Number field">
            <NumberField label="Lower-edge clearance" unit="m" range={CLEARANCE} className="w-full" {...clearance} />
          </Example>
        </div>
      </Row>
    </Section>
  );
}

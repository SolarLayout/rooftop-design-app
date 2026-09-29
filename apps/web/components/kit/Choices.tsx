"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { Example, Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const ORIENTATIONS = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
] as const;

const DAYS = [
  { value: "winter", label: "Winter solstice" },
  { value: "june", label: "21 Jun" },
  { value: "march", label: "21 Mar" },
] as const;

// Shown once a system voltage was chosen; before that it is asked for with a decision card.
const VOLTAGES = [
  { value: "600", label: "600 V" },
  { value: "1000", label: "1000 V", disabled: true },
  { value: "1500", label: "1500 V" },
] as const;

const LENSES = [
  { value: "roof", label: "Roof" },
  { value: "array", label: "Array" },
  { value: "sun", label: "Sun" },
  { value: "strings", label: "Strings" },
] as const;

type ValueOf<T extends ReadonlyArray<{ value: string }>> = T[number]["value"];

export function Choices({ onPress }: Props) {
  const [orientation, setOrientation] = useState<ValueOf<typeof ORIENTATIONS>>("portrait");
  const [day, setDay] = useState<ValueOf<typeof DAYS>>("winter");
  const [voltage, setVoltage] = useState<ValueOf<typeof VOLTAGES>>("600");
  const [lens, setLens] = useState<ValueOf<typeof LENSES>>("array");
  const [shadeFree, setShadeFree] = useState(true);
  const [shaded, setShaded] = useState(false);

  return (
    <Section title="Choice">
      <Row label="Segmented">
        <Example name="segmented" caption="Two choices">
          <Segmented
            label="Orientation"
            options={ORIENTATIONS}
            value={orientation}
            onChange={(value) => {
              setOrientation(value);
              onPress(`Orientation, ${value}`);
            }}
          />
        </Example>
        <Example name="segmented-three" caption="Three">
          <Segmented label="Design day" options={DAYS} value={day} onChange={setDay} />
        </Example>
        <Example name="segmented-with-disabled" caption="One cannot be taken">
          <Segmented label="System voltage" options={VOLTAGES} value={voltage} onChange={setVoltage} />
        </Example>
      </Row>
      <Row label="Segmented, filling the width">
        <div data-testid="kit-segmented-fill" className="w-full max-w-90">
          <Segmented label="Lenses" options={LENSES} value={lens} onChange={setLens} fill />
        </div>
      </Row>
      <Row label="Switch">
        <Example name="switch-on" caption="On">
          <Switch
            label="Keep row pitch shade-free automatically"
            on={shadeFree}
            onChange={(on) => {
              setShadeFree(on);
              onPress(`Keep row pitch shade-free automatically, ${on ? "on" : "off"}`);
            }}
          />
        </Example>
        <Example name="switch-off" caption="Off">
          <Switch
            label="Allow shaded positions"
            on={shaded}
            onChange={(on) => {
              setShaded(on);
              onPress(`Allow shaded positions, ${on ? "on" : "off"}`);
            }}
          />
        </Example>
        <Example name="switch-disabled" caption="Cannot be used">
          <Switch label="Follow the roof edge" on onChange={() => onPress("Follow the roof edge, turned")} disabled />
        </Example>
      </Row>
    </Section>
  );
}

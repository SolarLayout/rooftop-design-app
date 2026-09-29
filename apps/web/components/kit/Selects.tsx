"use client";

import { useState } from "react";
import { OptionList, Select, SelectTrigger } from "@/components/ui/Select";
import { Example, Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const WEATHER = [
  { value: "pvgis", label: "PVGIS TMY", fact: "Typical year" },
  { value: "nasa", label: "NASA POWER", fact: "The year 2023" },
  { value: "csv", label: "CSV file", fact: "Your own hours" },
] as const;

type Source = (typeof WEATHER)[number]["value"];

export function Selects({ onPress }: Props) {
  const [source, setSource] = useState<Source>("pvgis");

  return (
    <Section title="Select">
      <Row label="Closed">
        <Example name="select" caption="Rest. Press it, or the arrow down">
          <Select
            label="Weather"
            options={WEATHER}
            value={source}
            onChange={(value) => {
              setSource(value);
              onPress(`Weather, ${value}`);
            }}
          />
        </Example>
        <Example name="select-disabled" caption="Cannot be used">
          <Select label="Weather" options={WEATHER} value="pvgis" onChange={() => undefined} disabled />
        </Example>
      </Row>
      <Row label="Open, the pointer on the second choice">
        <div data-testid="kit-select-open" className="flex w-full max-w-80 flex-col items-start gap-1.5">
          <SelectTrigger label="Weather" value="PVGIS TMY" open tabIndex={-1} />
          <OptionList
            label="Weather"
            options={WEATHER}
            value="pvgis"
            marked={1}
            idOf={(index) => `kit-weather-${index}`}
            className="w-full"
          />
        </div>
      </Row>
    </Section>
  );
}

"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Example, Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const PARTS = [
  { value: "losses", label: "Losses" },
  { value: "monthly", label: "Monthly" },
  { value: "years", label: "25 years" },
] as const;

const PARTS_ONE_OFF = PARTS.map((part) => (part.value === "years" ? { ...part, disabled: true } : part));

const REVIEW = [
  { value: "notes", label: "Notes", count: 2 },
  { value: "assumptions", label: "Assumptions", count: 14 },
  { value: "weather", label: "Weather" },
] as const;

const ALL_PARTS = [
  { value: "summary", label: "Summary" },
  ...PARTS,
  { value: "assumptions", label: "Assumptions" },
  { value: "weather", label: "Weather" },
] as const;

const SAYS: Record<string, string> = {
  losses: "The loss chain, from the irradiation to the energy at the meter.",
  monthly: "Monthly energy, as a chart and as a table.",
  years: "The energy of 25 years.",
};

type Part = (typeof PARTS)[number]["value"];

const nothing = () => undefined;

export function TabRows({ onPress }: Props) {
  const [part, setPart] = useState<Part>("losses");
  const [partOfTwo, setPartOfTwo] = useState<Part>("losses");
  const [long, setLong] = useState<(typeof ALL_PARTS)[number]["value"]>("losses");

  return (
    <Section title="Tabs">
      <Row label="Parts of one card or one panel, of which one is shown">
        <div className="grid w-full max-w-115 gap-4">
          <Example name="tabs" caption="Rest: the first is taken. Press one, or use the arrows">
            <Tabs
              label="Performance"
              tabs={PARTS}
              value={part}
              onChange={(value) => {
                setPart(value);
                onPress(`Performance, ${value}`);
              }}
              className="w-full"
            >
              <p className="text-text-2">{SAYS[part]}</p>
            </Tabs>
          </Example>
          <Example name="tabs-hover" caption="The pointer on the second">
            <Tabs label="Performance" tabs={PARTS} value="losses" onChange={nothing} shownAs={{ monthly: "hover" }} className="w-full">
              <p className="text-text-2">{SAYS.losses}</p>
            </Tabs>
          </Example>
          <Example name="tabs-focus" caption="The keyboard focus on the one that is taken">
            <Tabs label="Performance" tabs={PARTS} value="losses" onChange={nothing} shownAs={{ losses: "focus" }} className="w-full">
              <p className="text-text-2">{SAYS.losses}</p>
            </Tabs>
          </Example>
          <Example name="tabs-disabled" caption="One cannot be taken">
            <Tabs label="Performance" tabs={PARTS_ONE_OFF} value={partOfTwo} onChange={setPartOfTwo} className="w-full">
              <p className="text-text-2">{SAYS[partOfTwo]}</p>
            </Tabs>
          </Example>
          <Example name="tabs-count" caption="With a count">
            <Tabs label="Review" tabs={REVIEW} value="notes" onChange={nothing} className="w-full">
              <p className="text-text-2">Two notes to review.</p>
            </Tabs>
          </Example>
          <Example name="tabs-long" caption="A row that is too long scrolls sideways">
            <Tabs label="Performance" tabs={ALL_PARTS} value={long} onChange={setLong} className="w-full">
              <p className="text-text-2">The part that is taken is brought into view.</p>
            </Tabs>
          </Example>
        </div>
      </Row>
    </Section>
  );
}

"use client";

import { Tip } from "@/components/ui/Tip";
import { Example, Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const WITH_A_POINTER = [
  { key: "Click", does: "inside the roof to pick it up" },
  { key: "Drag", does: "inside it to move it" },
  { key: "◯", does: "drag the round handle to turn it" },
  { key: "← ↑ → ↓", does: "nudge 0.1 m, with Shift 1 m" },
];

const ON_TOUCH = [
  { key: "Press", does: "an obstacle to pick it" },
  { key: "Drag", does: "it to move it" },
  { key: "◯", does: "turns a box or a building" },
];

/** The tip of a move the screen has just made possible (components.md, "Tip"): with a pointer and on touch. */
export function Tips({ onPress }: Props) {
  return (
    <Section title="Tip">
      <Row label="One at a time at the map's edge: Got it closes it for good on the device, the × hides the tips for now">
        <Example name="tip-pointer" caption="With a pointer: keys and clicks">
          <Tip title="Move or turn the roof" rows={WITH_A_POINTER} onGotIt={() => onPress("Got it")} onClose={() => onPress("Hide the tips")} className="w-75" />
        </Example>
        <Example name="tip-touch" caption="On touch: presses and fingers; three rows">
          <Tip title="Move or turn an obstacle" rows={ON_TOUCH} onGotIt={() => onPress("Got it")} onClose={() => onPress("Hide the tips")} className="w-75" />
        </Example>
      </Row>
    </Section>
  );
}

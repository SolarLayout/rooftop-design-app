"use client";

import { useRef, useState } from "react";
import { RangeSlider, type Span } from "@/components/ui/RangeSlider";
import { Slider } from "@/components/ui/Slider";
import type { Scale } from "@/components/ui/slider-steps";
import { Example, Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const TILT: Scale = { min: 0, max: 45, step: 1 };
// Hours of solar time, in steps of half an hour.
const HOURS: Scale = { min: 5, max: 19, step: 0.5 };
const HOUR_TICKS = [5, 8, 12, 16, 19].map((hour) => ({ value: hour, label: String(hour).padStart(2, "0") }));

const timeOf = (hours: number) =>
  `${String(Math.floor(hours)).padStart(2, "0")}:${String(Math.round((hours % 1) * 60)).padStart(2, "0")}`;

export function Sliders({ onPress }: Props) {
  const [tilt, setTilt] = useState(15);
  const [shadeFree, setShadeFree] = useState<Span>([9, 16]);
  const commits = useRef(0);

  function committed(what: string) {
    commits.current += 1;
    onPress(`${what}, commit ${commits.current}`);
  }

  return (
    <Section title="Sliders">
      <Row label="Slider">
        <div className="grid w-full max-w-90 gap-3">
          <Example name="slider" caption="Rest. From 0 to 45°, in steps of 1">
            <Slider
              label="Tilt"
              unit="°"
              scale={TILT}
              hint="Latitude 18.5° N suggests 15°"
              className="w-full"
              value={tilt}
              onCommit={(value) => {
                setTilt(value);
                committed(`Tilt, ${value}`);
              }}
            />
          </Example>
          <Example name="slider-focus" caption="Focus">
            <Slider label="Tilt" unit="°" scale={TILT} shownAs="focus" className="w-full" value={30} onCommit={() => undefined} />
          </Example>
          <Example name="slider-disabled" caption="Cannot be used">
            <Slider label="Tilt" unit="°" scale={TILT} disabled className="w-full" value={15} onCommit={() => undefined} />
          </Example>
        </div>
      </Row>
      <Row label="Range slider">
        <div className="grid w-full max-w-90 gap-3">
          <Example name="range-slider" caption="Two handles, half an hour apart at least">
            <RangeSlider
              label="Shade-free window"
              note="solar time"
              scale={HOURS}
              format={timeOf}
              ticks={HOUR_TICKS}
              className="w-full"
              value={shadeFree}
              onCommit={(value) => {
                setShadeFree(value);
                committed(`Shade-free window, ${value[0]} to ${value[1]}`);
              }}
            />
          </Example>
        </div>
      </Row>
    </Section>
  );
}

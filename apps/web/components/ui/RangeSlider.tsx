"use client";

import { SliderTrack, type Tick } from "./SliderTrack";
import type { Scale } from "./slider-steps";
import { useSlide } from "./use-slide";

export type Span = readonly [from: number, to: number];

type Props = {
  /** What is set, in words. It is the name of the group; each handle adds "from" or "to". */
  label: string;
  value: Span;
  /** Hears both ends once they are committed, and only when one is another than before. */
  onCommit: (value: [from: number, to: number]) => void;
  scale: Scale;
  /** What stays between the two handles at least; without it, one step. They never pass each other. */
  apart?: number;
  /** An end as it is shown: "09:00". */
  format: (value: number) => string;
  /** What follows an end in words, and stands at the right of the values: "solar time". */
  note?: string;
  ticks?: readonly Tick[];
  disabled?: boolean;
  className?: string;
};

/** Two ends on one scale, the track filled between them. */
export function RangeSlider({ label, value, onCommit, scale, apart = scale.step, format, note, ticks, disabled = false, className }: Props) {
  const slide = useSlide({
    values: value,
    scale,
    apart,
    disabled,
    onCommit: ([from, to]) => from !== undefined && to !== undefined && onCommit([from, to]),
  });
  const [from, to] = [slide.shown[0] ?? value[0], slide.shown[1] ?? value[1]];

  return (
    <div role="group" aria-label={label} className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-row">
          <span data-testid="value" className="type-value desktop:type-value-s">
            {format(from)} – {format(to)}
          </span>
          {note ? <span className="type-caption text-text-3">{note}</span> : null}
        </div>
        <SliderTrack
          slide={slide}
          scale={scale}
          apart={apart}
          names={[`${label}, from`, `${label}, to`]}
          inWords={(shown) => (note ? `${format(shown)} ${note}` : format(shown))}
          ticks={ticks}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

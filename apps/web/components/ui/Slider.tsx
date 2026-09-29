"use client";

import { shown as shownNumber, withUnit } from "./number-entry";
import { SliderTrack, type Tick } from "./SliderTrack";
import type { Scale } from "./slider-steps";
import { useSlide } from "./use-slide";

type Props = {
  /** What is set, in words. It is the name of the slider. */
  label: string;
  value: number;
  /** Hears the value once it is committed, and only when it is another than before. */
  onCommit: (value: number) => void;
  scale: Scale;
  /** Decimals of the value as it is shown. */
  decimals?: number;
  unit?: string;
  /** One line under the track: where the value comes from, or what is usual. */
  hint?: string;
  ticks?: readonly Tick[];
  disabled?: boolean;
  /** For the kit: the handle as it looks with the keyboard focus. */
  shownAs?: "focus";
  className?: string;
};

/**
 * One value on a scale. A drag or a key changes what is shown; the value is committed when the drag
 * ends or the key is released.
 */
export function Slider({ label, value, onCommit, scale, decimals = 0, unit, hint, ticks, disabled = false, shownAs, className }: Props) {
  const slide = useSlide({ values: [value], scale, apart: 0, disabled, onCommit: ([next]) => next !== undefined && onCommit(next) });
  const now = slide.shown[0] ?? value;

  return (
    <div className={className}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-row">
          <span className="text-text-2">{label}</span>
          <span className="flex items-baseline gap-1">
            <span data-testid="value" className="type-value desktop:type-value-s">
              {shownNumber(now, decimals)}
            </span>
            {unit ? <span className="type-caption text-text-2">{unit}</span> : null}
          </span>
        </div>
        <SliderTrack
          slide={slide}
          scale={scale}
          apart={0}
          names={[label]}
          inWords={(shown) => withUnit(shownNumber(shown, decimals), unit)}
          ticks={ticks}
          disabled={disabled}
          shownAs={shownAs}
        />
        {hint ? <p className="type-caption text-text-3">{hint}</p> : null}
      </div>
    </div>
  );
}

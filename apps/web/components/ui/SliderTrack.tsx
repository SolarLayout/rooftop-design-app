"use client";

import { classNames } from "./class-names";
import { measures } from "./measures";
import { limitsOf, shareOf, type Scale } from "./slider-steps";
import type { useSlide } from "./use-slide";

export type Tick = { value: number; label: string };

type Props = {
  /** What is shown, of `useSlide`. */
  slide: ReturnType<typeof useSlide>;
  scale: Scale;
  apart: number;
  /** The name of each handle. */
  names: readonly string[];
  /** The value of a handle in words, for a screen reader. */
  inWords: (value: number) => string;
  /** One handle: the track is filled from its start. Two: between them. */
  ticks?: readonly Tick[];
  disabled: boolean;
  /** For the kit: the first handle as it looks with the keyboard focus. */
  shownAs?: "focus";
};

// The middle of a handle stays half a handle away from the ends of the track, so that the handle never
// stands out over them: the rail is what is left between.
const HALF_A_HANDLE = "px-3.25 desktop:px-2.25";
const BESIDE_THE_RAIL = "w-3.25 desktop:w-2.25";
const LINE = "absolute top-1/2 h-1 -translate-y-1/2";

const HANDLE = classNames(
  "absolute top-1/2 left-at size-6.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
  "border-handle-touch border-accent bg-text shadow-handle focus-ring",
  "desktop:size-4.5 desktop:border-handle",
);

/** The track of a slider with its handles. Slider and RangeSlider put the value above it. */
export function SliderTrack({ slide, scale, apart, names, inWords, ticks, disabled, shownAs }: Props) {
  const { shown } = slide;
  const first = shown[0] ?? scale.min;
  const lastOne = shown[shown.length - 1] ?? scale.min;
  const isRange = shown.length > 1;
  const from = isRange ? shareOf(first, scale) : 0;
  const to = shareOf(lastOne, scale);

  return (
    <>
      <div
        data-testid="slide"
        className={classNames(
          "relative h-touch touch-pan-y select-none desktop:h-5",
          HALF_A_HANDLE,
          disabled ? "opacity-disabled" : "cursor-pointer",
        )}
        {...slide.surface}
      >
        <div data-testid="track" className={classNames(LINE, "inset-x-0 rounded-full bg-line")} />
        {isRange ? null : <div className={classNames(LINE, BESIDE_THE_RAIL, "left-0 rounded-l-full bg-accent")} />}
        <div data-rail className="relative h-full">
          <div
            data-testid="fill"
            className={classNames(LINE, "left-at w-span bg-accent", isRange && "rounded-full")}
            style={measures({ at: from, span: to - from })}
          />
          {shown.map((value, index) => {
            const limits = limitsOf(shown, index, scale, apart);
            return (
              <div
                key={names[index]}
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={names[index]}
                aria-valuemin={limits.min}
                aria-valuemax={limits.max}
                aria-valuenow={value}
                aria-valuetext={inWords(value)}
                aria-disabled={disabled || undefined}
                data-handle={index}
                data-shown-as={index === 0 ? shownAs : undefined}
                className={HANDLE}
                style={measures({ at: shareOf(value, scale) })}
                {...slide.handle}
              />
            );
          })}
        </div>
      </div>
      {ticks ? (
        <div data-testid="ticks" aria-hidden="true" className={classNames("relative h-5", HALF_A_HANDLE)}>
          <div className="relative h-full">
            {ticks.map((tick) => (
              <span
                key={tick.value}
                className="absolute left-at -translate-x-1/2 type-tick text-text-3"
                style={measures({ at: shareOf(tick.value, scale) })}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

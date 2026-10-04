"use client";

import { classNames } from "@/components/ui/class-names";
import { Icon, type IconSize } from "@/components/ui/Icon";
import { SliderTrack, type Tick as TrackTick } from "@/components/ui/SliderTrack";
import type { Scale } from "@/components/ui/slider-steps";
import { Tooltip, type Shortcuts } from "@/components/ui/Tooltip";
import { useSlide } from "@/components/ui/use-slide";
import { hourOf } from "@/lib/geometry/keepout";
import { QUARTER_HOUR, type DayHours } from "@/lib/flow/sun-day";
import type { Tick } from "@/lib/studio/sun-time";
import type { Size } from "./use-size";
import { useTime, type Time } from "./use-time";

// The time on the stage (the boards "Time on the stage" and "Studio, Sun lens" on three sizes;
// plan/phase-06-plan.md, decisions 1 to 5 and 17): the pill of every lens, the timeline of the Sun lens.
// The time follows the handle live, so that the light does; play steps it on the clock of the app.

/** The keys of the time, as the tooltip of the timeline names them (decision 17). */
const KEYS: Shortcuts = [
  { keys: [",", "."], words: "an hour" },
  { keys: ["[", "]"], words: "a day" },
  { keys: ["←", "→"], words: "a quarter hour" },
];

type PlayProps = { time: Time; size: "s" | "m" | "l"; className?: string };

const PLAY_SIZE: Record<PlayProps["size"], { box: string; icon: IconSize }> = {
  s: { box: "size-8", icon: 14 },
  m: { box: "size-9", icon: 14 },
  l: { box: "size-11", icon: 16 },
};

const PLAY_LOOK = "flex shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink shadow-primary";

/** The round play button: the triangle, or Pause's two bars while the time plays. */
function PlayButton({ time, size, className }: PlayProps) {
  const { box, icon } = PLAY_SIZE[size];
  return (
    <button
      type="button"
      aria-label={time.isPlaying ? "Pause" : "Play the day"}
      disabled={time.hours === null}
      className={classNames(PLAY_LOOK, box, "cursor-pointer focus-ring disabled:opacity-disabled", className)}
      onClick={time.togglePlay}
    >
      <Icon name={time.isPlaying ? "pause" : "play"} size={icon} stroke="pause" />
    </button>
  );
}

/** The slider's ticks from the timeline's: the ends from the ends inward, the window's ends in text-2. */
function trackTicksOf(ticks: readonly Tick[], window: Time["window"], endsBeside: boolean): TrackTick[] {
  const inside = endsBeside ? ticks.filter((tick) => !tick.end) : ticks;
  return inside.map((tick, index) => ({
    value: tick.hour,
    label: tick.words,
    align: endsBeside ? undefined : index === 0 ? "start" : index === inside.length - 1 ? "end" : undefined,
    strong: window !== null && (tick.hour === window.from || tick.hour === window.to),
  }));
}

type SliderProps = {
  time: Time;
  hours: DayHours;
  /** The shade-free window filled; without it the track is filled to the time (the pill). */
  window?: { from: number; to: number } | null;
  ticks?: readonly TrackTick[];
};

/** The time as a slider of quarter hours over the day's hours; Page Up and Page Down an hour. */
function TimeSlider({ time, hours, window, ticks }: SliderProps) {
  const scale: Scale = { min: hours.from, max: hours.to, step: QUARTER_HOUR, page: 1 };
  const slide = useSlide({
    values: [time.time.hour],
    scale,
    apart: 0,
    disabled: false,
    onShow: ([hour]) => hour !== undefined && time.setHour(hour),
    onCommit: ([hour]) => hour !== undefined && time.setHour(hour),
  });
  return (
    <SliderTrack
      slide={slide}
      scale={scale}
      apart={0}
      names={["Time of day"]}
      inWords={(hour) => `${hourOf(hour)} solar time`}
      ticks={ticks}
      fill={window && window.from >= hours.from && window.to <= hours.to ? window : undefined}
      disabled={false}
    />
  );
}

const PILL = "flex items-center rounded-full border border-line shadow-raised";

/**
 * The time on the stage of the Roof, Array and Strings lenses (the approved Array boards): play, the day
 * and the time, a short track from sunrise to sunset and, on desktop, "solar time". On phone the pill is
 * the play button alone; the time is moved on the timeline of the Sun lens.
 */
export function TimePill({ size, className }: { size: Size; className?: string }) {
  const time = useTime();
  const words = time.date ? `${time.date} · ${time.clock}` : time.clock;

  if (size === "phone") {
    return (
      <button
        type="button"
        data-testid="time-pill"
        aria-label={`${time.isPlaying ? "Pause" : "Play the day"}, ${words} solar time`}
        disabled={time.hours === null}
        className={classNames(PILL, "h-touch cursor-pointer gap-2 bg-control pr-3.5 pl-1.5 focus-ring disabled:opacity-disabled", className)}
        onClick={time.togglePlay}
      >
        <span className={classNames(PLAY_LOOK, "size-8")}>
          <Icon name={time.isPlaying ? "pause" : "play"} size={14} stroke="pause" />
        </span>
        <span className="type-value-xs whitespace-nowrap">{words}</span>
      </button>
    );
  }

  const isTablet = size === "tablet";
  return (
    <div
      data-testid="time-pill"
      role="group"
      aria-label="Time"
      className={classNames(PILL, "gap-3 bg-surface-1 pl-1.5", isTablet ? "h-12 pr-3" : "h-11 pr-2", className)}
    >
      <PlayButton time={time} size={isTablet ? "m" : "s"} />
      <span className={classNames("whitespace-nowrap", isTablet ? "type-value-small" : "type-value-xs")}>{words}</span>
      <div className={classNames("shrink-0", isTablet ? "w-50" : "w-45")}>{time.hours ? <TimeSlider time={time} hours={time.hours} /> : null}</div>
      {isTablet ? null : <span className="pr-2 type-caption text-text-3">solar time</span>}
    </div>
  );
}

/** Sunrise or sunset beside the track, its time over its word (the tablet board). */
function EndBeside({ tick, align }: { tick: Tick | undefined; align: "start" | "end" }) {
  if (!tick?.end) return null;
  return (
    <div aria-hidden="true" className={classNames("flex shrink-0 flex-col gap-1", align === "start" ? "items-start" : "items-end")}>
      <span className="type-value-xs text-text-2">{tick.end.clock}</span>
      <span className="type-label-s text-text-3">{tick.end.word}</span>
    </div>
  );
}

/** The words of a day the sun does not rise or does not set, under the time. */
function skyWordsOf(hours: DayHours | null): string | null {
  if (hours?.sky === "stays down") return "The sun stays below the horizon all day";
  if (hours?.sky === "stays up") return "The sun stays above the horizon all day";
  return null;
}

/**
 * The timeline of the Sun lens (docs/design/components.md, "Timeline (Sun lens)"): play, the time in
 * display with "solar time", the track over the day's hours with the shade-free window filled and the
 * ticks at sunrise, the window's ends, noon and sunset. On tablet sunrise and sunset stand beside the track.
 * On phone it stands in the sheet, without the bar around it.
 */
export function SunTimeline({ size, className }: { size: Size; className?: string }) {
  const time = useTime();
  const endsBeside = size === "tablet" && time.hours?.sky === "rises and sets";
  const ticks = trackTicksOf(time.ticks, time.window, endsBeside);
  const sky = skyWordsOf(time.hours);

  const clock = (
    <div className="flex shrink-0 flex-col">
      <span className="flex items-baseline gap-1.5">
        <span data-testid="timeline-time" className="type-lens-touch">
          {time.clock}
        </span>
        {sky ? <span className="type-caption text-text-2">solar time</span> : null}
      </span>
      <span className="type-caption text-text-2">{sky ?? "solar time"}</span>
    </div>
  );
  const track = time.hours ? (
    <Tooltip words="" shortcuts={KEYS} className="min-w-0 grow">
      <div className="min-w-0 grow">
        <TimeSlider time={time} hours={time.hours} window={time.window} ticks={ticks} />
      </div>
    </Tooltip>
  ) : (
    <div className="min-w-0 grow" />
  );

  if (size === "phone") {
    return (
      <div data-testid="sun-timeline" role="group" aria-label="Time" className={classNames("flex flex-col gap-2", className)}>
        <div className="flex items-center gap-3">
          <PlayButton time={time} size="l" />
          {clock}
          {time.window ? (
            <span className="ml-auto flex items-center gap-2 type-caption text-text-2">
              <span aria-hidden="true" className="h-1 w-3 rounded-full bg-accent" />
              Shade-free
              <span className="type-value-xs text-text">
                {hourOf(time.window.from)} – {hourOf(time.window.to)}
              </span>
            </span>
          ) : null}
        </div>
        {time.hours ? <TimeSlider time={time} hours={time.hours} window={time.window} ticks={ticks.filter((tick) => !tick.strong)} /> : null}
      </div>
    );
  }

  return (
    <div
      data-testid="sun-timeline"
      role="group"
      aria-label="Time"
      className={classNames("flex h-16 items-center rounded-bar border border-line bg-surface-1 pl-2.5 shadow-float", endsBeside ? "gap-3.5 pr-4.5" : "gap-4 pr-5", className)}
    >
      <PlayButton time={time} size="l" />
      {clock}
      {endsBeside ? <span aria-hidden="true" className="h-9 w-px shrink-0 bg-line" /> : null}
      {endsBeside ? <EndBeside tick={time.ticks[0]} align="start" /> : null}
      {track}
      {endsBeside ? <EndBeside tick={time.ticks.at(-1)} align="end" /> : null}
    </div>
  );
}

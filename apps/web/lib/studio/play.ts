// Play of the time (plan/phase-06-plan.md, decision 4): the view's hour moved on the clock of the app, a
// quarter hour every 250 ms up to the end of the day's hours, where it stops; Play there begins at the
// start. Under reduced motion an hour a second. A time set by anything else (a drag, a key, another day)
// stops it. A store without React; the clock is given, so that a test lets the time pass.
import type { Clock } from "../clock";
import type { DayHours } from "../scene/sun-day";
import type { ViewStore } from "../stores/view-store";

const STEP = { hours: 0.25, milliseconds: 250 };
const REDUCED_STEP = { hours: 1, milliseconds: 1000 };

type Options = {
  view: ViewStore;
  clock: Clock;
  /** The hours of the day shown; null while its sun has not come. */
  hoursOf: () => DayHours | null;
  /** Whether the user asks for reduced motion. */
  isReduced: () => boolean;
};

export type Play = { play: () => void; pause: () => void; toggle: () => void; stop: () => void };

export function createPlay({ view, clock, hoursOf, isReduced }: Options): Play {
  let giveUpTheStep: (() => void) | null = null;
  let stopListening: (() => void) | null = null;
  /** The hour play set last: a time that differs from it was set by something else. */
  let setByPlay: number | null = null;

  function pause() {
    giveUpTheStep?.();
    giveUpTheStep = null;
    stopListening?.();
    stopListening = null;
    setByPlay = null;
    view.getState().setPlaying(false);
  }

  function setHour(hour: number) {
    setByPlay = hour;
    view.getState().setSunTime({ ...view.getState().sunTime, hour });
  }

  function next() {
    const hours = hoursOf();
    if (hours === null) return pause();
    const step = isReduced() ? REDUCED_STEP : STEP;
    giveUpTheStep = clock.after(step.milliseconds, () => {
      giveUpTheStep = null;
      const hour = Math.min(hours.to, view.getState().sunTime.hour + step.hours);
      setHour(hour);
      if (hour >= hours.to) pause();
      else next();
    });
  }

  function play() {
    const hours = hoursOf();
    if (hours === null) return;
    pause();
    if (view.getState().sunTime.hour >= hours.to) setHour(hours.from);
    view.getState().setPlaying(true);
    stopListening = view.subscribe((state, before) => {
      if (state.sunTime !== before.sunTime && !(state.sunTime.hour === setByPlay && state.sunTime.day === before.sunTime.day)) pause();
    });
    next();
  }

  return {
    play,
    pause,
    toggle: () => (view.getState().isPlaying ? pause() : play()),
    stop: pause,
  };
}

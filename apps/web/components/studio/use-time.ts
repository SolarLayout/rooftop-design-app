"use client";

import { useMemo } from "react";
import { useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { hourOf } from "@/lib/scene/keepout";
import { hoursOf, type DayHours } from "@/lib/scene/sun-day";
import { projectOf } from "@/lib/stores/project-store";
import { sunDayOf, type SunDay } from "@/lib/stores/results-store";
import { isPlayingOf, sunTimeOf, type SunTime } from "@/lib/stores/view-store";
import { dateOf, ticksOf, type Tick } from "@/lib/studio/sun-time";

export type Time = {
  /** The day of the sun the time is of; null while it has not come. */
  day: SunDay | null;
  /** The hours the time may take on that day; null while it has not come. */
  hours: DayHours | null;
  time: SunTime;
  /** "21 Dec" and "10:30": the day and the time as the time control says them. */
  date: string | null;
  clock: string;
  /** The ticks of the timeline: sunrise, the window's ends, noon, sunset. */
  ticks: Tick[];
  /** The shade-free window of the array, in solar hours. */
  window: { from: number; to: number } | null;
  isPlaying: boolean;
  /** The view's hour, as a drag shows it or as it is let go: the light follows at once. */
  setHour: (hour: number) => void;
  togglePlay: () => void;
};

/** The time of the view and what the time controls need of it (plan/phase-06-plan.md, decisions 1 to 5). */
export function useTime(): Time {
  const { view, play } = useStores();
  const day = useResults(sunDayOf);
  const time = useView(sunTimeOf);
  const isPlaying = useView(isPlayingOf);
  const project = useProject(projectOf);
  const from = project?.array.window_start_h ?? null;
  const to = project?.array.window_end_h ?? null;

  return useMemo(() => {
    const hours = day ? hoursOf(day) : null;
    const window = from === null || to === null ? null : { from, to };
    return {
      day,
      hours,
      time,
      date: day ? dateOf(day.dayOfYear).short : null,
      clock: hourOf(time.hour),
      ticks: day && hours && window ? ticksOf(hours, day, window) : [],
      window,
      isPlaying,
      setHour: (hour: number) => {
        const now = view.getState().sunTime;
        if (now.hour !== hour) view.getState().setSunTime({ ...now, hour });
      },
      togglePlay: () => play.toggle(),
    };
  }, [day, time, isPlaying, from, to, view, play]);
}

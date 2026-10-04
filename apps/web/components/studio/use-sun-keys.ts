"use client";

import { useEffect } from "react";
import { useStores } from "@/components/shell/stores";
import { hoursOf } from "@/lib/flow/sun-day";
import { sunDayOf } from "@/lib/stores/results-store";
import { timeOfKey } from "@/lib/studio/sun-time";

/** What has the focus takes its own keys: a field, a slider, a menu, a list (plan/phase-06-plan.md, decision 17). */
const TAKES_ITS_OWN_KEYS = 'input, textarea, select, [contenteditable="true"], [role="slider"], [role="menu"], [role="listbox"], [role="combobox"]';

/**
 * The keys of the time in the Studio (decision 17): `,` and `.` an hour back and forward, `[` and `]` a
 * day; not while what has the focus takes keys of its own, nor with a modifier. A key stops play, as any
 * time set by something else does.
 */
export function useSunKeys(): void {
  const { view, results } = useStores();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(TAKES_ITS_OWN_KEYS)) return;
      const day = sunDayOf(results.getState());
      if (!day) return;
      const next = timeOfKey(event.key, view.getState().sunTime, day.dayOfYear, hoursOf(day));
      if (next === null) return;
      event.preventDefault();
      view.getState().setSunTime(next);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, results]);
}

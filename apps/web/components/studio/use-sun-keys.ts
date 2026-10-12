"use client";

import { useEffect } from "react";
import { isKeyHeld, keyTargetOf } from "@/components/shell/keys-held";
import { useStores } from "@/components/shell/stores";
import { hoursOf } from "@/lib/flow/sun-day";
import { sunDayOf } from "@/lib/stores/results-store";
import { timeOfKey } from "@/lib/flow/sun-time";

/** What has the focus takes its own keys: a field or an open dialog, and a slider, a menu, a list (plan/phase-06-plan.md, decision 17). */
const TAKES_ITS_OWN_KEYS = '[role="slider"], [role="menu"], [role="listbox"], [role="combobox"]';

/**
 * The keys of the time in the Sun view (decision 17; V2 · 3): `,` and `.` an hour back and forward, `[` and `]` a
 * day; not while what has the focus takes keys of its own, nor with a modifier. A key stops play, as any
 * time set by something else does.
 */
export function useSunKeys(): void {
  const { view, results } = useStores();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // The time belongs to the Sun view (V2 · 3).
      if (!view.getState().isSunView || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isKeyHeld(keyTargetOf(event), TAKES_ITS_OWN_KEYS)) return;
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

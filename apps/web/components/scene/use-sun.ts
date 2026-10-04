"use client";

import { useMemo } from "react";
import { useResults, useView } from "@/components/shell/stores";
import type { Sun } from "@/lib/scene/camera";
import { sunAt } from "@/lib/flow/sun-day";
import { sunDayOf } from "@/lib/stores/results-store";
import { sunTimeOf } from "@/lib/stores/view-store";

/** Where the sun stands at the view's hour, from the day /sun answered; null while no day has come. */
export function useSun(): Sun | null {
  const day = useResults(sunDayOf);
  const { hour } = useView(sunTimeOf);
  return useMemo(() => (day ? sunAt(day, hour) : null), [day, hour]);
}

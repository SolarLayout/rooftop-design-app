"use client";

import { useMemo } from "react";
import { useResults, useView } from "@/components/shell/stores";
import { shadeMapOf, type ShadeMap } from "@/lib/scene/shade-map";
import { designEditOf, designOf, layoutEditOf, layoutOf } from "@/lib/stores/results-store";
import { isShadeMapShownOf } from "@/lib/stores/view-store";

/**
 * The shade map of the design run, when it is of the layout shown (plan/phase-06-plan.md, decision 12),
 * whether or not it is shown; null while there is none.
 */
export function useShadeMapOfTheRun(): ShadeMap | null {
  const design = useResults(designOf);
  const runEdit = useResults(designEditOf);
  const layout = useResults(layoutOf);
  const layoutEdit = useResults(layoutEditOf);
  return useMemo(
    () =>
      design && layout
        ? shadeMapOf({ losses: design.shading.near_pct_by_module, runEdit, layoutEdit, positions: layout.layout.modules.length })
        : null,
    [design, runEdit, layout, layoutEdit],
  );
}

/** The shade map as the stage shows it: in the Sun lens's Shade map tab, of the layout shown; null otherwise. */
export function useShadeMapShown(): ShadeMap | null {
  const map = useShadeMapOfTheRun();
  const isShown = useView(isShadeMapShownOf);
  return isShown ? map : null;
}

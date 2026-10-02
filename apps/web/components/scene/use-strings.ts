"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useResults, useView } from "@/components/shell/stores";
import type { DesignOption, PVString } from "@/lib/api";
import { shadeColoursOf } from "@/lib/scene/shade-colours";
import { stringColoursOf, stringsOfTheRunOf, type Colouring } from "@/lib/scene/string-colours";
import { chosenOptionOf, designEditOf, designOf, layoutEditOf, layoutOf } from "@/lib/stores/results-store";
import { litStringsOf, stringsShownByOf } from "@/lib/stores/view-store";
import { useShadeMapShown } from "./use-shade-map";

/** The chosen option and its strings, when the run is of the layout shown (plan/phase-07-plan.md, decision 12); null otherwise. */
export function useStringsOfTheRun(): { option: DesignOption; strings: PVString[] } | null {
  const design = useResults(designOf);
  const runEdit = useResults(designEditOf);
  const layout = useResults(layoutOf);
  const layoutEdit = useResults(layoutEditOf);
  const option = useResults(chosenOptionOf);
  return useMemo(() => {
    if (!design || !layout || !option) return null;
    const strings = stringsOfTheRunOf({ option, runEdit, layoutEdit, runPositions: design.layout.modules.length, positions: layout.layout.modules.length });
    return strings ? { option, strings } : null;
  }, [design, runEdit, layout, layoutEdit, option]);
}

export type StringsShown = { option: DesignOption; strings: PVString[]; colouring: Colouring; lit: readonly string[] };

/** The strings as the stage shows them: in the Strings lens, of the layout shown, with what they are coloured by and the strings lit; null otherwise. */
export function useStringsShown(): StringsShown | null {
  const run = useStringsOfTheRun();
  const colouring = useView(stringsShownByOf);
  const lit = useView(useShallow(litStringsOf));
  return useMemo(() => (run && colouring ? { ...run, colouring, lit } : null), [run, colouring, lit]);
}

/**
 * The colour of every position's glass as the stage shows it: the shade map's steps in the Sun lens's Shade map
 * tab, the strings in the Strings lens, each only while the run is of the layout shown; null for the modules' blue.
 */
export function useGlassOfTheStage(): string[] | null {
  const map = useShadeMapShown();
  const strings = useStringsShown();
  const layout = useResults(layoutOf);
  return useMemo(() => {
    if (map) return shadeColoursOf(map.steps);
    if (!strings || !layout) return null;
    return stringColoursOf({ idxs: layout.layout.modules.map((module) => module.idx), strings: strings.strings, colouring: strings.colouring, lit: strings.lit });
  }, [map, strings, layout]);
}

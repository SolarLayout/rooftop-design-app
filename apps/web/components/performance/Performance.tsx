"use client";

import { useMemo } from "react";
import { useResults, useStores } from "@/components/shell/stores";
import { headerOf } from "@/lib/performance/header";
import { kpisOf } from "@/lib/performance/kpis";
import { chosenOptionOf, designOf, isDesignUpdating, readoutsOf } from "@/lib/stores/results-store";
import { Kpis } from "./Kpis";
import { PerformanceHeader } from "./PerformanceHeader";

// The page's padding and the gaps between its parts, as the boards draw them on each size.
const PAGE = "flex flex-col gap-3.5 px-page-x-phone pt-2 pb-6 tablet:gap-4 tablet:px-page-x-tablet tablet:pt-6 tablet:pb-8 desktop:gap-5 desktop:px-page-x-desktop desktop:pt-page-y";

/**
 * The Performance workspace (the board "Performance" on three sizes; plan/phase-08-plan.md, pull request 1): the
 * header with the line of the run, the option switch and the weather; the KPIs of the chosen option. An option chosen
 * is an edit of the document and asks for nothing: the run's answer holds every option (decision 4).
 */
export function Performance() {
  const { project } = useStores();
  const design = useResults(designOf);
  const readouts = useResults(readoutsOf);
  const isUpdating = useResults(isDesignUpdating);
  const option = useResults(chosenOptionOf);
  const header = useMemo(() => (design ? headerOf(design, readouts) : null), [design, readouts]);
  const kpis = useMemo(() => (option ? kpisOf(option) : null), [option]);

  function choose(key: string) {
    project.getState().commit((document) => (document.chosen_option === key ? document : { ...document, chosen_option: key }));
  }

  return (
    <main className={PAGE}>
      <PerformanceHeader header={header} isDimmed={isUpdating} onChoose={choose} />
      {kpis ? <Kpis view={kpis} isDimmed={isUpdating} /> : null}
    </main>
  );
}

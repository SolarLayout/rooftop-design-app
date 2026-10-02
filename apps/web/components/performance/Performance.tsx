"use client";

import { useMemo } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import { pageViewOf } from "@/lib/performance/page-view";
import { nameOf } from "@/lib/stores/project-store";
import { designFailureOf, designOf, designStatusOf, progressOf, readoutsOf } from "@/lib/stores/results-store";
import { Kpis, KpiSkeletons } from "./Kpis";
import { NoOptionsCard } from "./NoOptionsCard";
import { PerformanceHeader } from "./PerformanceHeader";
import { SummaryTable } from "./SummaryTable";
import { FailedRow, RunRow } from "./UnderTheTitle";

// The page's padding and the gaps between its parts, as the boards draw them on each size.
const PAGE = "flex flex-col gap-3.5 px-page-x-phone pt-2 pb-6 tablet:gap-4 tablet:px-page-x-tablet tablet:pt-6 tablet:pb-8 desktop:gap-5 desktop:px-page-x-desktop desktop:pt-page-y";

/**
 * The Performance workspace (the boards "Performance" on three sizes and "Performance, states"; plan/phase-08-plan.md,
 * pull request 1): the header with the line of the run, the option switch and the weather; the KPIs and the summary of
 * the chosen option; before options the API's words; skeletons at the first load; a run on its way dimming the values
 * of before; a run that failed leaving them with a note. An option chosen is an edit of the document and asks for
 * nothing: the run's answer holds every option (decision 4).
 */
export function Performance() {
  const { project, flow } = useStores();
  const name = useProject(nameOf);
  const design = useResults(designOf);
  const readouts = useResults(readoutsOf);
  const designStatus = useResults(designStatusOf);
  const progress = useResults(progressOf);
  const failure = useResults(designFailureOf);
  const view = useMemo(() => pageViewOf({ name, design, readouts, designStatus, progress, failure }), [name, design, readouts, designStatus, progress, failure]);

  function choose(key: string) {
    project.getState().commit((document) => (document.chosen_option === key ? document : { ...document, chosen_option: key }));
  }

  const values = view.kind === "design" || view.kind === "failed" ? view.values : null;
  const decision = view.kind === "decision" || view.kind === "failed" ? view.decision : null;
  const isDimmed = view.kind === "design" && view.isDimmed;
  const under = view.kind === "failed" ? <FailedRow failed={view.failed} onTryAgain={flow.tryAgain} /> : view.run ? <RunRow run={view.run} /> : null;

  return (
    <main className={PAGE}>
      <PerformanceHeader header={view.header} isLoading={view.kind === "loading"} isDimmed={isDimmed} under={under} onChoose={choose} />
      {view.kind === "loading" ? <KpiSkeletons /> : null}
      {decision ? <NoOptionsCard decision={decision} /> : null}
      {values ? (
        <>
          <Kpis view={values.kpis} isDimmed={isDimmed} />
          <SummaryTable rows={values.summary} isDimmed={isDimmed} />
        </>
      ) : null}
    </main>
  );
}

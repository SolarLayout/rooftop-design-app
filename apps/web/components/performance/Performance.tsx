"use client";

import { useMemo, useState } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import { useHistoryKeys } from "@/components/studio/use-history-keys";
import { assumptionsOf, withAssumption, withLevel, type AssumptionId } from "@/lib/performance/assumption-fields";
import { withDegradation } from "@/lib/performance/degradation";
import { pageViewOf } from "@/lib/performance/page-view";
import { loadingWordsOf } from "@/lib/performance/weather-source";
import { degradationOf, latitudeOf, longitudeOf, nameOf, projectOf, weatherCsvOf, weatherSourceOf } from "@/lib/stores/project-store";
import { designFailureOf, designOf, designStatusOf, progressOf, readoutsOf } from "@/lib/stores/results-store";
import { Assumptions } from "./Assumptions";
import { Kpis, KpiSkeletons } from "./Kpis";
import { LossChain } from "./LossChain";
import { MonthlyChart } from "./MonthlyChart";
import { NoOptionsCard } from "./NoOptionsCard";
import { PerformanceHeader } from "./PerformanceHeader";
import { SummaryTable } from "./SummaryTable";
import { FailedRow, RunRow } from "./UnderTheTitle";
import { useWeatherLoad } from "./use-weather-load";
import { WeatherCsvDialog } from "./WeatherCsvDialog";
import { WeatherNote, WeatherSelect } from "./WeatherSelect";
import { YearsChart } from "./YearsChart";

// The page's padding and the gaps between its parts, as the boards draw them on each size.
const PAGE = "flex flex-col gap-3.5 px-page-x-phone pt-2 pb-6 tablet:gap-4 tablet:px-page-x-tablet tablet:pt-6 tablet:pb-8 desktop:gap-5 desktop:px-page-x-desktop desktop:pt-page-y";
// Under the KPIs on desktop: the chain at the left, 7 of 12 columns, the charts at the right, 5; one column before.
const UNDER_THE_KPIS = "grid gap-3.5 tablet:gap-4 desktop:grid-cols-12 desktop:items-start desktop:gap-grid";
// The charts: stacked on phone, side by side on tablet, under each other in the right column on desktop.
const CHARTS = "grid gap-3.5 tablet:grid-cols-2 tablet:gap-4 desktop:col-span-5 desktop:grid-cols-1 desktop:gap-grid";

/**
 * The Performance workspace (the boards "Performance" on three sizes and "Performance, states"; plan/phase-08-plan.md,
 * pull request 1): the header with the line of the run, the option switch and the weather; the KPIs and the summary of
 * the chosen option; before options the API's words; skeletons at the first load; a run on its way dimming the values
 * of before; a run that failed leaving them with a note. An option chosen is an edit of the document and asks for
 * nothing: the run's answer holds every option (decision 4). The weather source is a select: a source chosen is loaded
 * first, the line dimmed and the load said under it, then committed once; a CSV is read in its dialog before Use
 * (decision 12). The engine's notes on the weather stand under the line of the run, in its words. The assumptions are
 * fields of the document in a card, under the charts on desktop, across the page before, and before a voltage under the
 * decision card: they are inputs (decisions 6, 8 and 15).
 */
export function Performance() {
  const { project, flow } = useStores();
  const name = useProject(nameOf);
  const document = useProject(projectOf);
  const degradation = useProject(degradationOf);
  const weatherSource = useProject(weatherSourceOf);
  const weatherCsv = useProject(weatherCsvOf);
  const lat = useProject(latitudeOf);
  const lon = useProject(longitudeOf);
  const load = useWeatherLoad();
  const [isCsvOpen, setCsvOpen] = useState(false);
  // The page's edits are committed edits like the Studio's: the keys of the history undo and redo them.
  useHistoryKeys();
  const design = useResults(designOf);
  const readouts = useResults(readoutsOf);
  const designStatus = useResults(designStatusOf);
  const progress = useResults(progressOf);
  const failure = useResults(designFailureOf);
  const view = useMemo(() => pageViewOf({ name, design, readouts, designStatus, progress, failure }), [name, design, readouts, designStatus, progress, failure]);
  const assumptions = useMemo(() => (document ? assumptionsOf(document, design?.sizing ?? null) : null), [document, design]);

  function choose(key: string) {
    project.getState().commit((document) => (document.chosen_option === key ? document : { ...document, chosen_option: key }));
  }

  function setDegradation(pct: number) {
    project.getState().commit((document) => withDegradation(document, pct));
  }

  function setAssumption(id: AssumptionId, value: number | null) {
    project.getState().commit((document) => withAssumption(document, id, value));
  }

  function setLevel(index: number, value: number) {
    project.getState().commit((document) => withLevel(document, index, value));
  }

  const values = view.kind === "design" || view.kind === "failed" ? view.values : null;
  const decision = view.kind === "decision" || view.kind === "failed" ? view.decision : null;
  const isDimmed = view.kind === "design" && view.isDimmed;
  const under =
    view.kind === "failed" ? (
      <FailedRow failed={view.failed} onTryAgain={flow.tryAgain} />
    ) : load.loading ? (
      <RunRow run={{ title: loadingWordsOf(load.loading), step: null, share: null }} />
    ) : view.run ? (
      <RunRow run={view.run} />
    ) : null;

  return (
    <main className={PAGE}>
      <PerformanceHeader
        header={view.header}
        isLoading={view.kind === "loading"}
        isDimmed={isDimmed || load.loading !== null}
        under={under}
        weather={weatherSource !== null && weatherCsv !== null ? <WeatherSelect document={{ weather_source: weatherSource, weather_csv: weatherCsv }} load={load} onCsv={() => setCsvOpen(true)} /> : null}
        note={load.failure ? <WeatherNote message={load.failure} /> : null}
        onChoose={choose}
      />
      {view.kind === "loading" ? <KpiSkeletons /> : null}
      {decision ? <NoOptionsCard decision={decision} /> : null}
      {values ? (
        <>
          <Kpis view={values.kpis} isDimmed={isDimmed} />
          <div className={UNDER_THE_KPIS}>
            <LossChain view={values.chain} isDimmed={isDimmed} className="desktop:col-span-7" />
            <div className={CHARTS}>
              <MonthlyChart energy={values.energy} isDimmed={isDimmed} />
              <YearsChart energy={values.energy} degradation={degradation} onDegradation={setDegradation} isDimmed={isDimmed} />
              {assumptions ? <Assumptions assumptions={assumptions} onField={setAssumption} onLevel={setLevel} className="tablet:col-span-2 desktop:col-span-1 desktop:grow" /> : null}
            </div>
          </div>
          <SummaryTable rows={values.summary} isDimmed={isDimmed} />
        </>
      ) : assumptions && view.kind !== "loading" ? (
        <Assumptions assumptions={assumptions} onField={setAssumption} onLevel={setLevel} />
      ) : null}
      {lat !== null && lon !== null ? (
        <WeatherCsvDialog
          open={isCsvOpen}
          site={{ lat, lon }}
          onUse={(chosen) => {
            load.take(chosen);
            setCsvOpen(false);
          }}
          onClose={() => setCsvOpen(false)}
        />
      ) : null}
    </main>
  );
}

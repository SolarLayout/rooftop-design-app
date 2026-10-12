"use client";

import { useMemo, useState } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import { useHistoryKeys } from "@/components/shell/use-history-keys";
import { NoOptionsCard } from "@/components/shell/NoOptionsCard";
import { FailedRow, RunRow } from "@/components/shell/UnderTheTitle";
import { loadingWordsOf } from "@/lib/flow/weather-source";
import { assumptionFieldsOf, withAssumption, withLevel, type RowFieldId } from "@/lib/performance/assumption-fields";
import { assumptionRowsOf } from "@/lib/performance/assumption-rows";
import { withDegradation } from "@/lib/performance/degradation";
import { energyStepsOf, withStepField, type StepFieldId } from "@/lib/performance/energy-steps";
import { pageViewOf } from "@/lib/performance/page-view";
import { latitudeOf, longitudeOf, nameOf, projectOf, weatherCsvOf, weatherSourceOf } from "@/lib/stores/project-store";
import { designFailureOf, designOf, designStatusOf, progressOf } from "@/lib/stores/results-store";
import { Assumptions } from "./Assumptions";
import { EnergyLead, Figures, FigureSkeletons } from "./Kpis";
import { EnergySteps } from "./EnergySteps";
import { LossChain } from "./LossChain";
import { MonthlyChart } from "./MonthlyChart";
import { OptionSwitch } from "./OptionSwitch";
import { PerformanceHeader, PinnedContinue } from "./PerformanceHeader";
import { PerformanceTabs } from "./PerformanceTabs";
import { SummaryTable } from "./SummaryTable";
import { useWeatherLoad } from "./use-weather-load";
import { WeatherCsvDialog } from "./WeatherCsvDialog";
import { WeatherNote, WeatherSelect } from "./WeatherSelect";
import { YearsChart } from "./YearsChart";

// The page's padding and the gaps between its parts, as the board draws them on each size. It is at least the frame's
// height, so that on phone the primary pinned at its foot stands over the tab bar.
const PAGE = "flex grow flex-col gap-6 px-page-x-phone pt-6 tablet:px-page-x-tablet tablet:pb-safe-8 desktop:px-page-x-desktop desktop:pt-8 desktop:pb-page-y";

/**
 * The Performance workspace (V2 · 8, D104; the board "V2 · 8 · Performance" on three sizes): one screen at first sight, the
 * energy of year 1 with Likely and Conservative, Option and Weather beside it, the three figures, and under them four tabs,
 * one view at a time, the last remembered. Before options, the API's words and the assumptions; skeletons at the first
 * load; a run on its way dims the values of before where they stand and says Updating (V2 · 5); a run that failed leaves
 * them with a note. An option chosen is an edit of the document and asks for nothing: the run's answer holds every option
 * (decision 4). The weather source is a select: a source chosen is loaded first, the load said under the title, then
 * committed once; a CSV is read in its dialog before Use (decision 12).
 */
export function Performance() {
  const { project, flow } = useStores();
  const name = useProject(nameOf);
  const document = useProject(projectOf);
  const weatherSource = useProject(weatherSourceOf);
  const weatherCsv = useProject(weatherCsvOf);
  const lat = useProject(latitudeOf);
  const lon = useProject(longitudeOf);
  const load = useWeatherLoad();
  const [isCsvOpen, setCsvOpen] = useState(false);
  // The page's edits are committed edits like the Studio's: the keys of the history undo and redo them.
  useHistoryKeys();
  const design = useResults(designOf);
  const designStatus = useResults(designStatusOf);
  const progress = useResults(progressOf);
  const failure = useResults(designFailureOf);
  const view = useMemo(() => pageViewOf({ name, design, designStatus, progress, failure }), [name, design, designStatus, progress, failure]);
  const values = view.kind === "design" || view.kind === "failed" ? view.values : null;
  const steps = useMemo(() => (values && document ? energyStepsOf(values.energy.steps, document) : null), [values, document]);
  const rows = useMemo(() => (document ? assumptionRowsOf(document, design) : null), [document, design]);
  const fields = useMemo(() => (document ? assumptionFieldsOf(document) : null), [document]);

  const choose = (key: string) => project.getState().commit((document) => (document.chosen_option === key ? document : { ...document, chosen_option: key }));
  const setStepField = (id: StepFieldId, value: number) => project.getState().commit((document) => withStepField(document, id, value));
  const setField = (id: RowFieldId, value: number) =>
    project.getState().commit((document) => (id === "degradation_pct" ? withDegradation(document, value) : withAssumption(document, id, value)));
  const setLevel = (index: number, value: number) => project.getState().commit((document) => withLevel(document, index, value));

  const decision = view.kind === "decision" || view.kind === "failed" ? view.decision : null;
  const isDimmed = view.kind === "design" && view.isDimmed;
  const under =
    view.kind === "failed" ? (
      <FailedRow failed={view.failed} onTryAgain={flow.tryAgain} />
    ) : load.loading ? (
      <RunRow run={{ title: loadingWordsOf(load.loading), step: null, share: null }} />
    ) : null;

  const header = view.header;
  const selects = header ? (
    <>
      {header.chosen === null ? null : <OptionSwitch items={header.items} chosen={header.chosen} onChoose={choose} />}
      {weatherSource !== null && weatherCsv !== null ? (
        <div data-testid="weather-select" className="contents">
          <WeatherSelect document={{ weather_source: weatherSource, weather_csv: weatherCsv }} load={load} onCsv={() => setCsvOpen(true)} />
        </div>
      ) : null}
    </>
  ) : null;
  const assumptions =
    rows && fields ? <Assumptions rows={rows} fields={fields} weather={design?.weather ?? null} notes={header?.notes ?? []} onField={setField} onLevel={setLevel} /> : null;

  return (
    <main className={PAGE}>
      <PerformanceHeader under={under} />
      <EnergyLead
        lead={values?.kpis.lead ?? null}
        isLoading={view.kind === "loading"}
        isUpdating={isDimmed || load.loading !== null}
        selects={selects}
        note={load.failure ? <WeatherNote message={load.failure} /> : null}
      />
      {view.kind === "loading" ? <FigureSkeletons /> : null}
      {decision ? <NoOptionsCard decision={decision} /> : null}
      {values && steps ? (
        <>
          <Figures figures={values.kpis.figures} isDimmed={isDimmed} />
          <PerformanceTabs
            month={<MonthlyChart energy={values.energy} isDimmed={isDimmed} />}
            years={<YearsChart energy={values.energy} degradation={document?.losses.degradation_pct ?? 0} isDimmed={isDimmed} />}
            losses={(allSteps) =>
              allSteps.isOpen ? (
                <div className="flex flex-col gap-6">
                  <LossChain view={values.chain} isDimmed={isDimmed} onBack={allSteps.close} />
                  <SummaryTable rows={values.summary} isDimmed={isDimmed} />
                </div>
              ) : (
                <EnergySteps view={steps} isDimmed={isDimmed} onField={setStepField} onAllSteps={allSteps.open} />
              )
            }
            assumptions={assumptions}
          />
        </>
      ) : view.kind !== "loading" && assumptions ? (
        <section aria-label="Assumptions" className="desktop:rounded-card desktop:border desktop:border-line desktop:bg-surface-1 desktop:px-6">
          {assumptions}
        </section>
      ) : null}
      <PinnedContinue />
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

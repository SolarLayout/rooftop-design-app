"use client";

import { useState } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import type { InverterResponse } from "@/lib/api";
import { editOf, openedAtOf, projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, designEditOf, designOf, isDesignUpdating } from "@/lib/stores/results-store";
import { displayNameOf, nameOfCountry } from "@/lib/country/country";
import { withCustom, withoutCustom } from "@/lib/studio/custom-fields";
import { inverterFactsOf, inverterShownOf, withInverterRead, type ReplacedInverter } from "@/lib/studio/inverter-card";
import { limitsRowOf, limitsSetByOf, withAcCable, withCurrentPerMppt } from "@/lib/studio/inverter-fields";
import { wordOf } from "@/lib/studio/set-by";
import { sizingFieldsOf, sizingRowOf, sizingSetByOf } from "@/lib/studio/sizing-fields";
import { mpptLoadingFactsOf, mpptTableOf } from "@/lib/studio/mppt-table";
import { fitProofOf } from "@/lib/studio/fit-proof";
import { seriesBarOf } from "@/lib/studio/series-bar";
import { optionCardsOf } from "@/lib/studio/option-cards";
import { stringsViewOf } from "@/lib/studio/strings-view";
import { withVoltageChosen } from "@/lib/studio/voltage-choice";
import { inverterSetByOf, withTheRoofsInverter } from "@/lib/studio/roof-inverter";
import { voltageWordsOf } from "@/lib/studio/voltage-words";
import type { Volts } from "@/lib/studio/voltages";
import { InverterCard } from "./InverterCard";
import { InverterLimits } from "./InverterLimits";
import { MpptTable } from "./MpptTable";
import { SeriesRange } from "./SeriesRange";
import { SizingTemperatures } from "./SizingTemperatures";
import { StringLegendInTheSheet } from "./StringLegend";
import { InverterPicker } from "./InverterPicker";
import { Problem } from "@/components/ui/Problem";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useNoStringsFit } from "./use-no-strings-fit";
import { useBelowTarget } from "./use-below-target";
import { HowTheOptionsAreMade, NothingFits, OptionCards, OptionsWaiting, YourOwn } from "./StringOptions";
import { SummaryRow } from "@/components/shell/SummaryRow";
import { SystemVoltage } from "./SystemVoltage";
import { useSectionOpen } from "@/components/shell/use-section-open";
import { useSize } from "@/components/shell/use-screen-size";

/** The inverter read from a replaced file, for the design that was open when it was read. */
type Replaced = ReplacedInverter & { openedAt: number | null };

/**
 * The inspector of the Strings lens (the boards "Studio, Strings lens" on three sizes and "System voltage · Set by the
 * user's country"): the inverter with Replace; the system voltage, who set it and what the equipment does to it; the
 * series range with its verdict; where no length fits, what can change it; under the options the MPPT loading of the
 * chosen one; the sizing temperatures and the Voc coefficient; the inverter's limits and cabling. The voltage is the
 * document's: the app sets a new design's from the user's country (D87) and never moves it; a choice here makes it the
 * user's, and the run follows. On phone the strings' colour switch stands first, the stage holding only the legend.
 */
export function StringsInspector() {
  const { project: store, country } = useStores();
  const project = useProject(projectOf);
  const design = useResults(designOf);
  const option = useResults(chosenOptionOf);
  // A newer run on its way: what it will replace stands dimmed (plan/phase-07-plan.md, step 21).
  const isUpdating = useResults(isDesignUpdating);
  const size = useSize();
  const openedAt = useProject(openedAtOf);
  const designEdit = useResults(designEditOf);
  const [replaced, setReplaced] = useState<Replaced | null>(null);
  const [isReplacing, setReplacing] = useState(false);
  // Each opening of the picker mounts it afresh: its filters and its choice at rest.
  const [openings, setOpenings] = useState(0);
  const [, openLimits] = useSectionOpen("strings.limits", false);
  const [, openSizing] = useSectionOpen("strings.sizing", false);
  const noStringsFit = useNoStringsFit();
  const belowTarget = useBelowTarget();
  // The picker opened from the problem below the target opens filtered to the power that suits the roof (D118).
  const [suitedKw, setSuitedKw] = useState<readonly [number, number] | null>(null);
  const [focusCurrent, setFocusCurrent] = useState(0);
  if (!project) return null;
  const view = stringsViewOf({ voltage: project.system_voltage ?? null, design, option });
  // The first run is on its way and nothing of a run before stands: the options wait as a skeleton, and the step says what it does (V2 · 5).
  const isSizing = isUpdating && design === null && view.kind === "sized";
  // A file read for another design says nothing about this one.
  const inverter = inverterShownOf({ design, designEdit, replaced: replaced?.openedAt === openedAt ? replaced : null });
  // The inverter shown, also one read and not yet run with; the module of the run.
  const ratings = inverter && design ? { inverter: inverter.inverter.vabs_max, module: design.equipment.module.v_max_iec, moduleTaken: !design.equipment.module.v_max_from_file } : null;
  const proof = view.kind === "sized" && view.range && option && inverter ? fitProofOf({ option, range: view.range, mpptMinimum: inverter.inverter.vmpp_min }) : null;
  const bar = view.kind === "sized" && view.range ? seriesBarOf(view.range, view.chosen) : null;
  const words =
    view.kind === "sized"
      ? voltageWordsOf({
          voltage: view.voltage,
          by: project.system_voltage_by ?? null,
          country: country.current(),
          nameOf: (code) => nameOfCountry(code, displayNameOf),
          ratings,
          range: design?.series_range ?? null,
        })
      : null;

  /** The MPPT table's way to the current per MPPT: the row opened, the focus in its field (decision 17). */
  function enterCurrent() {
    openLimits(true);
    setFocusCurrent((times) => times + 1);
  }

  /** The file read becomes the document's inverter; the card shows it until the run with it lands (step 17). */
  function inverterRead(read: InverterResponse) {
    store.getState().commit((document) => withInverterRead(document, read));
    setReplaced({ inverter: read.inverter, current: read.max_current_per_mppt, edit: editOf(store.getState()), openedAt });
    setReplacing(false);
  }

  /** Opens the picker afresh, filtered to *kw* or at rest. */
  function openPicker(kw: readonly [number, number] | null = null) {
    setSuitedKw(kw);
    setOpenings((count) => count + 1);
    setReplacing(true);
  }

  /** An option chosen is an edit of the document; nothing is run (plan/phase-07-plan.md, decision 3). */
  function chooseOption(key: string) {
    store.getState().commit((document) => (document.chosen_option === key ? document : { ...document, chosen_option: key }));
  }

  function choose(volts: Volts) {
    store.getState().commit((document) => withVoltageChosen(document, volts));
  }

  const sizingBy = sizingSetByOf(sizingFieldsOf(project, design));

  return (
    <div className="flex flex-col">
      {/* Where no string length fits, the problem stands at the step's head with a button for each remedy; the likeliest is the step's primary (V2 · 5). */}
      {noStringsFit ? (
        <Problem
          problem={noStringsFit.problem}
          testId="no-strings-fit"
          className="mb-group"
          onAction={(action) => {
            if (action.id === "choose-inverter") openPicker();
            if (action.id === "sizing") openSizing(true);
          }}
        />
      ) : belowTarget ? (
        // Where no option reaches the DC/AC target, the problem stands at the step's head; the inverter for the roof is the step's primary (D118).
        <Problem problem={belowTarget.problem} testId="below-target" className="mb-group" onAction={(action) => {
            if (action.id === "choose-inverter") openPicker(belowTarget.kw);
          }}
        />
      ) : null}
      {isSizing ? (
        <p role="status" data-testid="strings-sizing" className="flex items-center gap-2.5 pb-group type-body-touch desktop:type-body text-text-2">
          <ProgressRing size={16} />
          Sizing the strings · a few seconds
        </p>
      ) : null}
      {/* On phone the colour switch and the legend of the strings are the sheet's head (the board "The Strings step, phone"). */}
      {size === "phone" && option ? <div className="pb-group"><StringLegendInTheSheet /></div> : null}
      {/* The step's matter first (V2 · 6): the options, best first, Add your own in view, the rules behind a link. */}
      <div className="flex flex-col gap-section pb-group empty:hidden">
        {isSizing ? <OptionsWaiting /> : null}
        {view.kind === "sized" && view.noOptions ? <SeriesRange view={view} isUpdating={isUpdating} /> : null}
        {view.kind === "no-voltage" ? null : (
          <>
            <NothingFits view={view} />
            {view.noOptions?.yourOwn && design ? (
              <YourOwn document={project} design={design} onSave={(custom) => store.getState().commit((document) => withCustom(document, custom))} onRemove={() => store.getState().commit(withoutCustom)} />
            ) : null}
            {view.range && !view.noOptions && design ? (
              <div data-testid="strings-sized" data-state={isUpdating ? "updating" : "settled"} className={classNames("flex flex-col gap-1.5", isUpdating && "opacity-updating")}>
                <OptionCards cards={optionCardsOf(design)} proof={proof} bar={bar} onChoose={chooseOption} />
                <YourOwn document={project} design={design} onSave={(custom) => store.getState().commit((document) => withCustom(document, custom))} onRemove={() => store.getState().commit(withoutCustom)} />
                <HowTheOptionsAreMade note={design.options_note ?? null} options={design.options} />
              </div>
            ) : null}
          </>
        )}
      </div>
      <SummaryRow id="strings.inverter" title="Inverter" help="studio.section.inverter" facts={inverter ? inverterFactsOf(inverter.inverter) : null} setBy={wordOf(inverterSetByOf(project, design))}>
        <InverterCard
          inverter={inverter}
          entered={project.imax_mppt_override ?? null}
          onChange={() => openPicker()}
          onTheRoofs={project.inverter_by === "app" ? null : () => store.getState().commit(withTheRoofsInverter)}
        />
      </SummaryRow>
      <SummaryRow
        id="strings.voltage"
        title="System voltage"
        help="studio.section.system-voltage"
        {...(view.kind === "sized" ? { helpValue: String(view.voltage) } : {})}
        {...(words ? { helpMark: words.who } : {})}
        facts={view.kind === "sized" ? `${view.voltage} V` : null}
        setBy={words?.who ?? null}
        opensFirst
      >
        <SystemVoltage voltage={view.kind === "sized" ? view.voltage : null} words={words} onChoose={choose} />
      </SummaryRow>
      {view.kind === "sized" && view.range && !view.noOptions && design && option ? (
        <SummaryRow id="strings.mppt" title="MPPT loading" help="studio.section.mppt-loading" facts={mpptLoadingFactsOf(option)} setBy={null}>
          <div className={classNames(isUpdating && "opacity-updating")}>
            <MpptTable table={mpptTableOf(option, view.voltage, design.equipment.max_current_per_mppt)} onEnterCurrent={enterCurrent} />
          </div>
        </SummaryRow>
      ) : null}
      {view.kind === "no-voltage" ? null : (
        <>
          <SummaryRow id="strings.sizing" title="Sizing temperatures" facts={sizingRowOf(design)} setBy={sizingBy && wordOf(sizingBy)}>
            <SizingTemperatures />
          </SummaryRow>
          <SummaryRow id="strings.limits" title="Inverter limits and cabling" facts={limitsRowOf(project, inverter)} setBy={wordOf(limitsSetByOf(project))}>
            <InverterLimits
              document={project}
              inverter={inverter}
              focusCurrent={focusCurrent}
              onCurrent={(value) => store.getState().commit((document) => withCurrentPerMppt(document, value))}
              onCable={(value) => store.getState().commit((document) => withAcCable(document, value))}
            />
          </SummaryRow>
        </>
      )}
      <InverterPicker key={openings} voltage={project.system_voltage ?? null} open={isReplacing} current={inverter?.inverter.source ?? null} onRead={inverterRead} onClose={() => setReplacing(false)} suitedKw={suitedKw} />
    </div>
  );
}

"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { useId, useState } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import type { InverterResponse } from "@/lib/api";
import { editOf, openedAtOf, projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, designEditOf, designOf, isDesignUpdating } from "@/lib/stores/results-store";
import { displayNameOf, nameOfCountry } from "@/lib/country/country";
import { withCustom, withoutCustom } from "@/lib/studio/custom-fields";
import { inverterShownOf, withInverterRead, type ReplacedInverter } from "@/lib/studio/inverter-card";
import { withAcCable, withCurrentPerMppt } from "@/lib/studio/inverter-fields";
import { mpptTableOf } from "@/lib/studio/mppt-table";
import { optionCardsOf } from "@/lib/studio/option-cards";
import { stringsViewOf } from "@/lib/studio/strings-view";
import { withVoltageChosen } from "@/lib/studio/voltage-choice";
import { voltageWordsOf } from "@/lib/studio/voltage-words";
import type { Volts } from "@/lib/studio/voltages";
import { InverterCard } from "./InverterCard";
import { InverterLimits } from "./InverterLimits";
import { MpptTable } from "./MpptTable";
import { SeriesRange } from "./SeriesRange";
import { SizingTemperatures } from "./SizingTemperatures";
import { StringColourSwitch } from "./StringLegend";
import { InverterPicker } from "./InverterPicker";
import { NothingFits, OptionCards, OptionsNote, YourOwn } from "./StringOptions";
import { SystemVoltage } from "./SystemVoltage";
import { useSize } from "./use-size";

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
  const heading = useId();
  const [isLimitsOpen, setLimitsOpen] = useState(false);
  const [focusCurrent, setFocusCurrent] = useState(0);
  if (!project) return null;
  const view = stringsViewOf({ voltage: project.system_voltage ?? null, design, option });
  // A file read for another design says nothing about this one.
  const inverter = inverterShownOf({ design, designEdit, replaced: replaced?.openedAt === openedAt ? replaced : null });
  // The inverter shown, also one read and not yet run with; the module of the run.
  const ratings = inverter && design ? { inverter: inverter.inverter.vabs_max, module: design.equipment.module.v_max_iec } : null;
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
    setLimitsOpen(true);
    setFocusCurrent((times) => times + 1);
  }

  /** The file read becomes the document's inverter; the card shows it until the run with it lands (step 17). */
  function inverterRead(read: InverterResponse) {
    store.getState().commit((document) => withInverterRead(document, read));
    setReplaced({ inverter: read.inverter, current: read.max_current_per_mppt, edit: editOf(store.getState()), openedAt });
    setReplacing(false);
  }

  /** An option chosen is an edit of the document; nothing is run (plan/phase-07-plan.md, decision 3). */
  function chooseOption(key: string) {
    store.getState().commit((document) => (document.chosen_option === key ? document : { ...document, chosen_option: key }));
  }

  function choose(volts: Volts) {
    store.getState().commit((document) => withVoltageChosen(document, volts));
  }

  return (
    <div className="flex flex-col gap-section tablet:grid tablet:grid-cols-2 tablet:gap-x-8 desktop:flex desktop:flex-col">
      <div className="flex flex-col gap-section">
        {/* On phone the colour switch of the strings is the sheet's first thing (the board "Studio, Strings lens, phone"). */}
        {size === "phone" && option ? <StringColourSwitch fill /> : null}
        <section aria-labelledby={heading} className="flex flex-col gap-2">
          <SectionHeading id={heading} help="studio.section.inverter">
            Inverter
          </SectionHeading>
          <InverterCard
            inverter={inverter}
            entered={project.imax_mppt_override ?? null}
            onChange={() => {
              setOpenings((count) => count + 1);
              setReplacing(true);
            }}
          />
        </section>
        <SystemVoltage voltage={view.kind === "sized" ? view.voltage : null} words={words} onChoose={choose} />
        {view.kind === "sized" ? <SeriesRange view={view} isUpdating={isUpdating} /> : null}
      </div>
      <div className="flex flex-col gap-section">
        {view.kind === "no-voltage" ? null : (
          <>
            <NothingFits view={view} />
            {view.noOptions?.yourOwn && design ? (
              <YourOwn document={project} design={design} onSave={(custom) => store.getState().commit((document) => withCustom(document, custom))} onRemove={() => store.getState().commit(withoutCustom)} />
            ) : null}
            {view.range && !view.noOptions && design ? (
              <div data-testid="strings-sized" data-state={isUpdating ? "updating" : "settled"} className={classNames("flex flex-col gap-1.5", isUpdating && "opacity-updating")}>
                <OptionCards cards={optionCardsOf(design)} onChoose={chooseOption} />
                <YourOwn document={project} design={design} onSave={(custom) => store.getState().commit((document) => withCustom(document, custom))} onRemove={() => store.getState().commit(withoutCustom)} />
                <OptionsNote note={design.options_note ?? null} />
              </div>
            ) : null}
            {view.range && !view.noOptions && design && option ? (
              <div className={classNames(isUpdating && "opacity-updating")}>
                <MpptTable table={mpptTableOf(option, view.voltage, design.equipment.max_current_per_mppt)} onEnterCurrent={enterCurrent} />
              </div>
            ) : null}
            <SizingTemperatures />
            <InverterLimits
              document={project}
              inverter={inverter}
              isOpen={isLimitsOpen}
              onOpen={setLimitsOpen}
              focusCurrent={focusCurrent}
              onCurrent={(value) => store.getState().commit((document) => withCurrentPerMppt(document, value))}
              onCable={(value) => store.getState().commit((document) => withAcCable(document, value))}
            />
          </>
        )}
      </div>
      <InverterPicker key={openings} voltage={project.system_voltage ?? null} open={isReplacing} current={inverter?.inverter.source ?? null} onRead={inverterRead} onClose={() => setReplacing(false)} />
    </div>
  );
}

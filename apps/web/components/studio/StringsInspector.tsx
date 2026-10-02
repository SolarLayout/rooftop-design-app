"use client";

import { useState } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import type { InverterResponse } from "@/lib/api";
import { editOf, openedAtOf, projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, designEditOf, designOf, readoutsOf } from "@/lib/stores/results-store";
import { withCustom, withoutCustom } from "@/lib/studio/custom-fields";
import { inverterShownOf, withInverterRead, type ReplacedInverter } from "@/lib/studio/inverter-card";
import { withAcCable, withCurrentPerMppt } from "@/lib/studio/inverter-fields";
import { mpptTableOf } from "@/lib/studio/mppt-table";
import { optionCardsOf } from "@/lib/studio/option-cards";
import { stringsViewOf, type Volts } from "@/lib/studio/strings-view";
import { InverterCard } from "./InverterCard";
import { InverterLimits } from "./InverterLimits";
import { MpptTable } from "./MpptTable";
import { SeriesRange } from "./SeriesRange";
import { SizingTemperatures } from "./SizingTemperatures";
import { StringColourSwitch } from "./StringLegend";
import { ReplaceInverterDialog } from "./ReplaceInverterDialog";
import { NothingFits, OptionCards, OptionsNote, YourOwn } from "./StringOptions";
import { SystemVoltage, VoltageDecision, WaitingAndDone } from "./SystemVoltage";
import { useSize } from "./use-size";

/** The inverter read from a replaced file, for the design that was open when it was read. */
type Replaced = ReplacedInverter & { openedAt: number | null };

/**
 * The inspector of the Strings lens (the boards "Studio, Strings lens" on three sizes and "Studio, Strings
 * lens, no system voltage yet"): the inverter with Replace; before a system voltage the decision and what waits for it;
 * after, the voltage chosen and the series range with its verdict; where no length fits, what can change it; under the options the MPPT loading of the chosen one; the sizing temperatures and the Voc coefficient; the inverter's limits and cabling. The voltage is the document's, the user's alone (plan/phase-07-plan.md,
 * decision 1): a choice commits it, and the run follows. On phone the strings' colour switch stands first, the stage
 * holding only the legend.
 */
export function StringsInspector() {
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const design = useResults(designOf);
  const readouts = useResults(readoutsOf);
  const option = useResults(chosenOptionOf);
  const size = useSize();
  const openedAt = useProject(openedAtOf);
  const designEdit = useResults(designEditOf);
  const [replaced, setReplaced] = useState<Replaced | null>(null);
  const [isReplacing, setReplacing] = useState(false);
  const [isLimitsOpen, setLimitsOpen] = useState(false);
  const [focusCurrent, setFocusCurrent] = useState(0);
  if (!project) return null;
  const view = stringsViewOf({ voltage: project.system_voltage ?? null, design, readouts, option });
  // A file read for another design says nothing about this one.
  const inverter = inverterShownOf({ design, designEdit, replaced: replaced?.openedAt === openedAt ? replaced : null });

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
    store.getState().commit((document) => (document.system_voltage === volts ? document : { ...document, system_voltage: volts }));
  }

  return (
    <div className="flex flex-col gap-section tablet:grid tablet:grid-cols-2 tablet:gap-x-8 desktop:flex desktop:flex-col">
      <div className="flex flex-col gap-section">
        {/* On phone the colour switch of the strings is the sheet's first thing (the board "Studio, Strings lens, phone"). */}
        {size === "phone" && option ? <StringColourSwitch fill /> : null}
        <InverterCard inverter={inverter} entered={project.imax_mppt_override ?? null} onReplace={() => setReplacing(true)} />
        {view.kind === "before-a-voltage" ? (
          <VoltageDecision view={view} onChoose={choose} />
        ) : (
          <>
            <SystemVoltage voltage={view.voltage} onChoose={choose} />
            <SeriesRange view={view} />
          </>
        )}
      </div>
      <div className="flex flex-col gap-section">
        {view.kind === "before-a-voltage" ? (
          <WaitingAndDone view={view} />
        ) : (
          <>
            <NothingFits view={view} />
            {view.range && !view.noOptions && design ? (
              <div className="flex flex-col gap-1.5">
                <OptionCards cards={optionCardsOf(design)} onChoose={chooseOption} />
                <YourOwn document={project} design={design} onSave={(custom) => store.getState().commit((document) => withCustom(document, custom))} onRemove={() => store.getState().commit(withoutCustom)} />
                <OptionsNote note={design.options_note ?? null} />
                {option ? <MpptTable table={mpptTableOf(option, view.voltage, design.equipment.max_current_per_mppt)} onEnterCurrent={enterCurrent} /> : null}
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
      <ReplaceInverterDialog open={isReplacing} onRead={inverterRead} onClose={() => setReplacing(false)} />
    </div>
  );
}

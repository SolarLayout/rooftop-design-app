"use client";

import { useProject, useResults, useStores } from "@/components/shell/stores";
import { projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, designOf, readoutsOf } from "@/lib/stores/results-store";
import { stringsViewOf, type Volts } from "@/lib/studio/strings-view";
import { InverterCard } from "./InverterCard";
import { SystemVoltage, VoltageDecision, WaitingAndDone } from "./SystemVoltage";

/**
 * The inspector of the Strings lens (the boards "Studio, Strings lens" on three sizes and "Studio, Strings
 * lens, no system voltage yet"): the inverter; before a system voltage the decision and what waits for it;
 * after, the voltage chosen. The voltage is the document's, the user's alone (plan/phase-07-plan.md,
 * decision 1): a choice commits it, and the run follows.
 */
export function StringsInspector() {
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const design = useResults(designOf);
  const readouts = useResults(readoutsOf);
  const option = useResults(chosenOptionOf);
  if (!project) return null;
  const view = stringsViewOf({ voltage: project.system_voltage ?? null, design, readouts, option });
  const inverter = design ? { inverter: design.equipment.inverter, current: design.equipment.max_current_per_mppt } : null;

  function choose(volts: Volts) {
    store.getState().commit((document) => (document.system_voltage === volts ? document : { ...document, system_voltage: volts }));
  }

  return (
    <div className="flex flex-col gap-section tablet:grid tablet:grid-cols-2 tablet:gap-x-8 desktop:flex desktop:flex-col">
      <div className="flex flex-col gap-section">
        <InverterCard inverter={inverter} entered={project.imax_mppt_override ?? null} />
        {view.kind === "before-a-voltage" ? <VoltageDecision view={view} onChoose={choose} /> : <SystemVoltage voltage={view.voltage} onChoose={choose} />}
      </div>
      {view.kind === "before-a-voltage" ? (
        <div className="flex flex-col gap-section">
          <WaitingAndDone view={view} />
        </div>
      ) : null}
    </div>
  );
}

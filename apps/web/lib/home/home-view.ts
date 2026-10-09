// Home (plan/phase-10-plan.md, step 11, decision 5; the boards "Home" on three sizes): what the page shows of the demo and
// of the designs on this device. The demo's card reads its name and its roof from the demo document the API hands out
// (`roofWordsOf`, as every card says a roof); its capacity and energy are the engine's numbers of the untouched demo's run
// on this device, or absent until it has run here. Pure: the components draw what this gives.
import type { Project } from "../api";
import type { DemoRun } from "../device/demo-run";
import { roofWordsOf } from "../device/kept-design";
import { dcCapacity, energy, type Quantity } from "../format/vitals";

export type DemoCard = {
  name: string;
  roofWords: string;
  /** The capacity and the energy of year 1 of the demo's run here; null until it has run on this device. */
  facts: { capacity: Quantity; energy: Quantity } | null;
};

export function demoCardOf(demo: Project, run: DemoRun | null): DemoCard {
  return {
    name: demo.name,
    roofWords: roofWordsOf(demo),
    facts: run === null ? null : { capacity: dcCapacity(run.dcKwp), energy: energy(run.energyMwh) },
  };
}

/** The words of "On this device" on the approved board; where designs are kept, in plain words (#168: a run uses the
 * server, so "nothing leaves this browser" was not true). */
export const APPEAR_HERE = "Designs you save appear here.";
export const KEPT_HERE = "Your designs are kept on this device.";

/** Under the section's label: where the designs appear while there are none; where they are kept, always. */
export function onThisDeviceWordsOf(count: number): string {
  return count === 0 ? `${APPEAR_HERE} ${KEPT_HERE}` : KEPT_HERE;
}

// The words at the bottom left of Present (the board "Present"; plan/phase-10-plan.md, decision 9): the design's name
// with the capacity and the energy of its chosen option, as the card of Home says them; and, while the tour cannot run,
// why: a run on its way in the shell's words, a run without options in the API's title, word for word. Pure.
import { UPDATING_ENERGY } from "../../components/shell/vitals-view";
import type { DesignResult } from "../api";
import { dcCapacity, energy, said } from "../format/vitals";

export type Facts = {
  name: string;
  /** The DC capacity of the chosen option; null before a run with one. */
  dcKwp: number | null;
  /** The energy of year 1 of the same, in MWh; null before a run with one. */
  energyMwh: number | null;
};

/** "Pune demo roof · 357.28 kWp · 617.8 MWh a year"; the name alone before a run with an option. */
export function factsWordsOf({ name, dcKwp, energyMwh }: Facts): string {
  const parts = [name];
  if (dcKwp !== null) parts.push(said(dcCapacity(dcKwp)));
  if (energyMwh !== null) parts.push(`${said(energy(energyMwh))} a year`);
  return parts.join(" · ");
}

type Waiting = {
  /** A run is on its way. */
  isUpdating: boolean;
  /** Why the run has no options, in the API's words; null when it has some, or there is no run. */
  noOptions: DesignResult["no_options"];
};

/** Why the tour waits, in the words that are already the app's; null when there is nothing to say. */
export function waitingWordsOf({ isUpdating, noOptions }: Waiting): string | null {
  if (isUpdating) return UPDATING_ENERGY;
  if (noOptions) return noOptions.title;
  return null;
}

// The rows under "On this device" in the project switcher (plan/phase-10-plan.md, step 5; V2 · 9, audit V2-36): the designs
// kept on this device but the open one, which is listed once, as This design; the newest edited first, each with its name and
// the card's figures under it, or the roof's words before a run. A pure function: the component draws what it gives.
import { cardFiguresOf } from "../../lib/device/card-figures";
import type { KeptDesign } from "../../lib/device/kept-design";

export type DeviceRow = {
  id: string;
  name: string;
  /** "617.8 MWh a year · 357.28 kWp"; the roof's words before a run with a chosen option. */
  fact: string;
};

export function rowsOnTheDeviceOf(designs: readonly KeptDesign[], openId: string | null): DeviceRow[] {
  return [...designs]
    .filter(({ id }) => id !== openId)
    .sort((a, b) => b.editedAt - a.editedAt)
    .map(({ id, name, facts }) => ({ id, name, fact: cardFiguresOf(facts) ?? facts.roofWords }));
}

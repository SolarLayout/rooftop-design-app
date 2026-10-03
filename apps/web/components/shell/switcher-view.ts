// The rows under "On this device" in the project switcher (plan/phase-10-plan.md, step 5): the designs kept on this
// device, the newest edited first, each with its name and one fact at the right. A pure function: the component draws
// what it gives.
import type { KeptDesign } from "../../lib/device/kept-design";
import { dcCapacity, said } from "../../lib/format/vitals";

export type DeviceRow = {
  id: string;
  name: string;
  /** The capacity of the last run, "357.28 kWp"; the roof's words before a run with a chosen option. */
  fact: string;
  /** The design that is open now. */
  isOpen: boolean;
};

export function rowsOnTheDeviceOf(designs: readonly KeptDesign[], openId: string | null): DeviceRow[] {
  return [...designs]
    .sort((a, b) => b.editedAt - a.editedAt)
    .map(({ id, name, facts }) => ({
      id,
      name,
      fact: facts.dcKwp === null ? facts.roofWords : said(dcCapacity(facts.dcKwp)),
      isOpen: id === openId,
    }));
}

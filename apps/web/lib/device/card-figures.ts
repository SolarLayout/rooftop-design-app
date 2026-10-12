// The figures of a design kept on this device, as its card on Home and its row in the project switcher say them (V2 · 9): the
// energy of year 1 and the capacity of its last run; none before one, never 0. Pure.
import { dcCapacity, energy, said } from "../format/vitals";
import type { KeptDesign } from "./kept-design";

export function cardFiguresOf({ dcKwp, energyMwh }: Pick<KeptDesign["facts"], "dcKwp" | "energyMwh">): string | null {
  if (dcKwp === null || energyMwh === null) return null;
  return `${said(energy(energyMwh))} a year · ${said(dcCapacity(dcKwp))}`;
}

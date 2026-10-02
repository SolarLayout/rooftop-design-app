// The inverter card of the Strings lens (the board "Studio, Strings lens"; docs/design/components.md, "Cards"):
// the model, the maker as the OND states it with the power and the MPPTs (plan/phase-07-plan.md, decision 15),
// and the current per MPPT with the inputs. Pure; the card draws what it gives.
import { shown } from "../../components/ui/number-entry";
import type { CurrentPerMppt, Inverter } from "../api";

export type InverterCard = { name: string; line: string; facts: string };

/** The power as the file gives it: whole kilowatts whole, others with their decimals. */
const kilowatts = (kw: number) => `${Number.isInteger(kw) ? shown(kw, 0) : String(kw)} kW`;

/**
 * The card of an inverter, with the current per MPPT of its file and the one the user entered in its place
 * (`imax_mppt_override`), which is the one the strings are sized with.
 */
export function inverterCardOf(inverter: Inverter, ofTheFile: CurrentPerMppt, entered: number | null): InverterCard {
  const current = entered ?? ofTheFile.value_a;
  const perMppt = current === null ? "Current per MPPT not in the OND" : `${shown(current, 1)} A per MPPT${entered === null ? "" : ", entered"}`;
  const inputs = `${shown(inverter.n_inputs, 0)} ${inverter.n_inputs === 1 ? "input" : "inputs"}`;
  return {
    name: inverter.model,
    line: `${inverter.manufacturer} · ${kilowatts(inverter.pnom_kw)} · ${shown(inverter.n_mppt, 0)} MPPT`,
    facts: `${perMppt} · ${inputs}`,
  };
}

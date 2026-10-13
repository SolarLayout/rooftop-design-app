// The inverter for the roof (D118): a new design's inverter is set by the app, and the run takes the one of Waaree's
// on-grid range that keeps the most modules within the DC/AC target on the fewest inverters. Who set it, the way back to
// the app's choice, and the problem where no option of the user's inverter reaches the target. Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignResult, Project, RoofInverter } from "../api";
import type { Problem } from "../errors/problem-of";
import { makerOf } from "../equipment/makers";
import { DEFAULT, fileSetByOf, type SetBy } from "./set-by";

export const CHOSEN_FOR_THE_ROOF: SetBy = { kind: "roof" };

/** The document with its inverter handed back to the app: the user's file and the current entered for it go. */
export function withTheRoofsInverter(document: Project): Project {
  if (document.inverter_by === "app" && !document.ond_text && !document.ond_path && document.imax_mppt_override == null) return document;
  return { ...document, ond_text: "", ond_path: "", inverter_by: "app", imax_mppt_override: null };
}

/** Who set the inverter: the app, for the roof, while the run used the roof's; the app's default when none fits. */
export function inverterSetByOf(document: Project, design: DesignResult | null): SetBy {
  if (document.inverter_by !== "app") return fileSetByOf(document.ond_text);
  return design?.roof_inverter?.in_use ? CHOSEN_FOR_THE_ROOF : DEFAULT;
}

const nameOf = (roof: RoofInverter) => `${makerOf(roof.inverter.manufacturer)} ${roof.inverter.model}`;
const ratioOf = (roof: RoofInverter) => shown(roof.dcac, 2);

export type BelowTargetView = {
  problem: Problem;
  /** The step's primary: the inverter for the roof; none when the range has none. */
  primary: { label: string; line: string } | null;
  /** The AC power that suits the roof's array, in kW: where the picker opens. */
  kw: readonly [from: number, to: number];
};

/** The problem at the Strings step's head where no option reaches the target; null while one does. */
export function belowTargetOf(design: DesignResult | null): BelowTargetView | null {
  const below = design?.below_target;
  if (!below) return null;
  const roof = design.roof_inverter && !design.roof_inverter.in_use ? design.roof_inverter : null;
  const remedy = roof
    ? roof.n_inverters === 1
      ? `${nameOf(roof)} reaches ${ratioOf(roof)} on this roof.`
      : `${roof.n_inverters} × ${nameOf(roof)} reach ${ratioOf(roof)} on this roof.`
    : `Choose an inverter of ${shown(below.ac_kw_from, 0)} to ${shown(below.ac_kw_to, 0)} kW.`;
  return {
    problem: { title: below.title, cause: below.message, remedy, actions: [{ id: "choose-inverter", label: "Choose another inverter" }], details: null },
    primary: roof
      ? {
          label: `Use ${nameOf(roof)}`,
          line: `${roof.n_series} × ${roof.n_strings} · ${roof.n_inverters} ${roof.n_inverters === 1 ? "inverter" : "inverters"} · DC/AC ratio ${ratioOf(roof)}`,
        }
      : null,
    kw: [below.ac_kw_from, below.ac_kw_to],
  };
}
